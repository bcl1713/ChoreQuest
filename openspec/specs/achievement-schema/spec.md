# achievement-schema Specification

## Purpose

Define the database schema for the achievement system including
tables, constraints, indexes, RLS policies, real-time support,
and seed data.

## Requirements

### Requirement: Achievement Categories Table

The migration SHALL create an `achievement_categories` table
with columns: `id` (UUID PK, auto-generated), `name`
(TEXT NOT NULL), `description` (TEXT), `display_order`
(INT DEFAULT 0), `icon` (TEXT), `created_at` (TIMESTAMPTZ),
`updated_at` (TIMESTAMPTZ).

#### Scenario: Category row is created with defaults

- **WHEN** a row is inserted with only `name` provided
- **THEN** the row SHALL have `display_order` defaulting to 0,
  nullable fields as NULL, and `created_at`/`updated_at`
  auto-populated

#### Scenario: Category updated_at is auto-managed

- **WHEN** a category row is updated
- **THEN** the `updated_at` column SHALL be set to the current
  timestamp via the `trigger_set_timestamp()` trigger

### Requirement: Achievements Table

The migration SHALL create an `achievements` table with
columns: `id` (UUID PK, auto-generated), `name`
(TEXT NOT NULL), `description` (TEXT NOT NULL), `category_id`
(UUID FK referencing `achievement_categories(id)`), `icon`
(TEXT), `xp_reward` (INT DEFAULT 0), `gold_reward`
(INT DEFAULT 0), `is_hidden` (BOOL DEFAULT FALSE),
`criteria_type` (TEXT NOT NULL), `criteria_config`
(JSONB NOT NULL), `family_id`
(UUID FK referencing `families(id)`, NULLABLE),
`created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).

#### Scenario: Achievement row with all required fields

- **WHEN** a row is inserted with `name`, `description`,
  `criteria_type`, and `criteria_config`
- **THEN** the row SHALL be created with `xp_reward` and
  `gold_reward` defaulting to 0, `is_hidden` defaulting to
  FALSE, and `family_id` defaulting to NULL (global)

#### Scenario: Achievement references a valid category

- **WHEN** a row is inserted with a `category_id`
- **THEN** the FK constraint SHALL require that the
  `category_id` exists in `achievement_categories`

#### Scenario: Achievement references a valid family

- **WHEN** a row is inserted with a non-NULL `family_id`
- **THEN** the FK constraint SHALL require that the
  `family_id` exists in `families`

#### Scenario: Achievement updated_at is auto-managed

- **WHEN** an achievement row is updated
- **THEN** the `updated_at` column SHALL be set to the current
  timestamp via the `trigger_set_timestamp()` trigger

### Requirement: Character Achievements Table

The migration SHALL create a `character_achievements` table
with columns: `id` (UUID PK, auto-generated), `character_id`
(UUID FK referencing `characters(id)` with ON DELETE CASCADE),
`achievement_id` (UUID FK referencing `achievements(id)` with
ON DELETE CASCADE), `unlocked_at` (TIMESTAMPTZ),
`progress` (JSONB), `notified` (BOOL DEFAULT FALSE),
`created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ),
with a UNIQUE constraint on `(character_id, achievement_id)`.

#### Scenario: Character achievement tracks unlock

- **WHEN** a character unlocks an achievement
- **THEN** a row SHALL be inserted with `unlocked_at` set and
  `notified` defaulting to FALSE

#### Scenario: Duplicate unlock is prevented

- **WHEN** a row is inserted with a `(character_id,
  achievement_id)` pair that already exists
- **THEN** the database SHALL reject the insert with a unique
  constraint violation

#### Scenario: Character deletion cascades

- **WHEN** a character is deleted from the `characters` table
- **THEN** all associated `character_achievements` rows SHALL
  be deleted via ON DELETE CASCADE

#### Scenario: Achievement deletion cascades

- **WHEN** an achievement is deleted from the `achievements`
  table
- **THEN** all associated `character_achievements` rows SHALL
  be deleted via ON DELETE CASCADE

#### Scenario: Progress tracking via JSONB

- **WHEN** a character has partial progress toward an
  achievement
- **THEN** the `progress` column SHALL store progress state
  as JSONB (e.g., `{"current": 7, "threshold": 10}`)

#### Scenario: Character achievement updated_at is auto-managed

- **WHEN** a character_achievements row is updated
- **THEN** the `updated_at` column SHALL be set to the current
  timestamp via the `trigger_set_timestamp()` trigger

