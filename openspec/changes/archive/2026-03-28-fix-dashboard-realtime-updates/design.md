# Design: Fix Dashboard Realtime Updates

## Context

The ChoreQuest dashboard displays character stats (gold, XP,
gems, honor points) and an XP progress bar via `CharacterContext`
(`lib/character-context.tsx`). When a backend operation changes
these values (e.g., quest approval awards XP and gold), the
realtime subscription in `CharacterContext` fires but triggers a
full REST refetch via `fetchCharacter()` instead of merging the
event payload in-place.

This refetch pattern has three problems:

1. **Latency**: Network round-trip adds 100-500ms delay on top
   of the realtime event that already contains the new data
2. **Dropped updates**: The `isFetchingRef` guard silently
   skips fetches if one is already in-flight, meaning rapid
   successive updates (e.g., multiple quests approved) can be
   lost
3. **Race conditions**: The refetch result can arrive after a
   newer realtime event, causing stale data to overwrite fresh
   data

Meanwhile, a separate `useCharacter` hook
(`hooks/useCharacter.ts`) correctly merges realtime events
in-place but is not used by the dashboard — it exists alongside
`CharacterContext` as a duplicate subscription.

The proven pattern already exists in the codebase: `useQuests`,
`useRewards`, and `useFamilyMembers` all merge realtime event
payloads in-place without refetching.

## Goals / Non-Goals

**Goals:**

- Character stats update instantly on the dashboard when
  realtime events arrive (in-place merge, no refetch)
- Level-up detection continues to work when stats are merged
  in-place
- Single canonical character subscription (eliminate the
  duplicate `useCharacter` hook or clearly separate concerns)
- Documented realtime update pattern that future features
  can follow to avoid this class of bug

**Non-Goals:**

- Changing the realtime channel infrastructure (one channel
  per table pattern is working well)
- Adding optimistic updates (the app correctly waits for
  database confirmation)
- Modifying the initial character fetch flow (only the
  realtime update handler changes)
- Changing the `fetchCharacter` function itself (it remains
  for initial load and error recovery)

## Decisions

### Decision 1: In-place merge in CharacterContext

**Choice**: Replace `fetchCharacter()` call in the realtime
handler with direct state merge using `setCharacter()`.

**Rationale**: This matches the proven pattern used by
`useQuests` (lines 85-109 of `hooks/useQuests.ts`),
`useRewards`, and `useFamilyMembers`. The realtime event
payload from Supabase already contains the full row data
(thanks to REPLICA IDENTITY FULL), so refetching is redundant.

**Pattern**:

```typescript
const unsubscribe = onCharacterUpdate((event) => {
  if (event.record?.user_id !== user.id) return;

  if (event.action === 'UPDATE' || event.action === 'INSERT') {
    setCharacter((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...event.record };
      // Level-up detection
      const newLevel = RewardCalculator
        .calculateLevelFromTotalXP(merged.xp ?? 0);
      merged.level = Math.max(1, newLevel);
      return merged;
    });
  }
});
```

**Alternative considered**: Keep refetch but remove the
`isFetchingRef` guard — rejected because refetch still adds
unnecessary latency and the event payload already has the data.

### Decision 2: Inline level-up detection in merge

**Choice**: Move level-up detection into the `setCharacter`
updater function so it happens synchronously during merge.

**Rationale**: Currently level-up detection lives in
`fetch-character.ts` and compares `previousLevelRef` against
the fetched level. With in-place merge, we can compare the
previous state's level against the merged level directly
inside the updater, eliminating the need for a separate ref.

### Decision 3: Deprecate hooks/useCharacter.ts

**Choice**: Remove the standalone `useCharacter` hook and have
all consumers use `CharacterContext` via
`import { useCharacter } from '@/lib/character-context'`.

**Rationale**: Two independent subscriptions to the same table
creates confusion about which is the source of truth. The
context-based approach is the right one because it provides
app-wide state sharing. The hook's in-place merge logic moves
into `CharacterContext`.

**Migration**: Find all imports of `hooks/useCharacter` and
switch them to `lib/character-context`. The API shape differs
slightly (`loading` vs `isLoading`, `reload` vs
`refreshCharacter`), so call sites need minor updates.

### Decision 4: Establish realtime update pattern spec

**Choice**: Create a `realtime-update-patterns` spec that
codifies the standard approach for handling realtime events.

**Rationale**: This is the third time a realtime update bug
has been caused by the same anti-pattern (refetch instead of
merge). A spec prevents future features from repeating it.

**Core rules**:

1. Realtime handlers MUST merge event payloads in-place
2. Realtime handlers MUST NOT trigger refetches on success
3. Refetch is reserved for initial load and error recovery
4. State updaters MUST use functional form
   (`setState(prev => ...)`) to avoid stale closures
5. Listeners MUST filter by relevant ID before updating

## Risks / Trade-offs

**[Risk] Partial event payloads**: If Supabase ever sends a
partial row in the event payload, in-place merge could lose
fields. Mitigation: REPLICA IDENTITY FULL is set on the
characters table, guaranteeing full row data in events. Add a
defensive check that the merged object has all expected fields.

**[Risk] Level calculation divergence**: The level is
currently calculated server-side AND client-side via
`RewardCalculator.calculateLevelFromTotalXP()`. If these
diverge, the merged level could flicker. Mitigation: Always
use the client-side calculation as authoritative (matching
current `fetch-character.ts` behavior at line 180-183).

**[Risk] Breaking useCharacter consumers**: Removing
`hooks/useCharacter.ts` could break imports in components
we haven't identified. Mitigation: Search all imports before
removing; update the exports from `character-context.tsx` to
match the expected API shape where possible.

**[Trade-off] Losing retry logic on realtime path**: The
current refetch has retry logic with exponential backoff. With
in-place merge, retries aren't needed (the event either
arrives or it doesn't). If an event is missed entirely, the
next event or a manual refresh will correct the state. This
is acceptable because Supabase realtime is reliable within
a connected session.
