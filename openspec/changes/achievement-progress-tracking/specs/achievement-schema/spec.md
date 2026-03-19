# achievement-schema Delta Specification

## Purpose

Add behavioral integration requirements for how the
progress tracking service interacts with the existing
`character_achievements` table schema defined in the
achievement-schema spec. No DDL changes.

## ADDED Requirements

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

The absence of `character_achievements` rows for a
given `character_id` SHALL be used as the signal that
backfill has not yet run for that character. No
additional columns or flags are required. Backfill
writes SHALL be performed as a single batch upsert
(atomic) so that partial writes cannot leave a false
"complete" signal.

#### Scenario: No rows means backfill needed

- **WHEN** a query for `character_achievements` where
  `character_id` = X returns zero rows
- **THEN** the progress service SHALL interpret this
  as "backfill has not run" and evaluate all criteria

#### Scenario: Any rows means backfill complete

- **WHEN** a query for `character_achievements` where
  `character_id` = X returns one or more rows
- **THEN** the progress service SHALL interpret this
  as "backfill has already run" and evaluate only
  event-scoped criteria

#### Scenario: Failed batch upsert leaves no partial rows

- **WHEN** the batch upsert during backfill fails
- **THEN** zero `character_achievements` rows SHALL
  exist for that character, ensuring the next call
  retries the full backfill
