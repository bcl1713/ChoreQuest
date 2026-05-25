# Achievement Unlock Evaluation Engine

## Why

The achievement progress tracking service (#135) computes
and persists how far a character is toward each achievement,
but nothing in the system actually _unlocks_ achievements
when criteria are met. Without an evaluation engine, progress
values accumulate silently — characters never receive their
badges, XP rewards, or gold rewards. This engine is the
missing link that turns tracked progress into tangible
unlocks, and it's a prerequisite for the notification system
(#137) and family achievements (#140) downstream in v0.8.0.

## What Changes

- Add an `AchievementEvaluator` that inspects progress
  against `criteria_config` thresholds after each progress
  update and determines unlock eligibility
- Support three evaluation strategies: **threshold**
  (current >= N), **boolean** (current is truthy), and
  **compound** (multiple conditions combined with AND/OR
  logic)
- On unlock: insert `unlocked_at` timestamp into
  `character_achievements` and award `xp_reward` /
  `gold_reward` defined on the achievement to the
  character's stats
- Guarantee idempotent evaluation — re-evaluating an
  already-unlocked achievement is a no-op (no duplicate
  rewards, no duplicate unlocks)
- Support retroactive evaluation — scan a character's
  existing progress to grant any achievements they already
  qualify for but haven't been awarded
- Integrate evaluation into the existing
  `AchievementProgressService.updateProgress()` flow so
  unlocks happen automatically after progress is written

## Capabilities

### New Capabilities

- `achievement-unlock-evaluation`: Core evaluation engine
  that compares progress against criteria thresholds,
  supports threshold/boolean/compound strategies, triggers
  unlocks, and grants XP/gold rewards. Covers idempotent
  unlock guarantees and retroactive evaluation.

### Modified Capabilities

- `achievement-progress`: The progress service's
  `updateProgress` method must invoke the evaluation engine
  after writing progress, so that unlocks are detected in
  the same call. This is a requirement-level change to the
  service's contract — callers currently expect
  progress-only behavior, and after this change, unlocks
  and reward grants will also occur.

## Impact

- **Code**: `lib/achievement-progress-service.ts` gains
  evaluation + unlock + reward-granting logic (or delegates
  to a new evaluator module). Character `xp` and `gold`
  columns are updated on unlock.
- **Database**: Writes to `character_achievements.unlocked_at`
  on unlock. Writes to `characters.xp` and `characters.gold`
  for rewards. No new tables or migrations required — the
  schema from #134 already supports this.
- **APIs**: No new API routes. Evaluation is triggered
  internally by the progress service, which is already
  integrated into quest approval, boss completion, and
  reward approval flows.
- **Dependencies**: Depends on #134 (schema, closed) and
  #135 (progress tracking, in progress). Downstream
  consumers: #137 (notifications subscribe to `unlocked_at`
  changes via Realtime), #140 (family achievements build on
  per-character unlock state).
- **Risks**: Reward granting must be atomic with the unlock
  write to prevent double-rewarding on retry. Compound
  evaluation strategy adds complexity — needs thorough test
  coverage for AND/OR combinations and edge cases.
