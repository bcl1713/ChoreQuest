# Achievement Progress Tracking Tasks

## 1. Types and Interfaces

- [x] 1.1 Define event types and event payload
  interface (`QUEST_APPROVED`, `REWARD_APPROVED`,
  `BOSS_COMPLETED`)
- [x] 1.2 Define `EvaluatorFn` type signature
  `(client, characterId, userId, criteriaConfig?)`
  returning `{ current: number }`
- [x] 1.3 Define event-to-criteria-type mapping
  (which event triggers which evaluators)

## 2. AchievementProgressService Skeleton

- [x] 2.1 Create
  `lib/achievement-progress-service.ts` with
  constructor accepting optional
  `SupabaseClient<Database>` for reads
  (defaulting to service-role). Writes to
  `character_achievements` always use a
  separate service-role client via
  `createServiceSupabaseClient()` regardless
  of injected read client
- [x] 2.2 Implement `resolveUserId(characterId)`
  helper that queries `characters.user_id`
- [x] 2.3 Implement `fetchAchievements()` to load
  all achievements from the `achievements` table
- [x] 2.4 Implement backfill detection: query
  `character_achievements` count for character,
  branch on zero vs non-zero
- [x] 2.5 Implement `updateProgress(characterId,
  event)` orchestration: resolve user ID, detect
  backfill, select evaluators, run evaluators,
  batch upsert results. On first-run backfill,
  all rows must be written in a single atomic
  batch upsert — partial failure must leave
  zero rows so the next call retries the full
  backfill
- [x] 2.6 Ensure progress upserts write only the
  `progress` column and do not overwrite
  `unlocked_at` (use column-scoped upsert or
  explicit column list)
- [x] 2.7 Implement `getProgress(characterId)`
  method joining `character_achievements` with
  achievement metadata

## 3. Evaluators — Quest-Related

- [x] 3.1 Write tests for `quest_complete`
  evaluator (approved count, zero, non-approved
  excluded)
- [x] 3.2 Implement `quest_complete` evaluator:
  COUNT `quest_instances` where
  (`assigned_to_id` = userId OR
  `volunteered_by` = characterId) AND
  `status` = 'APPROVED'
- [x] 3.3 Write tests for `quest_volunteer`
  evaluator (volunteer count, assigned-only
  excluded)
- [x] 3.4 Implement `quest_volunteer` evaluator:
  COUNT `quest_instances` where
  `volunteered_by` = characterId AND
  `status` = 'APPROVED'
- [x] 3.5 Write tests for `quest_difficulty`
  evaluator (matching difficulty, non-matching
  excluded)
- [x] 3.6 Implement `quest_difficulty` evaluator:
  COUNT with additional `difficulty` filter from
  `criteria_config`

## 4. Evaluators — Boss-Related

- [x] 4.1 Write tests for `boss_defeated`
  evaluator (approved participations, non-approved
  excluded)
- [x] 4.2 Implement `boss_defeated` evaluator:
  COUNT `boss_battle_participants` where
  `user_id` = userId AND
  `participation_status` = 'APPROVED'
- [x] 4.3 Write tests for `boss_participated`
  evaluator (all participations regardless of
  status)
- [x] 4.4 Implement `boss_participated` evaluator:
  COUNT `boss_battle_participants` where
  `user_id` = userId

## 5. Evaluators — Economy

- [x] 5.1 Write tests for `gold_earned` evaluator
  (quest gold + boss gold, zero case)
- [x] 5.2 Implement `gold_earned` evaluator: SUM
  `quest_instances.gold_reward` (approved) + SUM
  `boss_battle_participants.awarded_gold`
  (approved)
- [x] 5.3 Write tests for `gold_spent` evaluator
  (approved/fulfilled only, pending excluded)
- [x] 5.4 Implement `gold_spent` evaluator: SUM
  `reward_redemptions.cost` where status IN
  ('APPROVED', 'FULFILLED')
- [x] 5.5 Write tests for `reward_redeemed`
  evaluator (count confirmed redemptions)
- [x] 5.6 Implement `reward_redeemed` evaluator:
  COUNT `reward_redemptions` where status IN
  ('APPROVED', 'FULFILLED')

