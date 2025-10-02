# Quest Template System Implementation

## System Overview

The quest template system provides a blueprint-based architecture for creating quests in ChoreQuest. Templates are reusable patterns that define quest properties, which are copied into quest instances during creation. This design allows templates to be modified or deleted without affecting existing quests.

**Key Architecture Decision**: Templates are blueprints, not permanent references. Quest instances contain all necessary data copied from templates at creation time. The `template_id` field in quest_instances is for tracking/analytics only and is NOT enforced by a foreign key constraint.

## Database Schema

### quest_templates Table

```sql
CREATE TABLE quest_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  difficulty quest_difficulty NOT NULL,  -- ENUM: 'EASY', 'MEDIUM', 'HARD'
  category quest_category NOT NULL,      -- ENUM: 'DAILY', 'WEEKLY', 'BOSS_BATTLE'
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  class_bonuses JSONB,  -- Per-class multipliers for rewards
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### quest_instances.template_id Reference

```sql
-- NOTE: No foreign key constraint - templates are blueprints only
template_id UUID,  -- Optional reference for tracking which template was used

COMMENT ON COLUMN quest_instances.template_id IS 
  'Optional reference to template used for creation (not enforced by FK). 
   Used for analytics and tracking which template was used to create the quest.';
```

## Class Bonuses Structure

Templates include JSONB class_bonuses for character-specific reward multipliers:

```json
{
  "KNIGHT": {"xp": 1.05, "gold": 1.05},
  "MAGE": {"xp": 1.2, "gold": 1.0},
  "ROGUE": {"xp": 1.0, "gold": 1.15},
  "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25},
  "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}
}
```

These multipliers are applied when quests are completed to provide class-specific bonuses.

## Default Template System

### Global Default Templates

10 default quest templates are created with `family_id IS NULL` to serve as global defaults:

1. **Clean Your Room** - EASY, DAILY (50 XP, 25 gold)
2. **Do the Dishes** - EASY, DAILY (50 XP, 25 gold)
3. **Take Out the Trash** - EASY, DAILY (40 XP, 20 gold)
4. **Vacuum the House** - MEDIUM, DAILY (100 XP, 50 gold)
5. **Laundry Duty** - MEDIUM, DAILY (100 XP, 50 gold)
6. **Mow the Lawn** - HARD, DAILY (150 XP, 75 gold)
7. **Weekly Room Deep Clean** - HARD, WEEKLY (200 XP, 100 gold)
8. **Organize the Garage** - HARD, WEEKLY (200 XP, 100 gold)
9. **Help with Grocery Shopping** - MEDIUM, WEEKLY (120 XP, 60 gold)
10. **Walk the Dog** - EASY, DAILY (40 XP, 20 gold)

### Automatic Template Copy Trigger

When a new family is created, all global default templates are automatically copied to that family:

```sql
CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with function owner's permissions to bypass RLS
AS $$
BEGIN
  INSERT INTO quest_templates (
    title, description, xp_reward, gold_reward, difficulty, category,
    family_id, is_active, class_bonuses
  )
  SELECT
    title, description, xp_reward, gold_reward, difficulty, category,
    NEW.id,  -- Assign to the new family
    is_active, class_bonuses
  FROM quest_templates
  WHERE family_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_copy_quest_templates_on_family_insert
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_quest_templates_to_new_family();
```

**Note**: The function uses `SECURITY DEFINER` to bypass RLS policies when copying default templates, as users don't have direct access to templates with `family_id IS NULL`.

## Row Level Security (RLS) Policies

### View Templates (SELECT)

```sql
CREATE POLICY "Family members can view quest templates" ON quest_templates
  FOR SELECT USING (family_id = get_user_family_id());
```

All family members can view their family's templates.

### Manage Templates (ALL)

```sql
CREATE POLICY "Guild Masters and Heroes can manage quest templates" ON quest_templates
  FOR ALL USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('GUILD_MASTER', 'HERO')
    )
  );
```

Guild Masters and Heroes can create, update, and delete templates.

### Explicit Delete Policy

```sql
CREATE POLICY "Guild Masters can delete quest templates" ON quest_templates
  FOR DELETE
  TO authenticated
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('GUILD_MASTER', 'HERO')
    )
  );
```

Added for clarity to ensure template deletion works correctly.

## Realtime Configuration

### Replica Identity

```sql
ALTER TABLE quest_templates REPLICA IDENTITY FULL;
```

This enables realtime DELETE events to include the full row data in `old_record`, allowing clients to identify which template was deleted.

### Publication

Templates are added to the realtime publication for live updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE quest_templates;
```

## Service Layer

**File**: `lib/quest-template-service.ts`

### QuestTemplateService Class

