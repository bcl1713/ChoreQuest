# Achievement Database Design

## Context

ChoreQuest uses Supabase (Postgres) with sequential numbered
SQL migrations under `supabase/migrations/`. RLS policies use a
`get_user_family_id()` helper for family-scoped isolation.
Existing tables (`achievements`, `user_achievements`) from
`001_initial_schema.sql` are empty and unreferenced — they will
be dropped and replaced.

The migration conventions established in this project:

- Single SQL file per migration with `YYYYMMDD` prefix
- `IF NOT EXISTS` / `IF EXISTS` guards for idempotency
- `REPLICA IDENTITY FULL` for tables needing real-time events
- `trigger_set_timestamp()` for `updated_at` auto-management
- RLS enabled with policies per table

Migration tests in this project use file-content validation
(regex against SQL text) to verify structural correctness —
confirming that required columns, constraints, policies, and
seed data are present in the migration file. See
`tests/unit/migrations/default-quest-templates.test.ts`.
These tests confirm the migration contains the right DDL
but do not prove SQL validity or RLS behavior. Actual
correctness is validated by `supabase db reset` during the
migration plan (step 2), which executes the SQL against a
real Postgres instance and will fail on syntax errors,
invalid FKs, or broken policy references.

## Goals / Non-Goals

**Goals:**

- Satisfy all acceptance criteria in issue #134
- Establish schema that downstream issues (#135–#140) can
  build on without further table changes
- Follow existing migration, RLS, and testing conventions
- Keep migration safe to run on environments with existing
  data in other tables

**Non-Goals:**

- Achievement evaluation logic (issue #136)
- Progress tracking service (issue #135)
- Notification system (issue #137)
- UI components (issue #138)
- Family achievement management UI or API (issue #140)
- Application code changes of any kind

## Decisions

### 1. Single migration file vs multiple

**Decision:** Single migration file containing all DDL.

**Rationale:** The three new tables and their policies are
tightly coupled — there is no meaningful intermediate state
where only some exist. A single file is simpler to review,
test, and roll back. This matches the pattern of
`001_initial_schema.sql` which created all tables together.

**Alternative considered:** Separate migrations for tables,
RLS, and seeds. Rejected because it adds file count without
adding rollback granularity — Supabase migrations are
all-or-nothing per file anyway.

### 2. DROP + CREATE vs ALTER existing tables

**Decision:** DROP the existing `user_achievements` and
`achievements` tables, then CREATE new tables from scratch.

**Rationale:** The existing tables have no data, no
application code references, and a substantially different
schema (missing category FK, criteria system, progress
tracking, character_id keying). ALTER would require more
statements than DROP+CREATE and produce the same result.

**Safety justification:** These tables were premature
scaffolding created during the initial schema before the
achievement feature was designed. No application code has
ever read from or written to them, and they contain no
data in any environment. `DROP TABLE IF EXISTS` is used
for idempotency (safe to re-run if tables are already
gone), not as a data-safety mechanism.

### 3. criteria_type as TEXT vs ENUM

**Decision:** TEXT, not an ENUM.

**Rationale:** The evaluation engine (#136) will define new
criteria types as it evolves. Adding ENUM values requires a
migration each time. TEXT with application-level validation
is more flexible and matches the pattern used for
`participation_status` on `boss_battle_participants` (TEXT
with CHECK constraint). We do NOT add a CHECK constraint
here because the valid set of criteria types will grow as
issues #135 and #136 are implemented.

**Alternative considered:** Postgres ENUM. Rejected because
it couples the type list to the schema rather than the
evaluation engine where it belongs.

### 4. character_id FK target

**Decision:** FK references `characters(id)`, not
`user_profiles(id)`.

**Rationale:** Achievements track character progression (XP,
gold, level, streaks) which all live on the `characters`
table. The 1:1 relationship between users and characters
means no data loss. The `characters.user_id` column provides
the join path to user context when needed for RLS.

### 5. RLS policy structure

**Decision:** Three-tier access model.

- **Global achievements** (`family_id IS NULL`): readable by
  all authenticated users via `achievements` SELECT policy
- **Family achievements** (`family_id` matches): readable by
  family members only
- **Character achievements**: readable by family members
  (via join through `characters` → `user_profiles` →
  `family_id`), insertable only via service role
- **Achievement management**: Guild Masters can INSERT/UPDATE
  /DELETE on `achievements` WHERE `family_id` matches their
  family (for future #140 family achievements)
- **Categories**: readable by all, manageable only via
  service role (global taxonomy)

This follows the existing pattern where `rewards` uses
family-scoped RLS and `boss_battles` restricts management to
Guild Masters.

### 6. Seed data approach

**Decision:** Seed achievements and categories in the same
migration file using INSERT statements.

**Rationale:** Achievements are reference data, not user
data. Seeding in the migration ensures every environment
starts with the same base set. This matches the pattern of
`013_create_default_quest_templates.sql` and
`20251002000005_create_default_reward_templates.sql`.

Reward values in seed data are draft and flagged for
balancing — they can be updated via a follow-up migration.

### 7. Migration file naming

**Decision:** `20260318000001_achievement_system_schema.sql`

Follows the `YYYYMMDD` + sequence number convention
established in the project.

## Risks / Trade-offs

**[Risk] Dropping tables in production** → The existing
`achievements` and `user_achievements` tables are premature
scaffolding — no application code has ever touched them
and they contain no data. `DROP TABLE IF EXISTS` provides
idempotency (safe re-run), not data protection. The safety
case rests entirely on verified emptiness and the absence
of any code path referencing these tables.

**[Risk] criteria_type without CHECK constraint** → Invalid
criteria types could be inserted. Mitigated: only service
role can insert achievements (RLS policy), and the evaluation
engine (#136) will validate types at the application layer.

**[Trade-off] nullable family_id adds minor schema
complexity** → Accepted because it avoids a future migration
and RLS rewrite for #140. The column is indexed and NULLable,
so storage and query cost is negligible.

**[Risk] Seed data reward values may be unbalanced** →
Accepted: values are explicitly flagged as draft. A
follow-up migration can UPDATE rewards after playtesting.
No application code depends on specific reward amounts in
this change.

## Migration Plan

1. Run migration:
   `supabase migration new achievement_system_schema`
   then replace contents with the authored SQL
2. Apply locally: `supabase db reset` or
   `supabase migration up`
3. Regenerate TypeScript types:
   `supabase gen types typescript --local`
4. Run migration tests: `npm run test`
5. Verify in Supabase Studio: tables exist, seed data
   present, RLS policies active

**Rollback:** Drop the three new tables and re-run
`001_initial_schema.sql`'s achievement/user_achievement
CREATE statements. Not automated — manual if needed.

## Open Questions

None at this time. All key decisions are resolved.