## 6. Evaluators — Growth and Dedication

- [x] 6.1 Write tests for `xp_earned` evaluator
  (reads character XP)
- [x] 6.2 Implement `xp_earned` evaluator: read
  `characters.xp` where `id` = characterId
- [x] 6.3 Write tests for `level_reached`
  evaluator (reads character level)
- [x] 6.4 Implement `level_reached` evaluator:
  read `characters.level` where
  `id` = characterId
- [x] 6.5 Write tests for `streak_reached`
  evaluator (max longest_streak, no records case)
- [x] 6.6 Implement `streak_reached` evaluator:
  MAX `character_quest_streaks.longest_streak`
  where `character_id` = characterId

## 7. Evaluators — Backfill-Only

- [x] 7.1 Write tests for `class_change` evaluator
  (always returns 0)
- [x] 7.2 Implement `class_change` evaluator:
  return `{ current: 0 }`
- [x] 7.3 Write tests for `honor_earned` evaluator
  (reads honor_points, null/zero case)
- [x] 7.4 Implement `honor_earned` evaluator: read
  `characters.honor_points` where
  `id` = characterId

## 8. Service-Level Tests

- [x] 8.1 Write tests for `updateProgress`
  orchestration: correct evaluators called per
  event type
- [x] 8.2 Write tests for backfill path: all 13
  evaluators run when no
  `character_achievements` rows exist
- [x] 8.3 Write tests for scoped path: only
  event-mapped evaluators run when rows already
  exist
- [x] 8.4 Write tests for progress JSONB shape:
  `{ current: N, threshold: T }` written
  correctly
- [x] 8.5 Write tests for upsert behavior: insert
  on first write, update on subsequent
- [x] 8.6 Write tests for idempotency: duplicate
  calls produce identical progress
- [x] 8.7 Write tests for invalid character ID:
  throws error, no rows modified
- [x] 8.8 Write tests for unknown criteria type:
  logs warning, skips without failing
- [x] 8.9 Write tests for `getProgress` method:
  returns joined data, empty array for no
  progress
- [x] 8.10 Write test for atomic backfill: when
  batch upsert fails during first-run backfill,
  zero `character_achievements` rows remain so
  the next call retries the full backfill
- [x] 8.11 Write test for `unlocked_at`
  preservation: progress recomputation does not
  overwrite an existing `unlocked_at` value
- [x] 8.12 Write test for split client model:
  injected read client is used for evaluator
  queries and character lookups; service-role
  client is always used for
  `character_achievements` upserts

## 9. Quest Approval Integration

- [x] 9.1 Write tests for quest approval
  integration: `updateProgress` called after
  stats update, failure does not block approval
- [x] 9.2 Add `updateProgress` call to
  `lib/quest-instance/approve-quest.ts` inside
  try/catch after character stats update

## 10. Boss Completion Integration

- [x] 10.1 Write tests for boss completion
  integration: `updateProgress` called per
  participant, one failure isolated from others
- [x] 10.2 Add `updateProgress` call to
  `app/api/boss-quests/[id]/complete/route.ts`
  for each participant inside try/catch after
  their character stats are updated

## 11. Reward Approval Integration

- [x] 11.1 Create internal API route at
  `app/api/achievement-progress/evaluate/route.ts`
  that authenticates caller, resolves character
  ID, accepts only `REWARD_APPROVED` event type,
  and calls `updateProgress`
- [x] 11.2 Write tests for the internal API route:
  auth check, character resolution,
  success/error responses, and rejection of
  unsupported event types (non-`REWARD_APPROVED`
  requests return 400)
- [x] 11.3 Add fetch call to
  `useRewardStoreActions.ts` that calls the
  evaluate route only after successful
  redemption approval (not on denial),
  fire-and-catch on client side
- [x] 11.4 Write tests for reward hook integration:
  route called on approval only, not called on
  denial, failure non-blocking

## 12. Quality Gates

- [x] 12.1 Verify all tests pass (`npm run test`)
- [x] 12.2 Verify build succeeds (`npm run build`)
- [x] 12.3 Verify lint passes (`npm run lint`)
