## 1. Implementation
- [x] 1.1 Update boss quest completion to recalculate and persist level from total XP (supporting multi-level-ups) when rewards are applied.
- [x] 1.2 Ensure clients refresh with the updated level/progress after boss quest completion and guard XP bar display against stale level data if the backend lags.
- [x] 1.3 Add automated tests covering boss quest completion level-ups and XP bar progress calculation.
- [x] 1.4 Add a one-time backfill script/migration to recompute levels from current XP for existing characters; document run steps.
- [x] 1.5 Run `openspec validate update-boss-quest-leveling --strict` and keep this checklist accurate.
