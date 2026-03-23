# Family Achievement Progress

## ADDED Requirements

### Requirement: FamilyAchievementProgressService class

The system SHALL provide a
`FamilyAchievementProgressService` class in
`lib/family-achievement-progress-service.ts` that
accepts an optional `SupabaseClient<Database>` via
constructor injection for read operations (defaulting
to a service-role client). The service SHALL always use
a service-role client for `family_achievement_progress`
writes. It SHALL expose
`updateProgress(familyId, event)` and
`getProgress(familyId)` methods.

#### Scenario: Service instantiation with default client

- **WHEN** `FamilyAchievementProgressService` is
  constructed with no arguments
- **THEN** it SHALL use a service-role Supabase client
  for both reads and writes

#### Scenario: Service instantiation with injected client

- **WHEN** `FamilyAchievementProgressService` is
  constructed with a `SupabaseClient<Database>` argument
- **THEN** it SHALL use the provided client for reads
  but SHALL use a service-role client for all
  `family_achievement_progress` upserts

### Requirement: updateProgress method

The `updateProgress` method SHALL accept a `familyId`
(string) and an event object containing `type` (the
triggering event type). It SHALL fetch all
`family_achievements` rows for that family, resolve all
characters in the family via `user_profiles` and
`characters` tables, run the appropriate family
evaluators, upsert results into
`family_achievement_progress`, and then invoke the
family unlock evaluation to detect newly-met criteria.

#### Scenario: Progress updated after quest approval

- **WHEN** `updateProgress` is called with a
  `familyId` and event type `QUEST_APPROVED`
- **THEN** it SHALL evaluate all quest-related family
  criteria and upsert aggregate progress

#### Scenario: Progress updated after boss completion

- **WHEN** `updateProgress` is called with a
  `familyId` and event type `BOSS_COMPLETED`
- **THEN** it SHALL evaluate all boss-related and
  gold/xp family criteria and upsert aggregate progress

#### Scenario: Progress updated after reward approval

- **WHEN** `updateProgress` is called with a
  `familyId` and event type `REWARD_APPROVED`
- **THEN** it SHALL evaluate gold_spent and
  reward_redeemed family criteria and upsert aggregate
  progress

#### Scenario: Progress updated after class change

- **WHEN** `updateProgress` is called with a
  `familyId` and event type `CLASS_CHANGED`
- **THEN** it SHALL evaluate class_change family
  criteria and upsert aggregate progress

#### Scenario: Invalid family ID

- **WHEN** `updateProgress` is called with a
  `familyId` that does not exist in `families`
- **THEN** it SHALL throw an error and not modify any
  `family_achievement_progress` rows

### Requirement: getProgress method

The `getProgress` method SHALL accept a `familyId`
(string) and return all `family_achievement_progress`
rows for that family, joined with family achievement
metadata (name, description, criteria_type,
criteria_config).

#### Scenario: Family with existing progress

- **WHEN** `getProgress` is called for a family that
  has `family_achievement_progress` rows
- **THEN** it SHALL return an array of progress records
  each containing the family achievement metadata and
  the current progress JSONB

#### Scenario: Family with no progress

- **WHEN** `getProgress` is called for a family that
  has no `family_achievement_progress` rows
- **THEN** it SHALL return an empty array

### Requirement: Family evaluator registry

The service SHALL maintain a registry mapping each
`criteria_type` string to a family evaluator function.
Family evaluators SHALL support the same criteria types
as individual evaluators but aggregate across all
characters in the family.

#### Scenario: All criteria types have family evaluators

- **WHEN** the family evaluator registry is inspected
- **THEN** it SHALL contain entries for:
  `quest_complete`, `quest_volunteer`,
  `quest_difficulty`, `boss_defeated`,
  `boss_participated`, `gold_earned`, `gold_spent`,
  `reward_redeemed`, `xp_earned`, `level_reached`,
  `streak_reached`, `class_change`, `honor_earned`

#### Scenario: Unknown criteria type encountered

- **WHEN** a family achievement has a `criteria_type`
  not present in the registry
- **THEN** the service SHALL log a warning and skip
  that achievement without failing the overall call

### Requirement: Family evaluation mode

Each family achievement's `criteria_config` SHALL
include a `family_evaluation_mode` field (`"sum"` or
`"all"`) that controls how individual member values
are aggregated.

#### Scenario: Sum mode aggregation

- **WHEN** a family achievement has
  `family_evaluation_mode: "sum"` and criteria_type
  `quest_complete`
- **THEN** the evaluator SHALL return the total count
  of approved quests across ALL characters in the
  family

#### Scenario: All mode aggregation

- **WHEN** a family achievement has
  `family_evaluation_mode: "all"` and criteria_type
  `level_reached` with threshold 5
- **THEN** the evaluator SHALL return the MINIMUM
  level across all characters in the family (so
  `current >= threshold` only when every member meets
  it)

#### Scenario: Default mode is sum

- **WHEN** a family achievement has no
  `family_evaluation_mode` field in `criteria_config`
- **THEN** the evaluator SHALL default to `"sum"` mode

### Requirement: Family progress JSONB shape

Each progress upsert SHALL write a JSONB object with
the shape `{ "current": N, "threshold": T }` where
`N` is the family evaluator's computed aggregate value
and `T` is the `threshold` value from the family
achievement's `criteria_config`.

#### Scenario: Progress shape for sum-mode achievement

