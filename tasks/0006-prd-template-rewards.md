# Product Requirements Document: Template Rewards System

## 1. Introduction/Overview

ChoreQuest currently requires Guild Masters to manually create rewards for their families, which adds friction during initial family setup. This feature will implement a **template rewards system** that mirrors the existing quest template implementation. When a new family is created, a curated set of default rewards will be automatically copied to that family, giving them an instant reward catalog. Families can then modify, deactivate, or add to these rewards as needed.

**Problem Statement**: New families face a cold-start problem where they must manually create all rewards before heroes can redeem anything from the reward store. This increases setup time and may discourage adoption.

**Goal**: Reduce family onboarding time by providing 10-20 pre-configured rewards that are automatically copied to new families during creation, following the exact same pattern as the existing quest template system.

## 2. Goals

1. **Primary Goal**: Automatically populate new families with 10-20 default rewards using a database migration and trigger system
2. **Reduce Setup Time**: Eliminate the need for Guild Masters to manually create basic rewards during family setup
3. **Maintain Flexibility**: Allow families full editing capabilities on copied rewards (name, description, cost, type, active status)
4. **Consistency with Existing Patterns**: Follow the exact implementation pattern established by quest templates (null family_id, trigger-based copying, UUID structure)
5. **Measurable Success**: Reduce average family setup time by providing immediate access to a functional reward store

## 3. User Stories

### US-1: Guild Master Creating a New Family
**As a** Guild Master creating a new family,
**I want** default rewards automatically available in my reward store,
**So that** I don't have to manually create basic rewards before my family can start using the system.

**Acceptance Criteria**:
- When I create a new family, 10-20 rewards are automatically created for my family
- These rewards span all four existing categories: SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE
- The rewards have reasonable default gold costs
- I can immediately see these rewards in the reward store after family creation

### US-2: Guild Master Customizing Template Rewards
**As a** Guild Master who just created a family,
**I want** to edit the auto-generated rewards to match my family's preferences,
**So that** the reward store reflects our specific values and reward structure.

**Acceptance Criteria**:
- I can edit any field of a template reward (name, description, cost, type, active status)
- Changes to copied rewards do not affect the global templates
- I can deactivate rewards that don't fit my family
- I can add new custom rewards beyond the templates

### US-3: Hero Viewing Available Rewards
**As a** Hero in a newly created family,
**I want** to see available rewards immediately,
**So that** I know what I'm working toward and can start redeeming rewards right away.

**Acceptance Criteria**:
- I can view all active template rewards in the reward store without any manual setup
- Each reward shows its cost in gold, description, and category
- I can redeem any reward I can afford (existing redemption logic handles this)

### US-4: Database Administrator Managing Templates
**As a** database administrator,
**I want** template rewards stored with null family_id and predictable UUIDs,
**So that** I can easily identify, update, or add template rewards via migrations.

**Acceptance Criteria**:
- Template rewards have `family_id = NULL`
- Template rewards use predictable UUIDs in the format `00000000-0000-0000-0000-0000000000XX`
- New template rewards can be added via additional migrations
- The trigger automatically copies any template reward (family_id IS NULL) to new families

## 4. Functional Requirements

### FR-1: Database Schema
The existing `rewards` table already supports this feature. No schema changes required.

**Verification**: Confirm the rewards table has:
- `id` (UUID)
- `name` (TEXT)
- `description` (TEXT)
- `type` (reward_type ENUM)
- `cost` (INTEGER) - in gold
- `family_id` (UUID, nullable)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### FR-2: Default Template Rewards Migration
Create a migration file (e.g., `XXX_create_default_reward_templates.sql`) that:

1. Inserts 10-20 default reward templates with:
   - Predictable UUIDs: `00000000-0000-0000-0000-0000000000{01-20}`
   - `family_id = NULL` to indicate global templates
   - `is_active = true`
   - Rewards spanning all four categories:
     - **SCREEN_TIME**: Extra phone/tablet/game time, YouTube/streaming privileges
     - **PRIVILEGE**: Choose dinner, stay up late, skip a chore, friend sleepover
     - **PURCHASE**: Small toy, treat/snack, book, craft supplies
     - **EXPERIENCE**: Movie night, park trip, ice cream outing, game with parent
   - Suggested gold costs ranging from 25 (small rewards) to 500 (large rewards)
   - Clear, family-friendly descriptions

