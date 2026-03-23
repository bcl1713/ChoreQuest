# achievement-unlock-evaluation Specification

## Purpose

Define the evaluation engine that determines when an
achievement's criteria are met, triggers the unlock by
setting `unlocked_at`, and grants XP/gold rewards to
the character.

## Requirements

### Requirement: Evaluation strategy dispatch

The engine SHALL support three evaluation strategies:
`threshold`, `boolean`, and `compound`. The strategy
SHALL be determined by the `evaluation_strategy` field
in `criteria_config`, defaulting to `"threshold"` when
absent.

#### Scenario: Default strategy is threshold

- **WHEN** an achievement has no `evaluation_strategy`
  field in `criteria_config`
- **THEN** the engine SHALL use the `threshold`
  strategy

#### Scenario: Explicit threshold strategy

- **WHEN** an achievement has
  `criteria_config.evaluation_strategy` set to
  `"threshold"`
- **THEN** the engine SHALL use the `threshold`
  strategy

#### Scenario: Boolean strategy

- **WHEN** an achievement has
  `criteria_config.evaluation_strategy` set to
  `"boolean"`
- **THEN** the engine SHALL use the `boolean` strategy

#### Scenario: Compound strategy

- **WHEN** an achievement has
  `criteria_config.evaluation_strategy` set to
  `"compound"`
- **THEN** the engine SHALL use the `compound` strategy

#### Scenario: Unknown strategy falls back to threshold

- **WHEN** an achievement has an unrecognized
  `evaluation_strategy` value
- **THEN** the engine SHALL fall back to the
  `threshold` strategy and log a warning

### Requirement: Threshold evaluation

The threshold strategy SHALL compare the evaluator's
`current` value against the `threshold` value from
`criteria_config`. The achievement is met when
`current >= threshold`.

#### Scenario: Criteria met exactly at threshold

- **WHEN** an evaluator returns `{ current: 10 }` and
  the achievement has
  `criteria_config: { "threshold": 10 }`
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: Criteria met above threshold

- **WHEN** an evaluator returns `{ current: 15 }` and
  the achievement has
  `criteria_config: { "threshold": 10 }`
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: Criteria not met below threshold

- **WHEN** an evaluator returns `{ current: 7 }` and
  the achievement has
  `criteria_config: { "threshold": 10 }`
- **THEN** the engine SHALL determine the criteria are
  NOT met

#### Scenario: Zero threshold is always met

- **WHEN** an achievement has
  `criteria_config: { "threshold": 0 }` and the
  evaluator returns `{ current: 0 }`
- **THEN** the engine SHALL determine the criteria are
  met

### Requirement: Boolean evaluation

The boolean strategy SHALL check whether the
evaluator's `current` value is truthy (`current > 0`).
No `threshold` field is required in `criteria_config`.

#### Scenario: Boolean criteria met with positive value

- **WHEN** an evaluator returns `{ current: 1 }` for
  a boolean-strategy achievement
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: Boolean criteria met with large value

- **WHEN** an evaluator returns `{ current: 5 }` for
  a boolean-strategy achievement
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: Boolean criteria not met with zero

- **WHEN** an evaluator returns `{ current: 0 }` for
  a boolean-strategy achievement
- **THEN** the engine SHALL determine the criteria are
  NOT met

### Requirement: Compound evaluation

The compound strategy SHALL evaluate multiple
sub-conditions and combine them using the `operator`
field in `criteria_config` (`"AND"` or `"OR"`). Each
sub-condition in the `conditions` array SHALL reference
a `criteria_type` and either a `threshold` (numeric
comparison) or `boolean: true` (truthy check). The
engine SHALL reuse the existing `EVALUATOR_REGISTRY`
functions to evaluate each sub-condition.

#### Scenario: AND compound with all conditions met

- **WHEN** a compound achievement has
  `operator: "AND"` with conditions
  `[{ criteria_type: "quest_complete", threshold: 5 },
  { criteria_type: "level_reached", threshold: 3 }]`
  and the evaluators return `{ current: 7 }` and
  `{ current: 4 }` respectively
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: AND compound with one condition unmet

- **WHEN** a compound achievement has
  `operator: "AND"` with conditions
  `[{ criteria_type: "quest_complete", threshold: 5 },
  { criteria_type: "level_reached", threshold: 3 }]`
  and the evaluators return `{ current: 7 }` and
  `{ current: 2 }` respectively
- **THEN** the engine SHALL determine the criteria are
  NOT met

#### Scenario: OR compound with one condition met

- **WHEN** a compound achievement has
  `operator: "OR"` with conditions
  `[{ criteria_type: "quest_complete", threshold: 10 },
  { criteria_type: "boss_defeated", threshold: 3 }]`
  and the evaluators return `{ current: 2 }` and
  `{ current: 5 }` respectively
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: OR compound with no conditions met

- **WHEN** a compound achievement has
  `operator: "OR"` with conditions
  `[{ criteria_type: "quest_complete", threshold: 10 },
  { criteria_type: "boss_defeated", threshold: 3 }]`
  and the evaluators return `{ current: 2 }` and
  `{ current: 1 }` respectively
