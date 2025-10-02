# Reward Management System Implementation

## System Overview

The reward management system provides full CRUD capabilities for Guild Masters to create, edit, activate/deactivate, and delete family rewards. The system includes realtime updates to ensure all family members see changes instantly.

**Key Architecture**: Rewards use soft deletion (`is_active` flag) to maintain data integrity with redemption history. The system follows the same proven pattern as the Quest Template system.

## Database Schema

### rewards Table

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type reward_type NOT NULL,  -- ENUM: 'SCREEN_TIME', 'PRIVILEGE', 'PURCHASE', 'EXPERIENCE'
  cost INTEGER NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Reward Types**:
- `SCREEN_TIME`: Extra screen time rewards (📱)
- `PRIVILEGE`: Special privileges (⭐)
- `PURCHASE`: Purchases with family currency (💰)
- `EXPERIENCE`: Special experiences (🎈)

## Row Level Security (RLS) Policies

### View Rewards (SELECT)

```sql
CREATE POLICY "Family members can view family rewards" ON rewards
  FOR SELECT USING (family_id = get_user_family_id());
```

All family members can view their family's rewards.

### Manage Rewards (ALL)

```sql
CREATE POLICY "Guild Masters can manage rewards" ON rewards
  FOR ALL USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );
```

Only Guild Masters can create, update, and delete rewards.

## Realtime Configuration

### Replica Identity

```sql
ALTER TABLE rewards REPLICA IDENTITY FULL;
```

Enables realtime DELETE events to include full row data in `old_record`.

### Publication

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;
```

Rewards are added to the realtime publication for live updates.

## Service Layer

**File**: `lib/reward-service.ts`

### RewardService Class

```typescript
class RewardService {
  // Get active rewards for a family
  async getRewardsForFamily(familyId: string): Promise<Reward[]>
  
  // Create a new reward
  async createReward(input: CreateRewardInput): Promise<Reward>
  
  // Update existing reward
  async updateReward(rewardId: string, input: UpdateRewardInput): Promise<Reward>
  
  // Soft delete (set is_active = false)
  async deleteReward(rewardId: string): Promise<Reward>
  
  // Reactivate reward
  async activateReward(rewardId: string): Promise<Reward>
}
```

**Key Methods**:
- `getRewardsForFamily` - Fetches only active rewards for the quest creation dropdown
- `deleteReward` - Soft deletes by setting `is_active = false` (preserves redemption history)
- `activateReward` - Reactivates previously deactivated rewards

## Realtime Context Integration

**File**: `lib/realtime-context.tsx`

### Added Event Type

```typescript
export type RealtimeEventType =
  | 'quest_updated'
  | 'quest_template_updated'
  | 'character_updated'
  | 'reward_updated'  // NEW
  | 'reward_redemption_updated'
  | 'family_member_updated';
```

### Subscription (lines 225-244)

```typescript
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'rewards',
    filter: `family_id=eq.${familyId}`
  },
  (payload) => {
    const event: RealtimeEvent = {
      type: 'reward_updated',
      table: 'rewards',
      action: payload.eventType,
      record: payload.new,
      old_record: payload.old
    };
    setLastEvent(event);
    rewardUpdateListeners.current.forEach(listener => listener(event));
  }
)
```

### Callback Function (lines 333-338)

```typescript
const onRewardUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
  rewardUpdateListeners.current.add(callback);
  return () => {
    rewardUpdateListeners.current.delete(callback);
  };
}, []);
```

## UI Components

**File**: `components/reward-manager.tsx`

### RewardManager Component (line 23)

**Features**:
- View all active rewards with type icons
- Create new rewards with modal form
- Edit existing rewards
- Soft delete rewards (set is_active = false)
- Reactivate deactivated rewards
- Toggle activation status
- Real-time updates via Supabase subscriptions

**Form Fields**:
- Name (text input)
- Description (textarea)
- Type (select dropdown: SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE)
- Cost (number input for gold cost)

**Realtime Subscription** (lines 67-81):
```typescript
useEffect(() => {
  const unsubscribe = onRewardUpdate((event) => {
    if (event.action === 'INSERT') {
      const newReward = event.record as Reward;
      setRewards((prev) => [newReward, ...prev]);
    } else if (event.action === 'UPDATE') {
      const updatedReward = event.record as Reward;
      setRewards((prev) =>
        prev.map((r) => (r.id === updatedReward.id ? updatedReward : r))
      );
    } else if (event.action === 'DELETE') {
      const deletedId = event.old_record?.id as string;
      setRewards((prev) => prev.filter((r) => r.id !== deletedId));
    }
  });
  return unsubscribe;
}, [onRewardUpdate]);
```

### Dashboard Integration

**File**: `app/dashboard/page.tsx`

Guild Masters see a "Reward Management" tab (lines 308-318) alongside Quest Templates:

```typescript
<button
  onClick={() => setActiveTab('reward-management')}
  className={...}
