# achievement-progress Specification

## Purpose

Define the runtime service that computes character
progress toward achievements and persists progress
state to `character_achievements.progress` JSONB.

## ADDED Requirements

### Requirement: AchievementProgressService class

The system SHALL provide an
`AchievementProgressService` class in
`lib/achievement-progress-service.ts` that accepts an
optional `SupabaseClient<Database>` via constructor
injection for read operations (defaulting to a
service-role client). The service SHALL always use a
service-role client for `character_achievements`
writes, regardless of the injected read client. It
SHALL expose `updateProgress(characterId, event)` and
`getProgress(characterId)` methods.

#### Scenario: Service instantiation with default client

- **WHEN** `AchievementProgressService` is constructed
  with no arguments
- **THEN** it SHALL use a service-role Supabase client
  created via `createServiceSupabaseClient()` for both
  reads and writes

#### Scenario: Service instantiation with injected client

- **WHEN** `AchievementProgressService` is constructed
  with a `SupabaseClient<Database>` argument
- **THEN** it SHALL use the provided client for read
  operations (evaluator queries, character lookups)
  but SHALL use a service-role client for all
  `character_achievements` upserts

### Requirement: updateProgress method

The `updateProgress` method SHALL accept a
`characterId` (string) and an event object containing
`type` (the triggering event type) and optional
metadata. It SHALL resolve the character's `user_id`
from the `characters` table, fetch all achievements
from the `achievements` table, run the appropriate
evaluators, and upsert results into
`character_achievements`.

#### Scenario: Progress updated after quest approval

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `QUEST_APPROVED`
- **THEN** it SHALL evaluate all quest-related criteria
  (`quest_complete`, `quest_volunteer`,
  `quest_difficulty`) plus `gold_earned`, `xp_earned`,
  `level_reached`, and `streak_reached` for that
  character

#### Scenario: Progress updated after reward approval

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `REWARD_APPROVED`
- **THEN** it SHALL evaluate `gold_spent` and
  `reward_redeemed` criteria for that character

#### Scenario: Progress updated after boss completion

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `BOSS_COMPLETED`
- **THEN** it SHALL evaluate `boss_defeated`,
  `boss_participated`, `gold_earned`, `xp_earned`,
  and `level_reached` criteria for that character

#### Scenario: Invalid character ID

- **WHEN** `updateProgress` is called with a
  `characterId` that does not exist in `characters`
- **THEN** it SHALL throw an error and not modify any
  `character_achievements` rows

### Requirement: getProgress method

The `getProgress` method SHALL accept a `characterId`
(string) and return all `character_achievements` rows
for that character, joined with achievement metadata
(name, description, criteria_type, criteria_config).

#### Scenario: Character with existing progress

- **WHEN** `getProgress` is called for a character
  that has `character_achievements` rows
- **THEN** it SHALL return an array of progress
  records each containing the achievement metadata
  and the current progress JSONB

#### Scenario: Character with no progress

- **WHEN** `getProgress` is called for a character
  that has no `character_achievements` rows
- **THEN** it SHALL return an empty array

### Requirement: Evaluator registry

The service SHALL maintain a registry mapping each
`criteria_type` string to an evaluator function. The
registry SHALL contain entries for all 13 seeded
criteria types: `quest_complete`, `quest_volunteer`,
`quest_difficulty`, `boss_defeated`,
`boss_participated`, `gold_earned`, `gold_spent`,
`reward_redeemed`, `xp_earned`, `level_reached`,
`streak_reached`, `class_change`, `honor_earned`.

#### Scenario: All criteria types have evaluators

- **WHEN** the evaluator registry is inspected
- **THEN** it SHALL contain an entry for every
  `criteria_type` value present in the seeded
  `achievements` table

#### Scenario: Unknown criteria type encountered

- **WHEN** an achievement has a `criteria_type` not
  present in the registry
- **THEN** the service SHALL log a warning and skip
  that achievement without failing the overall
  `updateProgress` call

### Requirement: quest_complete evaluator

The `quest_complete` evaluator SHALL count rows in
`quest_instances` where (`assigned_to_id` = userId
OR `volunteered_by` = characterId) AND `status` =
'APPROVED'.

#### Scenario: Character with approved quests

- **WHEN** a character has 7 approved quest instances
  (via assignment or volunteering)
