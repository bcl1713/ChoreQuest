# Achievement Progress Tracking — Design

## Context

ChoreQuest has three event-producing flows that affect
achievement progress:

1. **Quest approval** — server-side in
   `lib/quest-instance/approve-quest.ts`. After
   approving a quest, the function updates character
   stats (XP, gold, level, streak) and returns. This
   is the single source of truth for quest completion,
   XP/gold earned, level-ups, and streaks. Note: this
   flow does **not** write to the `transactions` table.
2. **Boss quest completion** — server-side in the API
   route `app/api/boss-quests/[id]/complete/route.ts`.
   Iterates participants, updates character stats, then
   marks the boss quest as defeated. This flow **does**
   write to `transactions` (type: BOSS_VICTORY).
3. **Reward redemption** — client-side in the React hook
   `useRewardStoreActions.ts`. Inserts a
   `reward_redemptions` row and deducts gold from the
   character directly. Does not write to `transactions`.

Key schema facts for evaluator design:

- `quest_instances` uses `assigned_to_id` (a
  `user_profiles.id` FK) and `volunteered_by` (a
  `characters.id` FK) — not `character_id`
- `boss_battle_participants` uses `user_id` (a
  `user_profiles.id` FK) and `participation_status`
  (not `status`)
- `reward_redemptions` uses `user_id` (a
  `user_profiles.id` FK) — not `character_id`
- `transactions` uses `user_id` — only boss completion
  currently writes transaction rows
- `character_quest_streaks` uses `character_id`
- `characters` has `user_id`, `xp`, `gold`, `level`,
  `honor_points`

Because most tables key on `user_id` rather than
`character_id`, every evaluator must first resolve the
character's `user_id` from the `characters` table. The
service caches this lookup for the duration of a single
`updateProgress` call.

All services use direct Supabase client queries with
`{ data, error }` destructuring. Constructor-based
dependency injection accepts
`SupabaseClient<Database>` and defaults to a singleton.
Service-role clients bypass RLS via
`createServiceSupabaseClient()`.

The `character_achievements` table (from issue 134) has
a unique constraint on `(character_id, achievement_id)`,
a `progress` JSONB column, and RLS policies that require
service-role for inserts/updates.

## Goals / Non-Goals

**Goals:**

- Compute and persist progress for all 13 seeded
  criteria types using absolute-value recomputation
- Integrate into quest approval, boss completion, and
  reward approval flows without blocking their
  critical paths
- Support one-time retroactive backfill for existing
  characters
- Maintain testability via dependency injection

**Non-Goals:**

- Unlock evaluation (setting `unlocked_at`) — issue 136
- Notification emission — issue 137
- New public/client-facing API routes
- `class_change` / `honor_earned` runtime triggers
  (backfill-only evaluators; triggers deferred)

## Decisions

### 1. Service structure: single class with evaluator registry

`AchievementProgressService` is a single class in
`lib/achievement-progress-service.ts`. The constructor
accepts an optional `SupabaseClient<Database>` for read
operations (evaluator queries, character lookups),
defaulting to a service-role client. Writes to
`character_achievements` always use a service-role
client regardless of the injected read client — this
satisfies RLS while allowing tests to inject a mock
read client. Each criteria type maps to an evaluator
function via a `Record<string, EvaluatorFn>` registry.
Evaluators are pure functions that accept a Supabase
client, character ID, and user ID, query canonical
state, and return `{ current: number }`.

**Why over per-criteria classes:** The evaluators are
small (one query each). Separate classes would add file
overhead without meaningful encapsulation. A registry
keeps dispatch simple and makes adding new criteria
types trivial.

**Why over a strategy pattern with interfaces:** The
evaluator signature is uniform —
`(client, characterId, userId) => { current: number }`.
An interface adds ceremony without polymorphic benefit.

### 2. Absolute-value recomputation, not event sourcing

Each evaluator queries the current database state and
writes `{ "current": N, "threshold": T }` to the
progress JSONB. The threshold comes from the
achievement's `criteria_config`.