### Requirement: Drop Legacy Tables

The migration SHALL drop the existing `user_achievements` and
`achievements` tables before creating the new schema. These
tables are premature scaffolding with no data and no
application code references.

#### Scenario: Legacy tables are removed

- **WHEN** the migration runs
- **THEN** `user_achievements` SHALL be dropped first (it
  references `achievements`), followed by `achievements`,
  using `DROP TABLE IF EXISTS` for idempotency

#### Scenario: Drop order respects FK dependencies

- **WHEN** the migration drops legacy tables
- **THEN** `user_achievements` SHALL be dropped before
  `achievements` because it holds a FK reference to
  `achievements`

### Requirement: Indexes for Query Performance

The migration SHALL create indexes on: `character_achievements
.character_id`, `character_achievements.achievement_id`,
`achievements.category_id`, `achievements.family_id`,
`achievements.criteria_type`.

#### Scenario: Character achievement lookup indexes exist

- **WHEN** the migration completes
- **THEN** indexes SHALL exist on
  `character_achievements.character_id` and
  `character_achievements.achievement_id`

#### Scenario: Achievement filtering indexes exist

- **WHEN** the migration completes
- **THEN** indexes SHALL exist on
  `achievements.category_id`, `achievements.family_id`,
  and `achievements.criteria_type`

### Requirement: RLS Policies for Achievement Data

The migration SHALL enable RLS on all three tables and create
policies that enforce read-only access for players and
management access for Guild Masters on family-scoped data.

#### Scenario: Global achievements are readable by all

- **WHEN** any authenticated user queries `achievements`
- **THEN** rows with `family_id IS NULL` SHALL be visible

#### Scenario: Family achievements are visible to members

- **WHEN** an authenticated user queries `achievements`
- **THEN** rows where `family_id` matches their family
  (via `get_user_family_id()`) SHALL be visible

#### Scenario: Non-family achievements are hidden

- **WHEN** an authenticated user queries `achievements`
- **THEN** rows where `family_id` is a different family SHALL
  NOT be visible

#### Scenario: Guild Masters can manage family achievements

- **WHEN** a Guild Master inserts, updates, or deletes an
  achievement with `family_id` matching their family
- **THEN** the operation SHALL be permitted

#### Scenario: Non-Guild-Masters cannot manage achievements

- **WHEN** a HERO or YOUNG_HERO attempts to insert, update,
  or delete an achievement
- **THEN** the operation SHALL be denied by RLS

#### Scenario: Categories are globally readable

- **WHEN** any authenticated user queries
  `achievement_categories`
- **THEN** all rows SHALL be visible

#### Scenario: Categories are managed via service role only

- **WHEN** a non-service-role user attempts to insert, update,
  or delete an achievement category
- **THEN** the operation SHALL be denied by RLS

#### Scenario: Family members can view character achievements

- **WHEN** a user queries `character_achievements`
- **THEN** rows for characters in their family SHALL be
  visible (via join through `characters.user_id` to
  `user_profiles.family_id`)

#### Scenario: Character achievements are inserted via service role

- **WHEN** the achievement system needs to record an unlock
  or progress update
- **THEN** the insert/update SHALL be performed via service
  role, not through user-context RLS

### Requirement: Real-time Support for Character Achievements

The migration SHALL set `REPLICA IDENTITY FULL` on the
`character_achievements` table to enable Supabase Realtime
to broadcast unlock events with complete row data.

#### Scenario: Real-time DELETE includes full old record

- **WHEN** a `character_achievements` row is deleted
- **THEN** Supabase Realtime SHALL receive the full old
  record (not just the primary key)

#### Scenario: Real-time UPDATE includes full data

- **WHEN** a `character_achievements` row is updated
  (e.g., `notified` set to TRUE)
- **THEN** Supabase Realtime SHALL receive both old and new
  row data for filter evaluation

### Requirement: Seed Initial Achievement Definitions

The migration SHALL seed achievement categories and
achievement definitions providing a starter set across
multiple categories. Seed data SHALL include achievements
for quest completion milestones, leveling milestones,
gold earning, boss battle participation, streak milestones,
and hidden achievements. All seed achievements SHALL have
`family_id` as NULL (global). Reward values are draft and
subject to balancing.

#### Scenario: Categories are seeded

