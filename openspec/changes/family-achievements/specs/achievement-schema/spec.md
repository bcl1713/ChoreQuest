# Achievement Schema — Family Achievements Delta

## ADDED Requirements

### Requirement: Family Achievements Table

The migration SHALL create a `family_achievements`
table with columns: `id` (UUID PK, auto-generated),
`name` (TEXT NOT NULL), `description` (TEXT NOT NULL),
`category_id` (UUID FK referencing
`achievement_categories(id)`), `icon` (TEXT),
`xp_reward` (INT DEFAULT 0), `gold_reward`
(INT DEFAULT 0), `is_hidden` (BOOL DEFAULT FALSE),
`criteria_type` (TEXT NOT NULL), `criteria_config`
(JSONB NOT NULL), `family_id` (UUID FK referencing
`families(id)`, NOT NULL), `created_at` (TIMESTAMPTZ),
`updated_at` (TIMESTAMPTZ).

#### Scenario: Family achievement row with required fields

- **WHEN** a row is inserted with `name`,
  `description`, `criteria_type`, `criteria_config`,
  and `family_id`
- **THEN** the row SHALL be created with `xp_reward`
  and `gold_reward` defaulting to 0 and `is_hidden`
  defaulting to FALSE

#### Scenario: Family achievement references a valid family

- **WHEN** a row is inserted with a `family_id`
- **THEN** the FK constraint SHALL require that the
  `family_id` exists in `families`

#### Scenario: Family achievement updated_at auto-managed

- **WHEN** a `family_achievements` row is updated
- **THEN** the `updated_at` column SHALL be set to the
  current timestamp via the `trigger_set_timestamp()`
  trigger

### Requirement: Family Achievement Progress Table

The migration SHALL create a
`family_achievement_progress` table with columns:
`id` (UUID PK, auto-generated), `family_id` (UUID FK
referencing `families(id)` with ON DELETE CASCADE),
`family_achievement_id` (UUID FK referencing
`family_achievements(id)` with ON DELETE CASCADE),
`unlocked_at` (TIMESTAMPTZ), `progress` (JSONB),
`notified` (BOOL DEFAULT FALSE), `created_at`
(TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ), with a
UNIQUE constraint on
`(family_id, family_achievement_id)`.

#### Scenario: Progress tracks family unlock

- **WHEN** a family unlocks a family achievement
- **THEN** a row SHALL exist with `unlocked_at` set
  and `notified` defaulting to FALSE

#### Scenario: Duplicate progress is prevented

- **WHEN** a row is inserted with a
  `(family_id, family_achievement_id)` pair that
  already exists
- **THEN** the database SHALL reject the insert with
  a unique constraint violation

#### Scenario: Family deletion cascades

- **WHEN** a family is deleted from the `families`
  table
- **THEN** all associated
  `family_achievement_progress` rows SHALL be deleted
  via ON DELETE CASCADE

#### Scenario: Family achievement deletion cascades

- **WHEN** a family achievement is deleted from
  `family_achievements`
- **THEN** all associated
  `family_achievement_progress` rows SHALL be deleted
  via ON DELETE CASCADE

#### Scenario: Progress updated_at auto-managed

- **WHEN** a `family_achievement_progress` row is
  updated
- **THEN** the `updated_at` column SHALL be set to
  the current timestamp via `trigger_set_timestamp()`

### Requirement: Family Achievement Indexes

The migration SHALL create indexes on:
`family_achievements.family_id`,
`family_achievements.category_id`,
`family_achievements.criteria_type`,
`family_achievement_progress.family_id`,
`family_achievement_progress.family_achievement_id`.

#### Scenario: Family achievement filtering indexes

- **WHEN** the migration completes
- **THEN** indexes SHALL exist on
  `family_achievements.family_id`,
  `family_achievements.category_id`, and
  `family_achievements.criteria_type`

#### Scenario: Family progress lookup indexes

- **WHEN** the migration completes
- **THEN** indexes SHALL exist on
  `family_achievement_progress.family_id` and
  `family_achievement_progress.family_achievement_id`

### Requirement: RLS Policies for Family Achievement Data

The migration SHALL enable RLS on both new tables and
create policies that enforce family-scoped access.

#### Scenario: Family achievements visible to members

- **WHEN** an authenticated user queries
  `family_achievements`
- **THEN** rows where `family_id` matches their family
  (via `get_user_family_id()`) SHALL be visible

#### Scenario: Non-family achievements are hidden

- **WHEN** an authenticated user queries
  `family_achievements`
- **THEN** rows where `family_id` is a different
  family SHALL NOT be visible

#### Scenario: Guild Masters can manage family achievements

- **WHEN** a Guild Master inserts, updates, or deletes
  a family achievement with `family_id` matching their
  family
- **THEN** the operation SHALL be permitted

#### Scenario: Non-Guild-Masters cannot manage

- **WHEN** a HERO or YOUNG_HERO attempts to insert,
  update, or delete a family achievement
- **THEN** the operation SHALL be denied by RLS

#### Scenario: Family progress visible to members

- **WHEN** a user queries
  `family_achievement_progress`
- **THEN** rows where `family_id` matches their family
  SHALL be visible

#### Scenario: Family progress written via service role

- **WHEN** the family achievement service needs to
  record progress or unlock
- **THEN** the insert/update SHALL be performed via
  service role

### Requirement: Realtime for Family Achievement Progress

The migration SHALL set `REPLICA IDENTITY FULL` on the
`family_achievement_progress` table to enable Supabase
Realtime to broadcast family unlock events with
complete row data.

#### Scenario: Realtime UPDATE includes full data

- **WHEN** a `family_achievement_progress` row is
  updated (e.g., `unlocked_at` set)
- **THEN** Supabase Realtime SHALL receive both old
  and new row data for filter evaluation

### Requirement: Seed Family Achievement Definitions

The migration SHALL seed family achievement definitions
for each family that exists. Seed data SHALL include
family achievements across multiple categories and
criteria types, using both `"sum"` and `"all"`
evaluation modes.

#### Scenario: Sum-mode achievements are seeded

- **WHEN** the migration completes
- **THEN** family achievements SHALL exist with
  `family_evaluation_mode: "sum"` for criteria like
  `quest_complete` (e.g., "Family completes 50 quests
  total") and `gold_earned` (e.g., "Family earns 1000
  gold collectively")

#### Scenario: All-mode achievements are seeded

- **WHEN** the migration completes
- **THEN** family achievements SHALL exist with
  `family_evaluation_mode: "all"` for criteria like
  `level_reached` (e.g., "All members reach level 5")

#### Scenario: Service-role upsert pattern

- **WHEN** the progress service upserts a row for a
  `(family_id, family_achievement_id)` pair
- **THEN** the unique constraint SHALL support
  `.upsert()` with
  `onConflict: 'family_id,family_achievement_id'`
