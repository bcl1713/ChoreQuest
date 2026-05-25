# Fix Dashboard Realtime Updates

## Why

Character stats (gold, XP, gems, honor points) and the experience
progress bar on the main dashboard do not update in realtime when
changed by backend operations (e.g., quest approval, reward
redemption). This is because the `CharacterContext` — the source
of truth for the dashboard — responds to realtime events by
performing a full REST refetch rather than merging the event
payload in-place. The refetch is slow (network round-trip, auth
validation, timeout guards) and can be silently dropped by the
`isFetchingRef` deduplication guard if another fetch is already
in-flight. Meanwhile, the separate `useCharacter` hook in
`hooks/useCharacter.ts` correctly merges events in-place but is
not used by the dashboard.

This is a recurring pattern: the quest dashboard had the same
problem (fixed in `dad6aee`/`6b662c2`) where forced reloads
bypassed realtime. The fix should align `CharacterContext` with
the proven in-place merge pattern used by `useQuests`,
`useRewards`, and `useFamilyMembers`, and establish a clear
realtime subscription pattern for the entire app to prevent this
class of bug from recurring.

## What Changes

- **CharacterContext realtime handler**: Replace the
  `fetchCharacter()` call on realtime events with in-place
  state merge of the event payload (matching the pattern in
  `hooks/useCharacter.ts` lines 104-123)
- **Level-up detection on merge**: Preserve the existing
  level-up detection logic when merging character updates
  in-place (compare `previousLevelRef` against merged level)
- **Eliminate duplicate character subscription**: The
  `hooks/useCharacter.ts` hook and `lib/character-context.tsx`
  both subscribe to character updates independently —
  consolidate so there is one canonical source of truth
- **Realtime subscription pattern guide**: Document the
  standard pattern (in-place merge, no refetch on realtime
  events, refetch only on error/recovery) as a spec
  requirement so future features follow it consistently

## Capabilities

### New Capabilities

- `realtime-update-patterns`: Codified standard patterns for
  handling Supabase realtime events across the app — in-place
  merge as default, refetch as fallback, listener lifecycle
  rules

### Modified Capabilities

- `realtime-subscriptions`: Character realtime update
  requirement needs strengthening — mandate in-place merge
  instead of refetch, add requirement for consolidated
  character subscription

## Impact

- **CharacterContext** (`lib/character-context.tsx`): Core
  change — realtime handler rewritten from refetch to merge
- **fetch-character.ts** (`lib/character/fetch-character.ts`):
  May be simplified (no longer called on every realtime event)
- **hooks/useCharacter.ts**: May be deprecated or consolidated
  with CharacterContext
- **Dashboard components**: No changes needed — they already
  consume from CharacterContext
- **StatCard/RealtimeUpdateEffect**: Already wired for visual
  feedback — will work once data actually updates in-place
- **No database/migration changes**: REPLICA IDENTITY FULL is
  already set on the characters table
- **No new dependencies**: Uses existing Supabase realtime
  infrastructure