2. Creates a database function `copy_default_reward_templates_to_new_family()` that:
   - Triggers AFTER INSERT on the `families` table
   - Selects all reward templates where `family_id IS NULL`
   - Inserts copies of these templates with:
     - New UUID (auto-generated)
     - `family_id = NEW.id` (the newly created family)
     - All other fields copied from template (name, description, type, cost, is_active)

3. Creates a trigger `trigger_copy_reward_templates_on_family_insert` that:
   - Executes the above function FOR EACH ROW after family insertion
   - Runs automatically - no application code changes needed

**Example SQL Structure** (following quest template pattern):
```sql
-- Insert template reward example
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '30 Minutes Extra Screen Time',
  'Earn 30 additional minutes of screen time for games, videos, or apps.',
  'SCREEN_TIME',
  50,
  NULL,
  true
);

-- Function to copy templates
CREATE OR REPLACE FUNCTION copy_default_reward_templates_to_new_family()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rewards (name, description, type, cost, family_id, is_active)
  SELECT name, description, type, cost, NEW.id, is_active
  FROM rewards
  WHERE family_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run function
CREATE TRIGGER trigger_copy_reward_templates_on_family_insert
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_reward_templates_to_new_family();
```

### FR-3: Reward Template Content
The migration must include 10-20 diverse, family-appropriate rewards:

**Required Diversity**:
- **Category Distribution**: Balanced across SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE
- **Cost Range**: Small (25-75 gold), Medium (100-200 gold), Large (250-500 gold)
- **Appeal Range**: Items that appeal to different ages and interests

**Example Rewards** (representative sample):
- "30 Minutes Extra Screen Time" (SCREEN_TIME, 50 gold)
- "Choose Family Dinner" (PRIVILEGE, 100 gold)
- "Stay Up 30 Minutes Late" (PRIVILEGE, 75 gold)
- "Pick the Movie for Movie Night" (EXPERIENCE, 60 gold)
- "Ice Cream Trip" (EXPERIENCE, 150 gold)
- "Small Toy or Game ($10 value)" (PURCHASE, 200 gold)
- "Friend Sleepover" (PRIVILEGE, 250 gold)
- "Skip One Chore" (PRIVILEGE, 100 gold)
- "YouTube/Netflix Time (1 hour)" (SCREEN_TIME, 100 gold)
- "Trip to the Park" (EXPERIENCE, 120 gold)

### FR-4: Existing Components & Services
**No changes required** to existing React components or services. The reward store (`reward-store.tsx`) already:
- Loads rewards filtered by `family_id` and `is_active = true`
- Supports full CRUD operations via Guild Master admin interface
- Handles reward redemption with gold deduction
- Provides realtime updates via Supabase subscriptions

The template rewards will appear as regular rewards once copied to a family.

### FR-5: Idempotency & Migration Safety
The migration must be:
- **Idempotent**: Safe to run multiple times (use `INSERT ... ON CONFLICT DO NOTHING` or conditional inserts)
- **Backwards compatible**: Should not break existing families or rewards
- **Tested**: Verify on a local Supabase instance before production deployment

## 5. Non-Goals (Out of Scope)

### NG-1: Reward Sharing Between Families
Families cannot share custom rewards with each other. Only global templates (family_id = NULL) are shared via the copy mechanism.

### NG-2: Real-World Integration
No integration with external APIs, gift card systems, or payment processors. Rewards remain virtual concepts managed within ChoreQuest.

### NG-3: Reward Recommendation Engine
No AI or machine learning to suggest personalized rewards based on family behavior or preferences.

### NG-4: Template Reward Updates
Once copied to a family, rewards are independent. Updates to global templates do not propagate to existing families. (Future enhancement: migration system to add new templates to existing families)

### NG-5: Reward Redemption Logic Changes
This feature only creates template rewards. All redemption logic (approval workflow, gold deduction, transaction history) is out of scope and already implemented.

### NG-6: UI Changes
No new UI components required. The existing reward store and admin dashboard already support displaying and managing rewards.

## 6. Design Considerations

### DC-1: Database Pattern Consistency
- **Follow Quest Template Pattern**: Use identical approach as `013_create_default_quest_templates.sql`
- **Template Identification**: `family_id IS NULL` identifies global templates
- **UUID Format**: Use `00000000-0000-0000-0000-0000000000XX` for easy identification
- **Trigger-based Copying**: Automatic, no application code changes

### DC-2: Family Customization
- Copied rewards are **fully editable** by Guild Masters
- Changes do not affect global templates
- Families can deactivate unwanted rewards (`is_active = false`)
- Families can add unlimited custom rewards beyond templates