- **THEN** the evaluator SHALL return
  `{ current: 7 }`

#### Scenario: Character with no approved quests

- **WHEN** a character has no approved quest instances
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

#### Scenario: Non-approved quests are excluded

- **WHEN** a character has quest instances with
  statuses CLAIMED, IN_PROGRESS, or DENIED
- **THEN** those quests SHALL NOT be counted

### Requirement: quest_volunteer evaluator

The `quest_volunteer` evaluator SHALL count rows in
`quest_instances` where `volunteered_by` = characterId
AND `status` = 'APPROVED'.

#### Scenario: Character with volunteer completions

- **WHEN** a character has 3 approved quests where
  they are the volunteer
- **THEN** the evaluator SHALL return
  `{ current: 3 }`

#### Scenario: Assigned quests are excluded

- **WHEN** a character completed quests only via
  `assigned_to_id` (not `volunteered_by`)
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

### Requirement: quest_difficulty evaluator

The `quest_difficulty` evaluator SHALL count rows in
`quest_instances` where (`assigned_to_id` = userId
OR `volunteered_by` = characterId) AND `status` =
'APPROVED' AND `difficulty` matches the value in
`criteria_config.difficulty`.

#### Scenario: Character with matching difficulty quests

- **WHEN** a character has 5 approved HARD quests
  and the achievement's criteria_config is
  `{"difficulty": "HARD", "threshold": 5}`
- **THEN** the evaluator SHALL return
  `{ current: 5 }`

#### Scenario: Different difficulty quests are excluded

- **WHEN** a character has 10 approved EASY quests
  but the criteria_config specifies HARD
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

### Requirement: boss_defeated evaluator

The `boss_defeated` evaluator SHALL count rows in
`boss_battle_participants` where `user_id` = userId
AND `participation_status` = 'APPROVED'.

#### Scenario: Character with boss victories

- **WHEN** a character has participated in 3 boss
  battles with participation_status APPROVED
- **THEN** the evaluator SHALL return
  `{ current: 3 }`

#### Scenario: Non-approved participations excluded

- **WHEN** a character has boss battle participations
  with participation_status DENIED or PARTIAL
- **THEN** those rows SHALL NOT be counted

### Requirement: boss_participated evaluator

The `boss_participated` evaluator SHALL count all
rows in `boss_battle_participants` where `user_id`
= userId, regardless of `participation_status`.

#### Scenario: Character with any boss participation

- **WHEN** a character has 5 rows in
  `boss_battle_participants` (any status)
- **THEN** the evaluator SHALL return
  `{ current: 5 }`

### Requirement: gold_earned evaluator

The `gold_earned` evaluator SHALL compute the sum of
base gold rewards from two sources: (1) SUM of
`gold_reward` from `quest_instances` where
(`assigned_to_id` = userId OR `volunteered_by` =
characterId) AND `status` = 'APPROVED', plus (2) SUM
of `awarded_gold` from `boss_battle_participants`
where `user_id` = userId AND `participation_status`
= 'APPROVED'. This represents base rewards only;
volunteer/streak/class bonuses are excluded because
they are not stored separately on the quest row.

#### Scenario: Gold earned from quests and bosses

- **WHEN** a character has earned 200 base gold from
  approved quests and 100 gold from boss victories
- **THEN** the evaluator SHALL return
  `{ current: 300 }`

#### Scenario: No gold earned

- **WHEN** a character has no approved quests or boss
  participations
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

### Requirement: gold_spent evaluator

The `gold_spent` evaluator SHALL compute the SUM of
`cost` from `reward_redemptions` where `user_id` =
userId AND `status` IN ('APPROVED', 'FULFILLED').
PENDING redemptions SHALL NOT be counted (they may
be refunded).

#### Scenario: Gold spent on approved redemptions

- **WHEN** a character has 3 approved/fulfilled
  redemptions totaling 150 gold
- **THEN** the evaluator SHALL return
  `{ current: 150 }`

#### Scenario: Pending redemptions excluded

- **WHEN** a character has a PENDING redemption
  of 50 gold
- **THEN** that redemption SHALL NOT be included
  in the count

### Requirement: reward_redeemed evaluator

The `reward_redeemed` evaluator SHALL count rows in
`reward_redemptions` where `user_id` = userId AND
`status` IN ('APPROVED', 'FULFILLED').