- **WHEN** a family evaluator returns `{ current: 47 }`
  for a family achievement with
  `criteria_config: {"threshold": 50}`
- **THEN** the upserted progress SHALL be
  `{"current": 47, "threshold": 50}`

#### Scenario: Progress shape for all-mode achievement

- **WHEN** a family evaluator returns `{ current: 4 }`
  (minimum level across members) for a family
  achievement with
  `criteria_config: {"threshold": 5}`
- **THEN** the upserted progress SHALL be
  `{"current": 4, "threshold": 5}`

### Requirement: Upsert via unique constraint

Progress writes SHALL use Supabase `.upsert()` with
`onConflict: 'family_id,family_achievement_id'`. A new
row is inserted on first encounter; the `progress`
column is updated on subsequent evaluations.

#### Scenario: First progress write

- **WHEN** no `family_achievement_progress` row exists
  for the given (familyId, familyAchievementId) pair
- **THEN** the service SHALL insert a new row with the
  computed progress

#### Scenario: Subsequent progress write

- **WHEN** a `family_achievement_progress` row already
  exists for the given pair
- **THEN** the service SHALL update the `progress`
  column with the recomputed value

### Requirement: Family unlock evaluation

After progress upsert completes, the service SHALL
identify family achievements that are newly eligible
for unlock. A family achievement is newly eligible
when: (1) `current >= threshold` in the progress, AND
(2) the `unlocked_at` column on the existing
`family_achievement_progress` row is NULL.

#### Scenario: Newly met family achievement

- **WHEN** progress is upserted with
  `{ current: 50, threshold: 50 }` and the existing
  row has `unlocked_at` IS NULL
- **THEN** the service SHALL set `unlocked_at` to the
  current timestamp

#### Scenario: Already unlocked family achievement

- **WHEN** progress is upserted with
  `{ current: 55, threshold: 50 }` and the existing
  row has `unlocked_at` already set
- **THEN** the service SHALL NOT re-unlock

#### Scenario: Progress below threshold

- **WHEN** progress is upserted with
  `{ current: 30, threshold: 50 }` and `unlocked_at`
  IS NULL
- **THEN** the service SHALL NOT unlock

### Requirement: Integration with individual progress

The existing `AchievementProgressService.updateProgress`
method SHALL trigger family achievement progress
evaluation after individual progress completes. After
the individual character's progress is upserted and
unlock evaluation finishes, the service SHALL resolve
the character's `family_id` and call
`FamilyAchievementProgressService.updateProgress(
familyId, event)`.

#### Scenario: Family progress triggered on individual update

- **WHEN** `AchievementProgressService.updateProgress`
  completes successfully for a character
- **THEN** it SHALL call
  `FamilyAchievementProgressService.updateProgress`
  with the character's family_id and the same event

#### Scenario: Family progress failure is non-blocking

- **WHEN** family progress evaluation throws an error
- **THEN** the individual progress update SHALL still
  be considered successful and the error SHALL be
  logged

### Requirement: Idempotent family progress updates

Calling `updateProgress` multiple times with the same
event SHALL produce identical progress values. The
absolute-value recomputation model guarantees this by
querying canonical database state.

#### Scenario: Duplicate event produces same progress

- **WHEN** `updateProgress` is called twice with the
  same familyId and event
- **THEN** the progress JSONB for each affected family
  achievement SHALL be identical after both calls

### Requirement: Family achievements API route

The system SHALL expose a
GET `/api/family-achievements` endpoint that returns
all family achievements for the authenticated user's
family with progress merged in.

#### Scenario: Authenticated user fetches achievements

- **WHEN** an authenticated user sends
  GET `/api/family-achievements`
- **THEN** the response SHALL contain all family
  achievements for their family with progress,
  unlock status, and achievement metadata

#### Scenario: Unauthenticated request

- **WHEN** an unauthenticated request is sent to
  GET `/api/family-achievements`
- **THEN** the response SHALL be 401 Unauthorized

#### Scenario: User with no family

- **WHEN** an authenticated user with no family_id
  sends GET `/api/family-achievements`
- **THEN** the response SHALL return an empty array

### Requirement: Admin family achievement management

Guild Masters SHALL be able to create and manage
family achievements via admin API routes.

#### Scenario: Guild Master creates family achievement

- **WHEN** a Guild Master sends POST to
  `/api/admin/family-achievements` with valid data
- **THEN** a new `family_achievements` row SHALL be
  created with the family's `family_id`

#### Scenario: Non-Guild-Master cannot create

- **WHEN** a HERO or YOUNG_HERO sends POST to
  `/api/admin/family-achievements`
- **THEN** the request SHALL be denied with 403

### Requirement: Family achievement unit tests

The service SHALL have unit tests covering family
evaluator aggregation (sum and all modes), unlock
evaluation, idempotency, and integration triggering.

#### Scenario: Sum mode evaluator tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover summing values across
  multiple family members and edge cases (single
  member, no members)

#### Scenario: All mode evaluator tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover minimum-value aggregation
  where all members must meet the threshold

#### Scenario: Unlock evaluation tests

- **WHEN** unit tests run
- **THEN** tests SHALL cover newly met, already
  unlocked, and below threshold cases

#### Scenario: Integration trigger tests

- **WHEN** unit tests run
- **THEN** tests SHALL verify that individual progress
  updates trigger family progress evaluation
