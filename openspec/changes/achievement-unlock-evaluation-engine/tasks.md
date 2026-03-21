# Achievement Unlock Evaluation Engine — Tasks

## 1. Evaluation Strategy Functions (Pure Logic)

- [x] 1.1 Create `lib/achievement-progress/unlock-evaluator.ts`
  with types for evaluation strategies and the strategy
  dispatch function
- [x] 1.2 Implement `evaluateThreshold` strategy function
  (`current >= threshold`)
- [x] 1.3 Implement `evaluateBoolean` strategy function
  (`current > 0`, truthy)
- [x] 1.4 Implement `evaluateCompound` strategy function
  (AND/OR over sub-conditions using EVALUATOR_REGISTRY)
- [x] 1.5 Implement strategy dispatch that reads
  `criteria_config.evaluation_strategy` and defaults to
  `"threshold"`, with warning on unknown strategy
- [x] 1.6 Write unit tests for threshold strategy
  (met-at, met-above, not-met-below, zero-threshold)
- [x] 1.7 Write unit tests for boolean strategy
  (truthy with positive, truthy with large, falsy with zero)
- [x] 1.8 Write unit tests for compound strategy
  (AND-all-met, AND-partial, OR-one-met, OR-none-met,
  boolean sub-condition, default AND operator)
- [x] 1.9 Write unit tests for strategy dispatch
  (default threshold, explicit strategies, unknown fallback)

## 2. Compound Evaluator in Registry

- [x] 2.1 Add `compound` to `ALL_CRITERIA_TYPES` in
  `lib/achievement-progress/evaluators.ts`
- [x] 2.2 Implement compound evaluator function that
  delegates to sub-evaluators from EVALUATOR_REGISTRY
  and returns composite `{ current }` result
- [x] 2.3 Register compound evaluator in EVALUATOR_REGISTRY
- [x] 2.4 Handle unknown sub-condition criteria types
  (log warning, treat as not met)
- [x] 2.5 Write unit tests for compound evaluator
  (delegation, unknown sub-type handling)

## 3. Compound Progress JSONB Shape

- [x] 3.1 Update progress upsert logic to produce compound
  JSONB shape (`{ conditions: [...], met: boolean }`)
  for compound-type achievements
- [x] 3.2 Write unit tests for compound progress shape
  (mixed results, all met)

## 4. Expand fetchAchievements Query

- [x] 4.1 Add `xp_reward`, `gold_reward`, and `name` to
  the `fetchAchievements` SELECT in
  `lib/achievement-progress-service.ts`
- [x] 4.2 Update TypeScript types for the fetched
  achievement shape to include reward fields
- [x] 4.3 Write unit test verifying reward fields are
  present in fetched achievement data

## 5. Unlock Detection and unlocked_at Write

- [x] 5.1 After progress upsert, fetch existing
  `unlocked_at` values for the upserted achievement IDs
- [x] 5.2 Apply strategy dispatch to each upserted row to
  determine if criteria are met
- [x] 5.3 Filter to achievements where criteria are met
  AND `unlocked_at IS NULL` (newly eligible)
- [x] 5.4 Batch update `unlocked_at = now()` on
  newly-eligible rows using service-role write client
  with `unlocked_at IS NULL` filter for concurrency
  safety
- [x] 5.5 Write unit tests for unlock detection
  (newly met, already unlocked skip, below threshold
  skip, compound met-flag unlock)
- [x] 5.6 Write unit tests for concurrent unlock safety
  (IS NULL filter prevents double-unlock)

## 6. Reward Granting

- [x] 6.1 Sum `xp_reward` and `gold_reward` across all
  newly-unlocked achievements
- [x] 6.2 Skip character stats update when total rewards
  are zero
- [x] 6.3 Fetch character's current XP, gold, and level
  before updating
- [x] 6.4 Call `RewardCalculator.calculateLevelUp()` with
  current XP, summed XP reward, and current level
- [x] 6.5 Increment `characters.xp`, `characters.gold`,
  and optionally `characters.level` in a single update
- [x] 6.6 Write unit tests for reward granting (single
  unlock, multiple unlock summing, zero-reward skip)
- [x] 6.7 Write unit tests for level-up from XP rewards
  (triggers level-up, no level-up when insufficient XP)

## 7. Level-Up Cascade

- [x] 7.1 After stats update with level change, re-evaluate
  `level_reached` criteria for the character
- [x] 7.2 If cascade produces new unlocks, repeat the
  unlock + reward flow (bounded to prevent infinite loops)
- [x] 7.3 Write unit tests for level-up cascade
  (cascade unlocks level achievement, no cascade when
  no level change)

## 8. Integration into updateProgress

- [x] 8.1 Wire unlock evaluation as a post-step in
  `updateProgress` after the progress upsert succeeds
- [x] 8.2 Wrap unlock evaluation in try/catch so failures
  are logged but do not cause `updateProgress` to throw
- [x] 8.3 Ensure retroactive backfill path also runs
  unlock evaluation against all backfilled progress
- [x] 8.4 Write integration tests for updateProgress
  end-to-end (progress + unlock + rewards in one call)
- [x] 8.5 Write tests for unlock evaluation failure being
  non-blocking (progress persists, error logged)

## 9. Idempotency Tests

- [x] 9.1 Write test: duplicate `updateProgress` call
  produces no additional unlocks or rewards
- [x] 9.2 Write test: re-evaluation of already-unlocked
  achievement is a no-op

## 10. Compound Achievement Seed Migration

- [x] 10.1 Create new Supabase migration file for compound
  seed achievements
- [x] 10.2 Seed one AND compound achievement (e.g.,
  "Complete 5 quests AND reach level 3")
- [x] 10.3 Seed one OR compound achievement (e.g.,
  "Defeat 3 bosses OR earn 500 gold")
- [x] 10.4 Assign compound achievements to appropriate
  categories with non-zero XP/gold rewards
- [x] 10.5 Write migration test validating compound
  seed data structure

## 11. Quality Gate

- [x] 11.1 Run `npm run build` — zero TypeScript errors
- [x] 11.2 Run `npm run lint` — zero lint errors
- [x] 11.3 Run `npm run test` — all tests pass