### DC-3: Content Guidelines
- **Family-Friendly**: All rewards appropriate for all ages
- **Culturally Neutral**: Avoid culturally-specific rewards when possible
- **Clear Descriptions**: Each reward clearly states what the hero receives
- **Balanced Costs**: Gold costs roughly proportional to reward value/effort

## 7. Technical Considerations

### TC-1: Database Migration
- **Migration File**: `supabase/migrations/XXX_create_default_reward_templates.sql`
- **Ordering**: Must run after `001_initial_schema.sql` (rewards table exists)
- **Testing**: Test on local Supabase before production deployment

### TC-2: Existing Families
- **Retroactive Application**: The trigger only fires for NEW families created after migration
- **Optional Enhancement**: Create a separate migration/script to backfill existing families with templates

### TC-3: Performance
- **Minimal Impact**: Inserting 10-20 rewards per family is negligible
- **Trigger Efficiency**: Single INSERT...SELECT statement per family creation
- **No N+1 Queries**: Trigger runs once per family, not per reward

### TC-4: Row-Level Security (RLS)
- **Assumption**: Existing RLS policies allow families to read/write their own rewards
- **Template Access**: Templates (family_id = NULL) do not need RLS policies since they're only accessed by the trigger
- **Verification**: Test that Guild Masters can modify copied rewards via existing admin interface

## 8. Success Metrics

### Primary Metric
**Reduce Setup Time**: Measure average time from family creation to first reward redemption. Target: 50% reduction compared to pre-template baseline.

### Secondary Metrics
1. **Adoption Rate**: Percentage of new families that use at least one template reward (target: >80%)
2. **Customization Rate**: Percentage of families that edit at least one template reward (indicates engagement)
3. **Template Coverage**: Percentage of redemptions that use template-based rewards vs. custom rewards
4. **Deactivation Rate**: Percentage of template rewards that families deactivate (indicates relevance of templates)

### Success Criteria
- 90%+ of new families have template rewards successfully copied
- Zero migration failures or data corruption
- Existing families unaffected by migration
- Guild Masters report faster setup in qualitative feedback

## 9. Open Questions

### OQ-1: Retroactive Application to Existing Families
**Question**: Should we backfill template rewards to families created before this feature?
**Decision Needed**: Yes/No, and if yes, how to handle potential conflicts with existing rewards

**Recommendation**: Start with new families only. Offer optional "Import Template Rewards" button in admin UI for existing families.

### OQ-2: Template Updates Over Time
**Question**: How do we add new template rewards in future releases without affecting existing families?
**Decision Needed**: Process for updating the template catalog

**Recommendation**: Additional migrations can add new templates (NULL family_id). Only newly-created families receive them. Existing families can optionally import via admin UI.

### OQ-3: Localization/Internationalization
**Question**: Should reward names/descriptions support multiple languages?
**Decision Needed**: Timeline and scope for i18n support

**Recommendation**: Out of scope for initial release. English-only templates. (Future enhancement: i18n support with translation keys)

### OQ-4: Custom Template Sets
**Question**: Should different family types get different template sets? (e.g., "family with young kids" vs. "family with teens")
**Decision Needed**: Complexity vs. personalization tradeoff

**Recommendation**: Out of scope for MVP. Single universal template set. (Future enhancement: template set selection during family creation)

---

## Implementation Checklist

- [ ] Create migration file `XXX_create_default_reward_templates.sql`
- [ ] Design and write 10-20 default reward templates
- [ ] Implement `copy_default_reward_templates_to_new_family()` function
- [ ] Implement `trigger_copy_reward_templates_on_family_insert` trigger
- [ ] Test migration on local Supabase instance
- [ ] Verify template rewards copy to new test family
- [ ] Verify Guild Master can edit copied rewards
- [ ] Verify existing families unaffected
- [ ] Write integration test for template copying
- [ ] Update documentation (if needed)
- [ ] Deploy migration to production
- [ ] Monitor for errors/issues post-deployment

---

## References

- **Quest Template Implementation**: `supabase/migrations/013_create_default_quest_templates.sql`
- **Rewards Table Schema**: `supabase/migrations/001_initial_schema.sql` (lines 133-144)
- **Existing Reward Store**: `components/reward-store.tsx`
- **Reward Types**: SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE

---

**Document Version**: 1.0
**Created**: 2025-10-10
**Status**: Approved for Implementation
