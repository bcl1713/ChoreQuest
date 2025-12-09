# Change: Add Boss Quests with time-limited participation and GM-controlled rewards

## Why
Guild Masters need a cooperative boss quest flow where families can rally within a timed window and get coordinated payouts once the boss is defeated.

## What Changes
- Allow GMs to create boss quests with a configurable join window (default 60 minutes) that gates new participants after expiry.
- Let GMs declare a boss defeated and grant the boss quest's gold/xp rewards to all participants, plus 1 honor point each.
- Track boss quest participants and their rewards so future honor-point uses have consistent history.

## Impact
- Affected specs: boss-quests
- Affected code: boss quest creation/participation UI, boss quest backend (storage + reward application), reward/honor bookkeeping, timers/countdowns for join window, GM completion flow.