- **THEN** the engine SHALL determine the criteria are
  NOT met

#### Scenario: Compound with boolean sub-condition

- **WHEN** a compound achievement has
  `operator: "AND"` with conditions
  `[{ criteria_type: "quest_complete", threshold: 5 },
  { criteria_type: "class_change", boolean: true }]`
  and the evaluators return `{ current: 7 }` and
  `{ current: 1 }` respectively
- **THEN** the engine SHALL determine the criteria are
  met

#### Scenario: Default operator is AND

- **WHEN** a compound achievement has no `operator`
  field in `criteria_config`
- **THEN** the engine SHALL default to `"AND"`

### Requirement: Compound progress JSONB shape

For compound achievements, the progress upsert SHALL
write a JSONB object containing a `conditions` array
(with each sub-condition's `criteria_type`, `current`,
`threshold`, and `met` status) and a top-level `met`
boolean indicating overall result.

#### Scenario: Compound progress with mixed results

- **WHEN** a compound AND achievement has two
  conditions where quest_complete (current: 7,
  threshold: 5) is met and level_reached (current: 2,
  threshold: 3) is not met
- **THEN** the upserted progress SHALL be
  `{ "conditions": [{ "criteria_type":
  "quest_complete", "current": 7, "threshold": 5,
  "met": true }, { "criteria_type": "level_reached",
  "current": 2, "threshold": 3, "met": false }],
  "met": false }`

#### Scenario: Compound progress when all met

- **WHEN** all sub-conditions of a compound AND
  achievement are met
- **THEN** the progress SHALL have `"met": true` at
  the top level and each condition SHALL have
  `"met": true`

### Requirement: Unlock detection

After the progress upsert completes, the engine SHALL
identify achievements that are newly eligible for
unlock. An achievement is newly eligible when: (1) the
evaluation strategy determines criteria are met, AND
(2) the `unlocked_at` column on the existing
`character_achievements` row is NULL.

#### Scenario: Newly met threshold achievement

- **WHEN** progress is upserted with
  `{ current: 10, threshold: 10 }` and the existing
  row has `unlocked_at` IS NULL
- **THEN** the engine SHALL mark this achievement for
  unlock

#### Scenario: Already unlocked achievement is skipped

- **WHEN** progress is upserted with
  `{ current: 15, threshold: 10 }` and the existing
  row has `unlocked_at` already set
- **THEN** the engine SHALL NOT re-unlock or re-grant
  rewards for this achievement

#### Scenario: Progress below threshold is not unlocked

- **WHEN** progress is upserted with
  `{ current: 7, threshold: 10 }` and `unlocked_at`
  IS NULL
- **THEN** the engine SHALL NOT unlock this achievement

#### Scenario: Compound achievement unlock via met flag

- **WHEN** a compound achievement's progress has
  `"met": true` at the top level and `unlocked_at`
  IS NULL
- **THEN** the engine SHALL mark this achievement for
  unlock

### Requirement: Set unlocked_at on unlock

For each newly-eligible achievement, the engine SHALL
update the `character_achievements` row to set
`unlocked_at` to the current timestamp. The update
SHALL use the service-role write client and SHALL
filter on `unlocked_at IS NULL` to prevent race
conditions.

#### Scenario: unlocked_at is set on unlock

- **WHEN** an achievement is newly eligible for unlock
- **THEN** the engine SHALL update the
  `character_achievements` row with
  `unlocked_at = now()`

#### Scenario: Concurrent unlock attempts are safe

- **WHEN** two concurrent `updateProgress` calls both
  detect the same achievement as eligible
- **THEN** only one SHALL set `unlocked_at` (the
  `IS NULL` filter prevents the second from matching)
  and rewards SHALL be granted only once

### Requirement: Grant XP and gold rewards on unlock

After setting `unlocked_at`, the engine SHALL sum
`xp_reward` and `gold_reward` across all
newly-unlocked achievements in the current evaluation
and increment the character's `xp` and `gold` columns
via a single `characters` table update using the
service-role write client.

#### Scenario: Single achievement rewards granted

- **WHEN** one achievement with `xp_reward: 50` and
  `gold_reward: 25` is unlocked
- **THEN** the engine SHALL increment the character's
  `xp` by 50 and `gold` by 25

#### Scenario: Multiple achievements rewards summed

- **WHEN** three achievements are unlocked in a single
  evaluation with total `xp_reward: 150` and
  `gold_reward: 75`
- **THEN** the engine SHALL increment the character's
  `xp` by 150 and `gold` by 75 in a single update

#### Scenario: Zero rewards are not written

- **WHEN** newly-unlocked achievements all have
  `xp_reward: 0` and `gold_reward: 0`
- **THEN** the engine SHALL skip the character stats
  update

#### Scenario: Rewards are not granted on re-evaluation

- **WHEN** `updateProgress` is called again for a
  character who already has `unlocked_at` set on all
  eligible achievements
- **THEN** no rewards SHALL be granted and no
  character stats update SHALL occur