- **WHEN** the migration completes
- **THEN** achievement categories SHALL exist for at least:
  Adventurer (quest-related), Warrior (boss-related),
  Wealth (gold/economy), Growth (leveling/XP),
  Dedication (streaks), and Secret (hidden achievements)

#### Scenario: Quest completion achievements are seeded

- **WHEN** the migration completes
- **THEN** achievements SHALL exist with `criteria_type` of
  `quest_complete` at multiple thresholds (e.g., 1, 10, 50,
  100 quests)

#### Scenario: Level milestone achievements are seeded

- **WHEN** the migration completes
- **THEN** achievements SHALL exist with `criteria_type` of
  `level_reached` at multiple thresholds (e.g., levels 2, 5,
  10, 20)

#### Scenario: Hidden achievements are seeded

- **WHEN** the migration completes
- **THEN** at least one achievement SHALL have `is_hidden`
  set to TRUE

#### Scenario: All seed achievements are global

- **WHEN** the migration completes
- **THEN** every seeded achievement SHALL have `family_id`
  as NULL

### Requirement: Migration Tests

The migration SHALL have unit tests that validate the SQL
file contains the required DDL statements, constraints,
policies, and seed data. These are structural validation
tests (regex against SQL text). Actual SQL correctness is
validated by `supabase db reset` during deployment.

#### Scenario: Table creation is tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify the SQL contains CREATE
  TABLE statements for `achievement_categories`,
  `achievements`, and `character_achievements`

#### Scenario: Required columns are tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify each table's CREATE
  statement includes all required columns from issue #134

#### Scenario: RLS enablement is tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify the SQL contains
  `ENABLE ROW LEVEL SECURITY` for all three tables

#### Scenario: Index creation is tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify the SQL contains CREATE
  INDEX statements for the required indexes

#### Scenario: Seed data is tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify the SQL contains INSERT
  statements for categories and achievements

#### Scenario: Legacy table drop is tested

- **WHEN** migration tests run
- **THEN** the test SHALL verify the SQL contains DROP TABLE
  statements for `user_achievements` and `achievements`

### Requirement: Service-role upsert pattern

The `character_achievements` table SHALL support
upsert operations via service role using the existing
unique constraint on
`(character_id, achievement_id)`. The progress
tracking service writes to this table using
`.upsert()` with
`onConflict: 'character_id,achievement_id'`.

#### Scenario: Upsert inserts new progress row

- **WHEN** the progress service upserts a row for a
  (character_id, achievement_id) pair that does not
  exist
- **THEN** a new row SHALL be inserted with the
  provided `progress` JSONB and `unlocked_at` as NULL

#### Scenario: Upsert updates existing progress row

- **WHEN** the progress service upserts a row for a
  (character_id, achievement_id) pair that already
  exists
- **THEN** the `progress` column SHALL be updated
  and `unlocked_at` SHALL remain unchanged

#### Scenario: Upsert preserves unlocked_at

- **WHEN** a `character_achievements` row has
  `unlocked_at` set (by the future unlock evaluation
  engine) and the progress service upserts new
  progress
- **THEN** the `unlocked_at` value SHALL NOT be
  overwritten by the progress upsert

### Requirement: Backfill row detection

The absence of any expected `character_achievements`
rows for a given `character_id` SHALL be used as the
signal that backfill is needed. The service checks
whether the character is missing rows for any
achievement in the family's current achievement set —
if any achievement row is absent, it runs all
evaluators. This is intentionally stricter than a
simple "zero rows" check: it allows the system to
self-heal partial backfills and automatically backfill
newly seeded achievements for characters that were
already evaluated before those achievements existed.
No additional columns or flags are required. Backfill
writes SHALL be performed as a single batch upsert
(atomic) so that partial writes cannot leave a false
"complete" signal.

#### Scenario: Missing achievement rows means backfill needed

- **WHEN** a character is missing one or more
  `character_achievements` rows for the family's
  current achievement set
- **THEN** the progress service SHALL interpret this
  as "backfill incomplete" and evaluate all 13
  criteria types

#### Scenario: All achievement rows present means backfill complete

- **WHEN** a character has a `character_achievements`
  row for every achievement in the family's current
  achievement set
- **THEN** the progress service SHALL interpret this
  as "backfill already run" and evaluate only
  event-scoped criteria

#### Scenario: Failed batch upsert leaves no partial rows

- **WHEN** the batch upsert during backfill fails
- **THEN** zero `character_achievements` rows SHALL
  exist for that character, ensuring the next call
  retries the full backfill