#### Scenario: Character with confirmed redemptions

- **WHEN** a character has 4 approved/fulfilled
  redemptions
- **THEN** the evaluator SHALL return
  `{ current: 4 }`

### Requirement: xp_earned evaluator

The `xp_earned` evaluator SHALL read the `xp` column
from `characters` where `id` = characterId.

#### Scenario: Character with XP

- **WHEN** a character has 1500 XP
- **THEN** the evaluator SHALL return
  `{ current: 1500 }`

### Requirement: level_reached evaluator

The `level_reached` evaluator SHALL read the `level`
column from `characters` where `id` = characterId.

#### Scenario: Character at level 10

- **WHEN** a character is level 10
- **THEN** the evaluator SHALL return
  `{ current: 10 }`

### Requirement: streak_reached evaluator

The `streak_reached` evaluator SHALL read the MAX
`longest_streak` from `character_quest_streaks` where
`character_id` = characterId. Uses `longest_streak`
(not `current_streak`) so progress is never lost when
a streak resets.

#### Scenario: Character with streak history

- **WHEN** a character has streak records with
  longest_streak values of 7, 14, and 3
- **THEN** the evaluator SHALL return
  `{ current: 14 }`

#### Scenario: Character with no streak records

- **WHEN** a character has no
  `character_quest_streaks` rows
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

### Requirement: class_change evaluator

The `class_change` evaluator is backfill-only. It
SHALL return `{ current: 0 }` because no class change
history table exists. A runtime trigger will be added
when the class change flow is defined.

#### Scenario: Class change always returns zero

- **WHEN** the `class_change` evaluator runs
- **THEN** it SHALL return `{ current: 0 }`

### Requirement: honor_earned evaluator

The `honor_earned` evaluator SHALL read the
`honor_points` column from `characters` where `id`
= characterId. This is backfill-only; no runtime
trigger exists until a dedicated honor system is
built.

#### Scenario: Character with honor points

- **WHEN** a character has 25 honor points
- **THEN** the evaluator SHALL return
  `{ current: 25 }`

#### Scenario: Character with no honor points

- **WHEN** a character has 0 or NULL honor points
- **THEN** the evaluator SHALL return
  `{ current: 0 }`

### Requirement: Progress JSONB shape

Each progress upsert SHALL write a JSONB object with
the shape `{ "current": N, "threshold": T }` where
`N` is the evaluator's computed value and `T` is the
`threshold` value from the achievement's
`criteria_config`.

#### Scenario: Progress shape for threshold achievement

- **WHEN** an evaluator returns `{ current: 7 }` for
  an achievement with
  `criteria_config: {"threshold": 10}`
- **THEN** the upserted progress SHALL be
  `{"current": 7, "threshold": 10}`

#### Scenario: Progress shape for config with extra fields

- **WHEN** an achievement has `criteria_config:
  {"difficulty": "HARD", "threshold": 5}` and the
  evaluator returns `{ current: 3 }`
- **THEN** the upserted progress SHALL be
  `{"current": 3, "threshold": 5}`

### Requirement: Upsert via unique constraint

Progress writes SHALL use Supabase `.upsert()` with
`onConflict: 'character_id,achievement_id'`. A new
row is inserted on first encounter; the `progress`
column is updated on subsequent evaluations.

#### Scenario: First progress write for an achievement

- **WHEN** no `character_achievements` row exists for
  the given (characterId, achievementId) pair
- **THEN** the service SHALL insert a new row with
  the computed progress

#### Scenario: Subsequent progress write

- **WHEN** a `character_achievements` row already
  exists for the given (characterId, achievementId)
  pair
- **THEN** the service SHALL update the `progress`
  column with the recomputed value

### Requirement: Idempotent progress updates

Calling `updateProgress` multiple times with the same
event SHALL produce identical `progress` values. The
absolute-value recomputation model guarantees this by
querying canonical database state rather than
accumulating from event payloads.

#### Scenario: Duplicate event produces same progress

- **WHEN** `updateProgress` is called twice with the
  same characterId and event
- **THEN** the `progress` JSONB for each affected
  achievement SHALL be identical after both calls

#### Scenario: Progress self-corrects after missed event

- **WHEN** a prior `updateProgress` call failed and
  a subsequent call succeeds