**Why over delta-based counting:** Deltas require
deduplication infrastructure (event IDs, ledger tables)
and are vulnerable to replay bugs. Absolute-value
queries are idempotent by construction. The query cost
is acceptable — these are indexed queries on
per-user/per-character filtered data, not full table
scans.

**Why over caching current values in JSONB and
incrementing:** Incremental updates create drift risk
if any event is missed or replayed. The absolute model
is self-healing: any progress inconsistency is
corrected on the next evaluation.

### 3. Service-role client for all writes

The service uses `createServiceSupabaseClient()` for
all `character_achievements` upserts. RLS policies on
`character_achievements` restrict inserts/updates to
service role.

**Why not user-context client:** RLS policy from issue
134 explicitly requires service role for
inserts/updates. The progress service is a backend
concern, not a user-facing action.

### 4. Await with try/catch, not fire-and-forget

Each integration point awaits the `updateProgress()`
call inside a try/catch block. On failure, the error is
logged and the parent operation continues normally.
This avoids the risk of orphaned promises being
silently dropped when a request handler finishes.

**Why not truly fire-and-forget (unawaited promise):**
In Next.js API routes and server-side functions, the
runtime may tear down the request context before an
unawaited promise resolves. Awaiting with a swallowed
error is safer and adds negligible latency (the
evaluator queries are fast indexed lookups).

**Trade-off:** Quest approval and boss completion gain
a small amount of latency from the achievement queries.
This is acceptable because the queries are per-character
indexed lookups, not full scans.

### 5. Reward approval triggers progress via internal API route

The reward approval flow runs entirely client-side:
`useRewardStoreActions.ts` calls
`RewardService.updateRedemptionStatus()`, which uses
the browser Supabase client. The progress service
requires a service-role client for
`character_achievements` writes, so it cannot run
in the browser.

A lightweight internal API route at
`app/api/achievement-progress/evaluate/route.ts`
bridges this gap. After a GM approves a redemption,
the client hook calls this route to trigger
server-side progress evaluation. The route
authenticates the caller, resolves the character ID,
and invokes `AchievementProgressService.updateProgress()`
with event type `REWARD_APPROVED`. The call is
fire-and-catch on the client side — failures do not
block redemption approval.

**Why not trigger at redemption creation:** The initial
redemption is PENDING. Gold is deducted optimistically,
but a GM can deny it (triggering a refund). Evaluating
progress at approval time avoids counting gold that
may be refunded.

**Why not call progress service from RewardService
directly:** `RewardService` imports the browser
Supabase client (`lib/supabase.ts`), not a
service-role client. The progress service needs
service role for `character_achievements` writes.
A server route is the minimal boundary crossing.

**Why not a Supabase database trigger:** A Postgres
trigger on `reward_redemptions` UPDATE could invoke
a Supabase Edge Function. This adds deployment
complexity and makes testing harder. Deferred unless
the API-route approach proves problematic.

This route is an internal implementation detail
called only from the reward approval hook, not a
public API. The proposal's "no new public API routes"
constraint is preserved.

### 6. Backfill detection via row absence

On `updateProgress`, the service checks whether any
`character_achievements` rows exist for the given
character. If none exist, it runs all 13 evaluators
(full backfill). If rows exist, it runs only the
evaluators mapped to the triggering event type.

**Why over a dedicated backfill flag on characters:**
Adding a column to `characters` couples the achievement
system to the character schema. Row absence is a
reliable signal that requires no schema changes.

**Why over a migration-time backfill script:** Existing
characters may have varying amounts of history. A
one-time migration script runs once and never
self-corrects. The on-demand approach ensures backfill
happens exactly when a character first interacts with
the achievement system.

### 7. Upsert via ON CONFLICT on unique constraint

Progress writes use Supabase's `.upsert()` with
`onConflict: 'character_id,achievement_id'`. This
inserts a new row on first encounter and updates
`progress` on subsequent evaluations.

**Why over separate insert/update logic:** Upsert is
atomic and avoids a read-then-write race condition.
Supabase's `.upsert()` maps directly to Postgres
`ON CONFLICT DO UPDATE`.