>
  <span className="hidden sm:inline">⚙️ Reward Management</span>
  <span className="sm:hidden">⚙️ Manage</span>
</button>
```

The tab renders the RewardManager component (lines 342-343).

## Database Migrations

### Migration 20251002000001: Add Rewards Realtime
- Adds rewards table to `supabase_realtime` publication
- Enables live updates for reward changes

### Migration 20251002000002: Set Rewards Replica Identity
- Sets `REPLICA IDENTITY FULL` on rewards table
- Ensures DELETE events include complete row data

## Testing Coverage

### Unit Tests (11/11 passing)
**File**: `tests/unit/rewards/reward-service.test.ts`

- getRewardsForFamily - fetch active rewards, empty array, error handling
- createReward - success, error handling
- updateReward - success, error handling
- deleteReward - soft delete, error handling
- activateReward - reactivation, error handling

### E2E Tests

**File**: `tests/e2e/reward-management.spec.ts` (5 tests)

- Guild Master creates a new reward
- Guild Master edits an existing reward
- Guild Master deactivates and reactivates a reward
- Guild Master deletes a reward
- Validates reward form inputs

**File**: `tests/e2e/reward-realtime.spec.ts` (3 tests)

- Reward creation appears in real-time across browser windows
- Reward updates appear in real-time
- Reward deletion appears in real-time

### Quality Gates (All Passing)
- Build: ✅ Zero errors
- Lint: ✅ Zero warnings
- Unit Tests: ✅ 52/52 passing (includes 11 new reward service tests)
- E2E Tests: Not run (would require dev server)

## Key Design Decisions

1. **Soft Deletion**: Rewards use `is_active` flag to maintain referential integrity with `reward_redemptions` table.

2. **Family-Scoped**: All rewards are isolated by `family_id` using RLS policies.

3. **Guild Master Only**: Only Guild Masters can manage rewards, following the same permission model as Quest Templates.

4. **Realtime Updates**: Full replica identity ensures DELETE events can identify which reward was removed.

5. **Type System**: Rewards have fixed types (SCREEN_TIME, PRIVILEGE, PURCHASE, EXPERIENCE) with associated icons and labels.

6. **Consistent Pattern**: Implementation mirrors Quest Template system for consistency and maintainability.

## Future Enhancements (Phase 6 - Not Implemented)

### Redemption History Validation

**Planned Feature**: Before hard-deleting a reward, check if it has redemption history:

```typescript
// Check for redemptions
const { data: redemptions } = await supabase
  .from('reward_redemptions')
  .select('id')
  .eq('reward_id', rewardId)
  .limit(1);

if (redemptions && redemptions.length > 0) {
  // Show warning: "This reward has redemption history"
  // Only allow soft delete
} else {
  // Allow hard delete if no redemptions
}
```

This feature was planned but not implemented in the initial release.

## References

- Service Layer: `lib/reward-service.ts` (RewardService class)
- UI Component: `components/reward-manager.tsx:23` (RewardManager component)
- Dashboard: `app/dashboard/page.tsx:342-343` (integration)
- Realtime: `lib/realtime-context.tsx:225-244` (subscription), `333-338` (callback)
- Migrations: `supabase/migrations/20251002000001_add_rewards_realtime.sql`, `20251002000002_set_rewards_replica_identity.sql`
- RLS Policies: Already existed in `supabase/migrations/002_row_level_security.sql:193-205`
- Types: `lib/types/database.ts:877-878` (CreateRewardInput, UpdateRewardInput)
