# achievement-progress Delta Specification

## Purpose

Modify the `updateProgress` method to invoke the
unlock evaluation engine after writing progress, and
expand the achievements query to include reward fields.

## MODIFIED Requirements

### Requirement: updateProgress method

The `updateProgress` method SHALL accept a
`characterId` (string) and an event object containing
`type` (the triggering event type) and optional
metadata. It SHALL resolve the character's `user_id`
and the owning user's `family_id` from the
`characters` and `user_profiles` tables, fetch all
visible achievements (global plus matching
family-scoped rows) from the `achievements` table,
run the appropriate evaluators, upsert results into
`character_achievements`, and then invoke the unlock
evaluation engine to detect and process any newly-met
achievement criteria.

#### Scenario: Progress updated after quest approval

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `QUEST_APPROVED`
- **THEN** it SHALL evaluate all quest-related criteria
  (`quest_complete`, `quest_volunteer`,
  `quest_difficulty`) plus `gold_earned`, `xp_earned`,
  `level_reached`, and `streak_reached` for that
  character
- **AND** it SHALL run unlock evaluation against the
  upserted progress

#### Scenario: Progress updated after reward approval

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `REWARD_APPROVED`
- **THEN** it SHALL evaluate `gold_spent` and
  `reward_redeemed` criteria for that character
- **AND** it SHALL run unlock evaluation against the
  upserted progress

#### Scenario: Progress updated after boss completion

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `BOSS_COMPLETED`
- **THEN** it SHALL evaluate `boss_defeated`,
  `boss_participated`, `gold_earned`, `xp_earned`,
  and `level_reached` criteria for that character
- **AND** it SHALL run unlock evaluation against the
  upserted progress

#### Scenario: Progress updated after class change

- **WHEN** `updateProgress` is called with a
  `characterId` and event type `CLASS_CHANGED`
- **THEN** it SHALL evaluate `class_change` criteria
  for that character
- **AND** it SHALL run unlock evaluation against the
  upserted progress

#### Scenario: Invalid character ID

- **WHEN** `updateProgress` is called with a
  `characterId` that does not exist in `characters`
- **THEN** it SHALL throw an error and not modify any
  `character_achievements` rows

#### Scenario: Unlock evaluation failure is non-blocking

- **WHEN** the unlock evaluation engine throws an
  error after progress has been successfully upserted
- **THEN** the progress upsert SHALL persist and the
  error SHALL be logged but SHALL NOT cause
  `updateProgress` to throw

### Requirement: Retroactive backfill on missing rows

Whenever `updateProgress` is called for a character
and any achievement lacks a corresponding
`character_achievements` row for that character, the
service SHALL run all 13 evaluators to backfill
progress from existing database state. This covers
two cases: (1) the first evaluation for a character
who has no rows yet, and (2) post-deployment cases
where new achievements are added after a character's
initial backfill. The full set of backfill upserts
SHALL be written in a single batch upsert call so
that the operation is atomic — either all rows are
written or none are. After the backfill upsert, the
unlock evaluation engine SHALL run against all
backfilled progress to retroactively unlock and
reward any achievements whose criteria are already
met. Subsequent calls WHERE all achievements have
rows SHALL run only the evaluators mapped to the
triggering event type.

#### Scenario: First evaluation triggers full backfill

- **WHEN** `updateProgress` is called for a character
  with zero `character_achievements` rows
- **THEN** the service SHALL evaluate all 13 criteria
  types and upsert progress for every achievement in
  a single batch upsert
- **AND** the unlock evaluation engine SHALL run
  against all backfilled progress

#### Scenario: New achievements trigger partial backfill

- **WHEN** `updateProgress` is called for a character
  that has some `character_achievements` rows but
  is missing rows for one or more achievements
  (e.g., new achievements added post-deployment)
- **THEN** the service SHALL evaluate all 13 criteria
  types and upsert progress for every achievement in
  a single batch upsert
- **AND** the unlock evaluation engine SHALL run
  against all backfilled progress

#### Scenario: Partial backfill failure leaves no rows

- **WHEN** the batch upsert during backfill fails
- **THEN** no `character_achievements` rows SHALL be
  written for that character, and the next
  `updateProgress` call SHALL retry the full backfill

#### Scenario: Subsequent evaluation is scoped

- **WHEN** `updateProgress` is called for a character
  that already has `character_achievements` rows for
  every achievement
- **THEN** the service SHALL evaluate only the
  criteria types mapped to the event type
- **AND** unlock evaluation SHALL run only against
  the scoped progress results

## ADDED Requirements

### Requirement: Expanded achievements query

The `fetchAchievements` method within `updateProgress`
SHALL select `xp_reward`, `gold_reward`, and `name`
in addition to the existing `id`, `criteria_type`, and
`criteria_config` columns. These fields are required
by the unlock evaluation engine for reward granting
and logging.

#### Scenario: Query includes reward columns

- **WHEN** `fetchAchievements` is called
- **THEN** the returned rows SHALL include `id`,
  `name`, `criteria_type`, `criteria_config`,
  `xp_reward`, and `gold_reward` fields

#### Scenario: Reward values are accessible

- **WHEN** the unlock evaluation engine processes an
  achievement from the fetched list
- **THEN** it SHALL have access to `xp_reward` and
  `gold_reward` without an additional query

### Requirement: Compound criteria type in evaluator registry

The evaluator registry SHALL include an entry for the
`compound` criteria type. The compound evaluator SHALL
NOT perform a database query itself; instead it SHALL
delegate to the sub-condition evaluators referenced in
`criteria_config.conditions` and return a composite
result. The compound evaluator SHALL be included in
`ALL_CRITERIA_TYPES`.

#### Scenario: Compound criteria type is registered

- **WHEN** the evaluator registry is inspected
- **THEN** it SHALL contain an entry for `"compound"`

#### Scenario: Compound evaluator delegates to sub-evaluators

- **WHEN** the compound evaluator is called with a
  `criteria_config` containing two conditions
- **THEN** it SHALL call the registered evaluator for
  each sub-condition's `criteria_type`

#### Scenario: Unknown sub-condition criteria type

- **WHEN** a compound condition references a
  `criteria_type` not in the registry
- **THEN** the compound evaluator SHALL log a warning
  and treat that sub-condition as not met
