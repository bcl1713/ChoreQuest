# Design: Realtime Dashboard Updates Architecture

## Overview

This design ensures all React components displaying database information use
realtime subscriptions through a centralized hook-based pattern. The
architecture leverages the existing `RealtimeProvider` context and domain-
specific hooks to automatically sync UI state with Supabase changes.

## Architectural Principles

1. **Hook-Centric Data Flow**: All database queries happen through custom hooks
   (`useQuests`, `useRewards`, `useFamilyMembers`, `useBossQuests`,
   `useCharacter`)
2. **Realtime by Default**: Hooks automatically subscribe to relevant tables
   via `useRealtime()` context
3. **Automatic Cleanup**: Subscriptions unsubscribe on component unmount
4. **Database-First Updates**: Character stat changes (XP, gold, honor, gems)
   only display after confirmed in database. No optimistic updates to prevent
   misleading temporary values.
5. **Visual Feedback**: Subtle glow or flash effect applied when realtime
   updates occur to provide user feedback that data is syncing live
6. **Family Isolation**: All subscriptions filter by `family_id` via RLS

## Component Data Hook Mapping

### Existing Hooks (Already Realtime-Enabled)

```text
useQuests()
├── Tables: quest_instances
├── Realtime: onQuestUpdate() - INSERT/UPDATE/DELETE
├── Consumers: QuestDashboard, QuestManagementTab, QuestCreateModal
└── Updates: Quest creation, claiming, completion, approval, denial

useRewards()
├── Tables: rewards, reward_redemptions
├── Realtime: onRewardUpdate(), onRewardRedemptionUpdate()
├── Consumers: RewardStore, RewardManager
└── Updates: Reward creation, redemption, status changes

useFamilyMembers()
├── Tables: user_profiles, characters
├── Realtime: onFamilyMemberUpdate()
├── Consumers: FamilyManagement, GuildMasterManager, QuestCreateModal
└── Updates: Family roster, character profile changes

useBossQuests()
├── Tables: boss_battles, boss_battle_participants
├── Realtime: onBossQuestUpdate(), onBossParticipantUpdate()
├── Consumers: BossQuestPanel, BossQuestActiveCard
└── Updates: Boss quest creation, joining, participation, completion
```

### Hooks Requiring Enhancement

```text
useCharacter()
├── Current: Single character fetch, no realtime
├── Enhancement: Add onCharacterUpdate() subscription
├── Updates: XP, gold, level, class changes
├── Consumers: DashboardContent, CharacterProfile, StatsDisplay
```

## Realtime Subscription Pattern

All custom data hooks follow this pattern:

```typescript
// 1. Load initial data
const loadData = useCallback(async () => {
  // Fetch from Supabase
}, [familyId]);

// 2. Subscribe to changes
useEffect(() => {
  const unsubscribe = onDataUpdate((event) => {
    // Handle INSERT/UPDATE/DELETE optimistically
    setData((current) => { /* update logic */ });
  });
  return unsubscribe; // Cleanup
}, [onDataUpdate, familyId]);
```

## Component Hierarchy & Subscriptions

### Dashboard Layer

```text
DashboardContent (page)
├── useCharacter() → character realtime
├── useQuestTemplates() → quest_templates realtime
├── useRealtime() → onQuestUpdate() for approval overlays
└── Displays: Character stats, quest templates, approval notifications
```

### Quest Management Layer

```text
QuestDashboard (component)
├── useQuests() → quest_instances realtime
├── useFamilyMembers() → user_profiles, characters realtime
├── useCharacter() → current user character realtime
├── useBossQuests() → boss_battles, boss_battle_participants realtime
└── Displays: Quest list, claiming, completion, approval queue
```

### Admin Management Layer

```text
GuildMasterManager (component)
├── useGuildMembers() → user_profiles, characters realtime
└── Displays: Family roster with roles and level/XP
```

### Reward Management Layer

```text
RewardStore (component)
├── useRewards() → rewards, redemptions realtime
└── Displays: Reward catalog, redemption history
```

### Boss Battle Layer

```text
BossQuestPanel (component)
├── useBossQuests() → boss_battles, boss_battle_participants realtime
├── useFamilyMembers() → user_profiles, characters realtime
└── Displays: Active boss quests, participants, join buttons
```

## Data Flow Example: Quest Approval

```text
1. User A approves quest assigned to User B
   └─ API: PATCH /quest-instances/{id} { status: "APPROVED" }

2. Supabase broadcasts INSERT event on quest_instances
   └─ Realtime Channel: INSERT { id, assigned_to_id, status, ... }

3. useQuests() hook receives onQuestUpdate() event
   └─ State: Optimistically update local quest array

4. All components using useQuests() re-render with updated quest
   └─ DashboardContent: Shows quest as approved
   └─ QuestDashboard: Updates quest list and status
   └─ QuestManagementTab: Updates admin view

5. User B's dashboard receives quest approval notification
   └─ If assigned_to_id === user.id, show QuestCompleteOverlay
```

## State Management Strategy

### Local Component State

```typescript
// In useQuests hook:
const [quests, setQuests] = useState<QuestInstance[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Realtime Context

```typescript
// Centralized realtime subscriptions via RealtimeProvider
const { onQuestUpdate, onRewardUpdate, onFamilyMemberUpdate } = useRealtime();
```

### No Redux/External State Management

- Rationale: Hooks provide sufficient state management for UI sync
- Realtime context centralizes subscription logic
- Component-level state sufficient for loading/error states

## Update Latency Target

- **Initial Load**: < 1 second (first page load)
- **Realtime Updates**: < 100ms (after initial load)
- **Approval/Denial**: < 100ms notification to affected users
- **Character Stats**: Depends on server cron job latency (typically 5-10s for
  XP/gold changes)

## Fallback Behavior

If realtime connection drops:

1. User continues to see stale data
2. Manual refresh button available in all views
3. Data reloads on component remount
4. No data loss (queries still work via REST)

## Testing Strategy

### Unit Tests

- Hook data loading and initial state
- Realtime event handling logic (INSERT/UPDATE/DELETE)
- Data transformation and deduplication

### Integration Tests

- Complete data flow from database to component
- Realtime subscription lifecycle
- Error handling and recovery

### E2E Tests

- Multi-user approval workflow with realtime sync
- Quest completion notification propagation
- Character XP/level changes visible across family

## Migration Path

1. **Phase 1**: Audit all data-fetching components
2. **Phase 2**: Add `useCharacter()` realtime subscription
3. **Phase 3**: Update dashboard/admin components to use hooks consistently
4. **Phase 4**: Test and verify all realtime flows work end-to-end
5. **Phase 5**: Remove any direct Supabase queries that should use hooks

## Security & RLS Considerations

- All hooks filter by `family_id` from authenticated user profile
- Supabase RLS policies enforce family isolation at database level
- Realtime subscriptions inherit RLS policies automatically
- No additional authorization checks needed in hooks