### Requirement: Level-up from XP rewards

After granting XP rewards, the engine SHALL call
`RewardCalculator.calculateLevelUp()` with the
character's current XP, the granted XP total, and
current level. If a level-up occurs, the engine SHALL
include the new level in the same `characters` table
update that writes XP and gold.

#### Scenario: XP reward triggers level-up

- **WHEN** a character at level 3 with 140 XP unlocks
  an achievement granting 60 XP, and level 4 requires
  200 XP total (per `RewardCalculator`)
- **THEN** the engine SHALL update `characters.level`
  to 4 in the same update that increments XP and gold

#### Scenario: XP reward does not trigger level-up

- **WHEN** a character at level 3 with 100 XP unlocks
  an achievement granting 10 XP, and level 4 requires
  200 XP total
- **THEN** the engine SHALL NOT modify
  `characters.level`

#### Scenario: Level-up cascades to level achievements

- **WHEN** granting XP causes a level-up from level 4
  to level 5
- **THEN** the engine SHALL re-evaluate
  `level_reached` criteria after the stats update so
  that level-based achievements can cascade-unlock in
  the same call

### Requirement: Idempotent unlock evaluation

Calling the evaluation engine multiple times for the
same character and event SHALL NOT produce duplicate
unlocks or duplicate reward grants. The engine relies
on `unlocked_at IS NULL` as the guard: once set,
subsequent evaluations skip that achievement entirely.

#### Scenario: Duplicate evaluation produces no change

- **WHEN** `updateProgress` is called twice with the
  same character and event, and the first call
  unlocked an achievement
- **THEN** the second call SHALL not re-set
  `unlocked_at` and SHALL NOT grant additional rewards

#### Scenario: Idempotent after partial failure

- **WHEN** the first call set `unlocked_at` but
  failed before granting rewards (crash between DB
  calls)
- **THEN** the next call SHALL see `unlocked_at`
  already set and SHALL NOT grant rewards (acceptable
  edge case for v0.8.0)

### Requirement: Retroactive unlock during backfill

When the progress service performs a full backfill
(first `updateProgress` call for a character), the
evaluation engine SHALL run against all backfilled
progress results. Any achievements whose criteria are
already met SHALL be unlocked and rewarded in the same
call.

#### Scenario: Backfill unlocks qualifying achievements

- **WHEN** a character's first `updateProgress` call
  triggers full backfill and 5 of 42 achievements
  have criteria already met
- **THEN** those 5 achievements SHALL have
  `unlocked_at` set and their combined XP/gold
  rewards SHALL be granted

#### Scenario: Backfill with no qualifying achievements

- **WHEN** a character's first `updateProgress` call
  triggers full backfill and no achievements have
  criteria met
- **THEN** no achievements SHALL be unlocked and no
  rewards SHALL be granted

### Requirement: Fetch achievement rewards in query

The `fetchAchievements` query within `updateProgress`
SHALL select `xp_reward`, `gold_reward`, and `name`
in addition to the existing `id`, `criteria_type`, and
`criteria_config` columns. This provides the evaluation
engine with reward values without an additional query.

#### Scenario: Achievement data includes reward fields

- **WHEN** `fetchAchievements` returns achievement rows
- **THEN** each row SHALL include `xp_reward`,
  `gold_reward`, and `name` fields

### Requirement: Compound achievement seed data

The achievement seed data SHALL include at least 2
compound achievements to validate the compound
evaluation strategy. These SHALL be added via a new
migration file.

#### Scenario: AND compound achievement is seeded

- **WHEN** the migration runs
- **THEN** at least one achievement SHALL exist with
  `criteria_type: "compound"` and
  `criteria_config.operator: "AND"` containing
  multiple sub-conditions

#### Scenario: OR compound achievement is seeded

- **WHEN** the migration runs
- **THEN** at least one achievement SHALL exist with
  `criteria_type: "compound"` and
  `criteria_config.operator: "OR"` containing
  multiple sub-conditions

#### Scenario: Compound achievements have rewards

- **WHEN** compound achievements are seeded
- **THEN** each SHALL have non-zero `xp_reward` and
  `gold_reward` values

### Requirement: Evaluation engine unit tests

The evaluation engine SHALL have unit tests covering
each evaluation strategy, unlock detection, reward
granting, level-up cascading, idempotency, and
retroactive unlock behavior.

#### Scenario: Threshold strategy tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover met-at-threshold,
  met-above-threshold, not-met-below-threshold, and
  zero-threshold cases

#### Scenario: Boolean strategy tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover truthy (current > 0) and
  falsy (current === 0) cases

#### Scenario: Compound strategy tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover AND-all-met,
  AND-partial-met, OR-one-met, OR-none-met, boolean
  sub-conditions, and default-operator cases

#### Scenario: Unlock and reward tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover single unlock, multiple
  unlock, zero-reward skip, already-unlocked skip,
  and level-up cascade cases

#### Scenario: Idempotency tests

- **WHEN** unit tests run
- **THEN** tests SHALL verify that duplicate
  evaluations produce no additional unlocks or rewards