```typescript
class QuestTemplateService {
  // Get active templates for a family
  async getTemplatesForFamily(familyId: string): Promise<QuestTemplate[]>
  
  // Create a new template
  async createTemplate(input: CreateQuestTemplateInput): Promise<QuestTemplate>
  
  // Update existing template
  async updateTemplate(templateId: string, input: UpdateQuestTemplateInput): Promise<QuestTemplate>
  
  // Soft delete (set is_active = false)
  async deleteTemplate(templateId: string): Promise<QuestTemplate>
  
  // Reactivate template
  async activateTemplate(templateId: string): Promise<QuestTemplate>
  
  // Create quest instance from template (copies all fields)
  async createQuestFromTemplate(
    templateId: string,
    createdById: string,
    options?: { assignedToId?: string; dueDate?: string }
  ): Promise<QuestInstance>
}
```

**Key Method**: `createQuestFromTemplate` (line 124)
- Fetches template data
- Copies all fields to new quest_instance
- Sets `template_id` for tracking (not as FK reference)
- Quest remains independent of template after creation

## UI Components

**File**: `components/quest-template-manager.tsx`

### QuestTemplateManager Component (line 17)

**Features**:
- View all family templates
- Create new templates with modal form
- Edit existing templates
- Soft delete templates (set is_active = false)
- Reactivate deactivated templates
- Real-time updates via Supabase subscriptions

**Realtime Subscription** (lines 67-94):
```typescript
useEffect(() => {
  const unsubscribe = onQuestTemplateUpdate((event) => {
    if (event.action === 'INSERT') {
      // Add new template
      setTemplates(prev => [newTemplate, ...prev]);
    } else if (event.action === 'UPDATE') {
      // Update template in list
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    } else if (event.action === 'DELETE') {
      // Remove template (uses old_record from REPLICA IDENTITY FULL)
      setTemplates(prev => prev.filter(t => t.id !== event.old_record?.id));
    }
  });
  return unsubscribe;
}, [onQuestTemplateUpdate]);
```

## Database Migrations

### Migration 013: Create Default Quest Templates
- Creates 10 default templates with `family_id IS NULL`
- Creates trigger function to copy templates to new families
- Creates trigger on families table

### Migration 014: Fix Quest Template Trigger Security
- Adds `SECURITY DEFINER` to trigger function
- Allows function to bypass RLS when copying default templates

### Migration 015: Add Quest Templates Realtime
- Adds quest_templates to realtime publication
- Enables live updates for template changes

### Migration 016: Fix Quest Templates Delete Policy
- Adds explicit DELETE policy for Guild Masters and Heroes
- Ensures template deletion works correctly

### Migration 017: Set Quest Templates Replica Identity
- Sets `REPLICA IDENTITY FULL` on quest_templates
- Enables DELETE events to include full row data

### Migration 018: Remove Template FK Constraint
- **Critical Architecture Change**
- Removes foreign key constraint from `quest_instances.template_id`
- Templates become true blueprints - quest instances are independent
- Allows templates to be deleted without affecting existing quests
- `template_id` kept for analytics/tracking purposes only

## Bug Fixes (Phase 8.5)

### 1. Invalid Refresh Token Error
**Issue**: Console error on home page before login
**Fix**: Improved error handling in auth context

### 2. Template Reactivation Not Appearing
**Issue**: Reactivated templates didn't appear in quest creation dropdown without refresh
**Solution**: Realtime subscription properly updates template list

### 3. Template Deletion Failing
**Issue**: Template deletion failed with empty error object `{}`
**Root Cause**: Missing explicit DELETE policy
**Fix**: Added explicit DELETE policy in migration 016

## Testing Coverage

### E2E Tests (19/19 passing)
- Template CRUD operations
- Realtime updates (INSERT, UPDATE, DELETE)
- Template activation/deactivation
- Quest creation from templates
- Class bonus application
- Family isolation

### Quality Gates (All Passing)
- Build: ✅ Zero errors
- Lint: ✅ Zero warnings
- Unit Tests: ✅ 41/41 passing
- E2E Tests: ✅ 42/42 passing (19 template-specific)

## Key Takeaways

1. **Blueprint Architecture**: Templates are copied, not referenced. Quest instances are fully independent.

2. **No Foreign Key Enforcement**: The `template_id` in quest_instances is for tracking only, allowing templates to be deleted safely.

3. **Default Template System**: New families automatically receive 10 default templates via database trigger.

4. **Realtime Updates**: Full replica identity enables DELETE events with complete row data.

5. **Family-Scoped Security**: RLS policies ensure templates are isolated by family, with role-based permissions.

6. **Soft Deletion**: Templates use `is_active` flag for soft deletion, allowing reactivation.

## References

- Service: `lib/quest-template-service.ts:124` (createQuestFromTemplate)
- UI Component: `components/quest-template-manager.tsx:17` (QuestTemplateManager)
- Migrations: `supabase/migrations/013-018_*.sql`
- RLS Policies: `supabase/migrations/002_row_level_security.sql:80-92`