### 8. Evaluator query patterns by criteria type

Every evaluator receives `characterId` and `userId`
(resolved once per `updateProgress` call from
`characters.user_id`). Queries use whichever key the
source table requires.

- `quest_complete`: `quest_instances` — COUNT where
  (`assigned_to_id` = userId OR `volunteered_by` =
  characterId) AND `status` = 'APPROVED'
- `quest_volunteer`: `quest_instances` — COUNT where
  `volunteered_by` = characterId AND `status` =
  'APPROVED'
- `quest_difficulty`: `quest_instances` — COUNT where
  (`assigned_to_id` = userId OR `volunteered_by` =
  characterId) AND `status` = 'APPROVED' AND
  `difficulty` matches `criteria_config.difficulty`.
  The `difficulty` column lives on `quest_instances`
  directly (denormalized from template).
- `boss_defeated`: `boss_battle_participants` — COUNT
  where `user_id` = userId AND
  `participation_status` = 'APPROVED'
- `boss_participated`: `boss_battle_participants` —
  COUNT where `user_id` = userId
- `gold_earned`: defined as **base rewards only**
  (excludes volunteer/streak/class bonuses).
  `quest_instances` — SUM `gold_reward` where
  (`assigned_to_id` = userId OR `volunteered_by` =
  characterId) AND `status` = 'APPROVED'. Plus
  `boss_battle_participants` — SUM `awarded_gold`
  where `user_id` = userId AND
  `participation_status` = 'APPROVED'. Combined
  total of both sources. Rationale: bonus gold
  (volunteer, streak, class) is applied at approval
  time and not stored separately on the quest row —
  reconstructing it would require re-running the
  full bonus calculation pipeline. Base rewards are
  the stable, queryable value.
- `gold_spent`: `reward_redemptions` — SUM `cost`
  where `user_id` = userId AND `status` IN
  ('APPROVED', 'FULFILLED'). Only counts confirmed
  redemptions, not PENDING (which may be refunded).
- `reward_redeemed`: `reward_redemptions` — COUNT
  where `user_id` = userId AND `status` IN
  ('APPROVED', 'FULFILLED')
- `xp_earned`: `characters` — read `xp` where
  `id` = characterId
- `level_reached`: `characters` — read `level` where
  `id` = characterId
- `streak_reached`: `character_quest_streaks` — MAX
  `longest_streak` where `character_id` = characterId.
  Uses `longest_streak` (not `current_streak`) so
  progress is never lost when a streak resets.
- `class_change`: backfill-only — returns 0 (no
  change history table exists)
- `honor_earned`: `characters` — read `honor_points`
  where `id` = characterId

## Risks / Trade-offs

- **[Query volume on backfill]** Full backfill runs
  up to 13 queries per character on first evaluation.
  Mitigation: queries are indexed per-user/character
  lookups, not full scans. Monitor query time in
  staging.

- **[gold_earned reconstruction is multi-source]**
  Gold earned must be summed from both
  `quest_instances.gold_reward` (approved quests)
  and `boss_battle_participants.awarded_gold`
  (boss victories). If a new gold source is added
  later (e.g., daily login bonus), the evaluator
  must be updated.
  Mitigation: document the gold sources in the
  evaluator. Consider adding transaction logging to
  quest approval in a future change to centralize
  gold tracking.

- **[Stale progress window]** If a try/catch swallows
  an error, progress is stale until the next
  triggering event.
  Mitigation: absolute-value model self-corrects on
  next successful evaluation.

- **[quest_complete double-counting risk]** A quest
  could match both `assigned_to_id = userId` and
  `volunteered_by = characterId` if the volunteer
  is the same user. The query uses OR, so it counts
  the row once (SQL deduplication by row).
  Mitigation: this is correct behavior — one quest
  is one completion regardless of assignment path.

## Resolved Questions

- **honor_earned evaluator**: reads current
  `honor_points` from `characters` table. The column
  exists and boss completion already awards honor
  points, so this provides accurate backfill-only
  progress. No runtime trigger until a dedicated
  honor system is built.
