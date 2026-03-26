# Tasks: Fix Dashboard Realtime Updates

## 1. CharacterContext In-Place Merge

- [x] 1.1 Replace the realtime handler in
  `lib/character-context.tsx` (lines 100-121) to merge
  `event.record` in-place via
  `setCharacter(prev => ({ ...prev, ...event.record }))`
  instead of calling `fetchCharacter()`
- [x] 1.2 Add level-up detection inside the merge updater:
  compare previous `character.level` against
  `RewardCalculator.calculateLevelFromTotalXP(merged.xp)`
  and fire `setLevelUpEvent` when level increases
- [x] 1.3 Add user_id filtering in the merge handler to
  ignore events for other users
- [x] 1.4 Ensure the `previousLevelRef` is updated after
  each in-place merge to keep level-up detection accurate

## 2. Consolidate Character Subscriptions

- [x] 2.1 Audit all imports of `hooks/useCharacter` across
  the codebase to identify consumers
- [x] 2.2 Migrate consumers of `hooks/useCharacter` to use
  `useCharacter` from `lib/character-context` instead
- [x] 2.3 Remove `hooks/useCharacter.ts` after all consumers
  are migrated
- [x] 2.4 Verify no duplicate realtime listeners exist for
  the characters table at runtime (check console logs)

## 3. Tests

- [x] 3.1 Write unit tests for CharacterContext in-place
  merge: UPDATE event merges fields correctly
- [x] 3.2 Write unit tests for level-up detection during
  in-place merge
- [x] 3.3 Write unit tests for user_id filtering (events
  for other users are ignored)
- [x] 3.4 Write unit tests for DELETE event setting character
  to null
- [x] 3.5 Write unit tests for rapid successive UPDATE events
  both being applied (functional updater correctness)

## 4. Create Realtime Update Patterns Spec

- [x] 4.1 Create `openspec/specs/realtime-update-patterns/`
  directory and `spec.md` from the delta spec in this change
- [x] 4.2 Update the existing
  `openspec/specs/realtime-subscriptions/spec.md` with the
  modified character requirements from this change

## 5. Cleanup and Verification

- [x] 5.1 Remove excessive console.log statements from the
  CharacterContext realtime handler (keep error logs only)
- [x] 5.2 Run quality gates: `npm run build`,
  `npm run lint`, `npm run test`
- [ ] 5.3 Manual verification: approve a quest and confirm
  character stats (gold, XP, gems, honor) update on the
  dashboard without page refresh
