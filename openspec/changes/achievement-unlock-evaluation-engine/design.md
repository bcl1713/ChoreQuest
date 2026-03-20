# Achievement Unlock Evaluation Engine — Design

## Context

The achievement system has two layers already built:

1. **Schema** (#134, closed): `achievements`,
   `achievement_categories`, and `character_achievements`
   tables with `unlocked_at`, `progress` JSONB, and
   `xp_reward`/`gold_reward` columns on `achievements`.
2. **Progress tracking** (#135): `AchievementProgressService`
   computes `{ current, threshold }` progress and upserts
   into `character_achievements`. It already has evaluators
   for all 13 criteria types, backfill detection, and
   integration hooks in quest approval, boss completion,
   and reward approval flows.

What's missing: after progress is written, nothing checks
whether `current >= threshold` and sets `unlocked_at` or
grants rewards. The evaluation engine fills this gap.

The existing `updateProgress` flow writes progress via a
batch upsert that deliberately omits `unlocked_at` to avoid
overwriting it. The engine must operate _after_ that upsert
completes, inspecting the freshly-written progress to decide
which achievements should unlock.

## Goals / Non-Goals

**Goals:**

- Detect when an achievement's criteria are met and set
  `unlocked_at` on the `character_achievements` row
- Support threshold (`current >= N`), boolean
  (`current > 0`, truthy), and compound (AND/OR over multiple
  sub-conditions) evaluation strategies
- Grant `xp_reward` and `gold_reward` to the character's
  stats atomically with the unlock
- Be idempotent: re-evaluating an already-unlocked
  achievement must be a no-op (no duplicate rewards)
- Support retroactive evaluation during backfill
- Integrate into the existing `updateProgress` call so
  no callers need to change

**Non-Goals:**

- Notification delivery (#137 handles this via Realtime
  subscriptions on `unlocked_at` changes)
- Family-wide achievements (#140 — separate aggregation)
- Admin UI for creating/editing achievements (#139)
- New API routes or endpoints

## Decisions

### 1. Inline evaluation in `updateProgress`

**Decision:** Add unlock evaluation as a post-step inside
`AchievementProgressService.updateProgress()`, not as a
separate service class.

**Why:** The progress service already has the character
context, achievement list, and freshly-computed progress.
Splitting into a separate `AchievementEvaluator` class
would require passing all this context through or
re-fetching it. The engine is pure logic (compare values,
decide unlock) — it doesn't warrant its own service
lifecycle.

**Alternative considered:** Separate `AchievementEvaluator`
class instantiated by the progress service. Rejected
because it adds indirection without meaningful separation
of concerns — the evaluator needs the same DB client and
the same achievement data the progress service already
holds.

**Implementation:** After the progress upsert succeeds,
iterate the upserted rows. For each row, apply the
appropriate strategy (threshold: `current >= threshold`,
boolean: `current > 0`, compound: combined check). If
criteria are met and the row was not already unlocked,
mark it for unlock.

### 2. Evaluation strategy dispatch

**Decision:** Use a strategy map keyed by a new
`evaluation_strategy` field derived from
`criteria_config`, defaulting to `"threshold"`.

**Why:** All 42 seeded achievements today use simple
threshold comparison (`current >= threshold`). Some
achievements are inherently boolean ("Change your class",
"Earn any honor") where the question is "did it happen?"
rather than "did it reach N?". Compound is needed for
future achievements like "Complete 5 quests AND reach
level 3". Keeping a strategy map makes intent explicit
and the system extensible.

**Strategies:**

- **threshold**: `current >= threshold`. Default for
  achievements with a numeric target. Used by the
  majority of seeded achievements.
- **boolean**: `current > 0` (truthy). For achievements
  where the criteria is simply "did this happen at
  least once?" — e.g., class changes, first quest
  completion. No threshold value needed in
  `criteria_config`; the evaluator result is treated
  as truthy/falsy.
- **compound**: `criteria_config` contains a `conditions`
  array and an `operator` field (`"AND"` or `"OR"`).
  Each condition references a `criteria_type` +
  `threshold` (or `boolean: true`). The engine evaluates
  each sub-condition independently and combines results.

**Alternative considered:** Treating compound as a
separate achievement type with its own table. Rejected —
JSONB `criteria_config` already supports arbitrary
structure, and compound achievements are a presentation
over existing evaluator functions.

### 3. Reward granting via separate update

**Decision:** Grant XP and gold via a direct
`characters` table update after setting `unlocked_at`,
using the service-role write client.

**Why:** Supabase JS client doesn't support multi-table
transactions. We can't atomically set `unlocked_at` AND
update `characters.xp`/`characters.gold` in one call.
Instead, we rely on idempotency: if `unlocked_at` is
already set, rewards are never re-granted.

**Sequence:**

1. Filter upserted progress to find newly-met criteria
   (where criteria are satisfied per strategy and
   `unlocked_at` IS NULL on the existing row)
2. Set `unlocked_at = now()` on those rows
3. Sum `xp_reward` and `gold_reward` across all
   newly-unlocked achievements
4. Fetch character's current XP/level, call
   `RewardCalculator.calculateLevelUp()` with the
   summed XP reward to determine if a level-up occurs
5. Increment `characters.xp` and `characters.gold`
   (and `characters.level` if level-up) via a single
   update
6. If level changed, re-evaluate `level_reached`
   criteria to cascade-unlock level-based achievements

**Idempotency guarantee:** Step 1 checks `unlocked_at IS
NULL`. If a retry hits after step 2 but before step 4
(partial failure), the next call sees `unlocked_at`
already set and skips those achievements. The character
may miss the reward in this edge case. To handle it, the
retroactive evaluation path can detect "unlocked but
stats not updated" by comparing expected vs actual
rewards. For v0.8.0, this edge case is acceptable —
it requires a crash between two sequential DB calls.

**Alternative considered:** Using a Postgres function
(RPC) to atomically unlock + grant rewards. Better
atomicity, but adds migration complexity and moves logic
into SQL. Can be adopted later if the edge case proves
problematic.

### 4. Compound evaluation via sub-evaluator reuse

**Decision:** Compound achievements reuse the existing
`EVALUATOR_REGISTRY` functions for each sub-condition.

**Why:** The evaluator functions are already pure and
tested. A compound condition like
`{ operator: "AND", conditions: [
  { criteria_type: "quest_complete", threshold: 5 },
  { criteria_type: "level_reached", threshold: 3 }
] }`
just runs each sub-evaluator and combines results.

**Progress shape for compound:** The progress JSONB
stores individual sub-condition progress plus an overall
met/not-met flag:

```json
{
  "conditions": [
    { "criteria_type": "quest_complete",
      "current": 7, "threshold": 5, "met": true }
  ],
  "met": true
}
```

The `met` field at the top level determines unlock.

### 5. Fetch achievement rewards in progress flow

**Decision:** Expand the `fetchAchievements` query to
also select `xp_reward`, `gold_reward`, and `name` so
the evaluation step has everything it needs without an
additional query.

**Why:** One extra SELECT column in an already-required
query is far cheaper than a separate fetch. The reward
values are small integers that add negligible payload.

### 6. Retroactive unlock during backfill

**Decision:** When backfill runs (first `updateProgress`
call for a character), the evaluation engine runs against
all backfilled progress in the same call. No separate
"retroactive scan" endpoint.

**Why:** The backfill already computes progress for all
13 criteria types. Running unlock evaluation on those
results is trivial — just the same threshold check. A
separate admin endpoint adds API surface with no benefit
since backfill already handles it.

## Risks / Trade-offs

**[Non-atomic reward granting]** →
Character stats update is a separate DB call from
`unlocked_at` write. Mitigation: idempotency via
`unlocked_at IS NULL` check. Edge case of missed rewards
on crash is acceptable for v0.8.0; can upgrade to RPC
later.

**[Compound evaluation DB cost]** →
A compound achievement with N sub-conditions runs N
evaluator queries. Mitigation: compound achievements are
expected to be rare (< 5 in the initial set). If they
grow, we can cache sub-evaluator results within a single
`updateProgress` call since the same criteria types are
often evaluated for multiple achievements already.

**[Reward inflation from retroactive unlocks]** →
A character who has been playing for weeks gets a burst
of XP/gold when backfill runs. Mitigation: this is
intentional — they earned it. The XP/gold amounts on
achievements are modest (tuned as "bonus" not "primary
income"). If needed, rewards can be capped or flagged
as retroactive.

**[Notification timing for bulk unlocks]** →
Retroactive backfill may unlock many achievements at
once, each writing `unlocked_at`. The notification
system (#137) will see a burst of Realtime events.
Mitigation: #137's design should include queuing
(sequential display of toasts). This is out of scope
for the evaluation engine.

## Resolved Questions

- **Level-up from XP rewards:** The engine SHALL apply
  level-ups when granted XP pushes a character past a
  level threshold. `RewardCalculator.calculateLevelUp()`
  already exists as pure logic in `lib/reward-calculator.ts`
  and is used by quest approval. After granting XP, the
  engine calls `calculateLevelUp` with the character's
  current XP, the granted XP, and current level. If a
  level-up occurs, the engine updates `characters.level`
  in the same stats update that writes XP/gold, then
  re-evaluates `level_reached` criteria so level-based
  achievements can cascade-unlock in the same call.
- **Compound achievement seeding:** This change will
  include 2 example compound achievements to prove the
  strategy works. Admin UI for creating more is deferred
  to #139.
