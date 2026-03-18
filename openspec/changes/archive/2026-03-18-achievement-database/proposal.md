# Achievement Database Proposal

## Why

ChoreQuest has no achievement system despite placeholder tables
existing since the initial schema. Achievements are a core RPG
engagement mechanic that reward players for milestones, encourage
exploration of game systems (boss battles, streaks, volunteering),
and provide long-term goals beyond individual quests. This is the
foundational schema work for the v0.8.0 Achievement System
milestone (#134), enabling all downstream issues (#135–#140) to
build on a solid data layer.

## What Changes

- **DROP** existing unused `achievements` and `user_achievements`
  tables. These were created in the initial schema but never
  seeded, never referenced by application code, and contain no
  data. They are being replaced with a richer schema that
  satisfies #134's acceptance criteria.
- **CREATE** `achievement_categories` table with fields: `id`
  (UUID PK), `name` (TEXT NOT NULL), `description` (TEXT),
  `display_order` (INT DEFAULT 0), `icon` (TEXT),
  `created_at`, `updated_at`
- **CREATE** `achievements` table with fields: `id` (UUID PK),
  `name` (TEXT NOT NULL), `description` (TEXT NOT NULL),
  `category_id` (UUID FK → achievement_categories), `icon`
  (TEXT), `xp_reward` (INT DEFAULT 0), `gold_reward`
  (INT DEFAULT 0), `is_hidden` (BOOL DEFAULT FALSE),
  `criteria_type` (TEXT NOT NULL), `criteria_config`
  (JSONB NOT NULL), `family_id` (UUID FK → families, NULLABLE),
  `created_at`, `updated_at`. The issue's `category` field is
  satisfied by `category_id` FK, which is a normalized form of
  the same requirement.
- **CREATE** `character_achievements` table with fields: `id`
  (UUID PK), `character_id` (UUID FK → characters),
  `achievement_id` (UUID FK → achievements), `unlocked_at`
  (TIMESTAMPTZ), `progress` (JSONB), `notified`
  (BOOL DEFAULT FALSE), `created_at`, `updated_at`,
  `UNIQUE(character_id, achievement_id)`. Keyed on
  `character_id` rather than `user_id` because achievements
  track the character's journey and align with where XP, gold,
  and level already live.
- **ADD** indexes on: `character_achievements.character_id`,
  `character_achievements.achievement_id`,
  `achievements.category_id`, `achievements.family_id`,
  `achievements.criteria_type`
- **ADD** RLS policies: achievements readable by all
  authenticated users (global rows where `family_id IS NULL`)
  and by family members (rows matching `get_user_family_id()`);
  `character_achievements` readable by family members,
  insertable via service role; Guild Masters can manage
  family-scoped achievements
- **ADD** `REPLICA IDENTITY FULL` on `character_achievements`
  for real-time unlock events
- **SEED** initial achievement definitions across 6 categories
  (~25 achievements) with draft reward values flagged for
  balancing during implementation
- **ADD** migration tests validating schema constraints, RLS
  policies, and seed data integrity

### Scope Note: family_id on achievements

Issue #134 does not require family-specific achievements — that
is #140's scope. We include a nullable `family_id` column now
because: (1) the cost is near-zero (nullable UUID + one index),
(2) retrofitting it later requires a migration plus RLS policy
changes that touch the same policies we're writing now, and
(3) the RLS logic is simpler to write once with both cases than
to rewrite later. The column will be NULL for all seed data.
This is a schema affordance, not a feature — no application code
will use it in this change.

## Capabilities

### New Capabilities

- `achievement-schema`: Database tables, columns, constraints,
  indexes, RLS policies, replica identity, and seed data for
  `achievement_categories`, `achievements`, and
  `character_achievements`

### Modified Capabilities

None. Existing application behavior is unaffected. The dropped
tables (`achievements`, `user_achievements`) are unreferenced by
any application code, so removing them has no behavioral impact.
The new tables are additive infrastructure for future issues.

## Impact

- **Database**: Migration drops 2 empty/unused tables, creates
  3 new tables with RLS policies, indexes, and seed data
- **Supabase types**: TypeScript types will need regeneration
  after migration to include new tables
- **No application code changes**: This is schema-only; the
  evaluation engine (#136), progress service (#135), and
  UI (#138) are separate issues
- **Real-time**: `character_achievements` will be available for
  Supabase Realtime subscriptions once the notification
  system (#137) is built
