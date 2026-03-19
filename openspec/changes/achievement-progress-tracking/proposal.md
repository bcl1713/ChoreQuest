# Achievement Progress Tracking

## Why

The achievement system database schema (issue 134) is in
place but nothing tracks player progress toward
achievements. Players complete quests, earn XP, level up,
and spend gold — yet none of these actions update
`character_achievements.progress`. This service is the
foundational runtime layer that connects game events to
progress state. All downstream milestone features — unlock
evaluation (issue 136), notifications (issue 137), badge
display (issue 138) — depend on accurate progress data
existing in the database.

## What Changes

- Add an `AchievementProgressService` with methods:
  `updateProgress(characterId, event)` and
  `getProgress(characterId)`
- Implement progress evaluators for all 13 seeded
  criteria types from the migration, with runtime
  trigger integration for 11 currently supported
  event sources; `class_change` and `honor_earned`
  remain backfill-only until their trigger paths
  are defined:
  - **Quest-related**: `quest_complete`,
    `quest_volunteer`, `quest_difficulty`
  - **Boss-related**: `boss_defeated`,
    `boss_participated`
  - **Economy**: `gold_earned`, `gold_spent`,
    `reward_redeemed`
  - **Growth**: `level_reached`, `xp_earned`
  - **Dedication**: `streak_reached`
  - **Secret**: `class_change`, `honor_earned`
- Integrate progress evaluation into three event
  sources (see Event Model below)
- Support retroactive backfill (see Backfill Policy)

## Non-Goals

- **No unlock awarding**: this service updates progress
  counters only. Deciding whether an achievement is
  "unlocked" and setting `unlocked_at` belongs to the
  unlock evaluation engine (issue 136).
- **No notification emission**: notifications are owned
  by issue 137.
- **No badge UI or display changes**: owned by issue 138.
- **No new public API routes**: one internal route is
  added for the reward approval → progress bridge
  (required because reward approval runs client-side).
  Public API exposure comes in later issues.

## Event Model

Progress evaluation is triggered at three canonical
event sources in the existing codebase:

1. **Quest approval**
   (`lib/quest-instance/approve-quest.ts`): fires after
   a quest is approved. This is the single source of
   truth for quest completion, XP gain, gold earned,
   level-up, and streak updates. Covers criteria:
   `quest_complete`, `quest_volunteer`,
   `quest_difficulty`, `gold_earned`, `xp_earned`,
   `level_reached`, `streak_reached`.
2. **Reward redemption approval**
   (`useRewardStoreActions.ts` → internal route
   `app/api/achievement-progress/evaluate`): fires
   when a Guild Master approves a redemption. The
   client hook calls an internal server route because
   the reward flow is client-side and progress writes
   require service role. Not triggered at the initial
   gold deduction (which is PENDING and may be
   refunded). Covers criteria: `gold_spent`,
   `reward_redeemed`.
3. **Boss quest completion**
   (`lib/boss-quest-rewards.ts`): fires after boss
   battle rewards are distributed. Covers criteria:
   `boss_defeated`, `boss_participated`.

Deferred triggers (not in scope for issue 135):

- `class_change`: requires hooking into character
  class update flow (not currently a high-frequency
  path)
- `honor_earned`: honor system does not exist yet

Each event source calls
`AchievementProgressService.updateProgress()` with a
typed event payload containing the character ID, event
type, and relevant metadata.

## Idempotency

Progress updates use an **absolute-value model**, not
incremental deltas. Each evaluator queries the current
canonical state (e.g., total quests completed from
`quest_instances` where `status = 'APPROVED'`) and
writes the result as `{"current": N, "threshold": T}`
to `character_achievements.progress` JSONB. Replaying
the same event produces the same progress value —
there is no double-counting because the service reads
truth from the database, not from the event payload.

The upsert uses the existing unique constraint on
`(character_id, achievement_id)` — insert on first
encounter, update on subsequent evaluations.

## Backfill Policy

On first evaluation for a character, the service
queries existing database state to set accurate
initial progress. Criteria backfill support:

- **Deterministic** (reconstructable from current
  tables): `quest_complete`, `quest_volunteer`,
  `quest_difficulty`, `gold_earned`, `gold_spent`,
  `xp_earned`, `level_reached`, `streak_reached`,
  `reward_redeemed`, `boss_defeated`,
  `boss_participated`
- **Best-effort**: `class_change` (only if change
  history is recorded), `honor_earned` (deferred —
  honor system does not exist yet)

Backfill runs once per character on first
`updateProgress` call (detected by absence of any
`character_achievements` rows for that character).
Subsequent evaluations recompute only the criteria
affected by the triggering event.

## Testing

- **Unit tests**: one test suite per criteria type
  evaluator covering threshold math, edge cases
  (zero progress, exact threshold, above threshold),
  and JSONB shape
- **Idempotency tests**: verify that calling
  `updateProgress` twice with the same event produces
  identical progress state
- **Backfill tests**: verify that a character with
  existing quest/reward/level history gets correct
  initial progress values
- **Integration test**: end-to-end quest approval
  pipeline — approve a quest and verify that relevant
  `character_achievements` rows are created/updated
  with correct progress

## Capabilities

### New Capabilities

- `achievement-progress`: Core service for computing
  character progress against achievement criteria and
  persisting progress state to
  `character_achievements.progress` JSONB. Covers
  all 13 criteria type evaluators, absolute-value
  idempotency model, retroactive backfill, and
  integration with quest/reward/boss event sources.

### Modified Capabilities

- `achievement-schema`: Adding behavioral requirement
  that `character_achievements` rows are upserted by
  the progress service via service role, using the
  existing unique constraint on
  `(character_id, achievement_id)`. No DDL changes.

## Impact

- **Code — Service layer**: New
  `AchievementProgressService` class following
  existing `QuestInstanceService` / `RewardService`
  patterns
- **Code — Quest flow**:
  `lib/quest-instance/approve-quest.ts` gains a call
  to evaluate progress after quest approval
- **Code — Reward flow**: `useRewardStoreActions.ts`
  gains a call to the internal evaluation route after
  a GM approves a redemption. New internal route at
  `app/api/achievement-progress/evaluate/route.ts`
- **Code — Boss flow**: `lib/boss-quest-rewards.ts`
  gains a call to evaluate progress after boss
  completion
- **Database**: Writes to existing
  `character_achievements` table via service role
  (no schema changes)
- **Dependencies**: Depends on completed issue 134
  (achievement schema migration). Blocks issue 136
  (unlock evaluation engine) which consumes the
  progress data this service writes