- **THEN** the progress SHALL reflect the current
  canonical state, not just the delta from the
  latest event

### Requirement: Retroactive backfill on first evaluation

On the first `updateProgress` call for a character
(detected by absence of any `character_achievements`
rows for that character), the service SHALL run all
13 evaluators to backfill progress from existing
database state. The full set of backfill upserts
SHALL be written in a single batch upsert call so
that the operation is atomic — either all rows are
written or none are. This prevents partial backfill
from being misinterpreted as complete on subsequent
calls. Subsequent calls SHALL run only the evaluators
mapped to the triggering event type.

#### Scenario: First evaluation triggers full backfill

- **WHEN** `updateProgress` is called for a character
  with zero `character_achievements` rows
- **THEN** the service SHALL evaluate all 13 criteria
  types and upsert progress for every achievement in
  a single batch upsert

#### Scenario: Partial backfill failure leaves no rows

- **WHEN** the batch upsert during backfill fails
- **THEN** no `character_achievements` rows SHALL be
  written for that character, and the next
  `updateProgress` call SHALL retry the full backfill

#### Scenario: Subsequent evaluation is scoped

- **WHEN** `updateProgress` is called for a character
  that already has `character_achievements` rows
- **THEN** the service SHALL evaluate only the
  criteria types mapped to the event type

### Requirement: Quest approval integration

The quest approval flow in
`lib/quest-instance/approve-quest.ts` SHALL call
`AchievementProgressService.updateProgress()` after
the character stats update succeeds. The call SHALL
be awaited inside a try/catch block; failures SHALL
be logged but SHALL NOT cause the quest approval to
fail.

#### Scenario: Achievement progress evaluated on approval

- **WHEN** a quest is approved and character stats
  are updated successfully
- **THEN** `updateProgress` SHALL be called with the
  character's ID and event type `QUEST_APPROVED`

#### Scenario: Progress failure does not block approval

- **WHEN** `updateProgress` throws an error during
  quest approval
- **THEN** the error SHALL be logged and the quest
  approval SHALL complete normally

### Requirement: Boss completion integration

The boss quest completion flow in
`app/api/boss-quests/[id]/complete/route.ts` SHALL
call `AchievementProgressService.updateProgress()`
for each participant after their character stats are
updated. The call SHALL be awaited inside a try/catch
block; failures SHALL be logged but SHALL NOT cause
the boss completion to fail.

#### Scenario: Progress evaluated for each participant

- **WHEN** a boss quest is completed with 3
  participants
- **THEN** `updateProgress` SHALL be called once per
  participant with event type `BOSS_COMPLETED`

#### Scenario: One participant's failure is isolated

- **WHEN** `updateProgress` fails for one participant
  but succeeds for others
- **THEN** the successful updates SHALL persist and
  the boss completion SHALL not fail

### Requirement: Reward approval integration

The reward approval flow currently runs client-side
in `useRewardStoreActions.ts` via `RewardService`,
which uses a browser Supabase client. Because the
progress service requires a service-role client, a
lightweight internal API route SHALL be added at
`app/api/achievement-progress/evaluate/route.ts`.
After a successful redemption approval, the client
hook SHALL call this route to trigger server-side
progress evaluation. The route SHALL authenticate
the caller, resolve the character ID from the
authenticated user, and call
`AchievementProgressService.updateProgress()`. This
route is an internal implementation detail, not a
public API — it accepts only a `REWARD_APPROVED`
event type and is called only from the reward
approval flow.

#### Scenario: Progress evaluated on redemption approval

- **WHEN** a Guild Master approves a reward
  redemption via the client-side hook
- **THEN** the hook SHALL call the internal
  `/api/achievement-progress/evaluate` route with
  the redeemer's user ID and event type
  `REWARD_APPROVED`
- **AND** the route SHALL resolve the character ID,
  call `updateProgress`, and return success

#### Scenario: Denied redemptions do not trigger progress

- **WHEN** a Guild Master denies a reward redemption
- **THEN** the client hook SHALL NOT call the
  progress evaluation route

#### Scenario: Evaluation route failure is non-blocking

- **WHEN** the internal route call fails (network
  error, server error)
- **THEN** the redemption approval SHALL still
  complete successfully and the error SHALL be
  silently caught by the client hook
