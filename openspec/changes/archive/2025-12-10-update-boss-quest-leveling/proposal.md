# Change: Fix boss quest level progression

## Why
- Boss quest completion currently updates XP/gold/honor without recalculating or persisting character levels, leaving players stuck at level 1 with full XP bars even after large rewards (e.g., user test01 shows level 1 with 815 XP and a 50/50 bar).
- XP bar and level displays rely on stale level data, so progress clamps at 100% while XP keeps growing, confusing players and hiding earned progression.

## What Changes
- Recalculate and persist character level as part of boss quest reward distribution (including multi-level jumps) and ensure the UI refreshes with the updated level/progress immediately after completion.
- Add regression coverage so boss quest completion keeps level progression and XP bars in sync with server state.
- Backfill existing characters by recalculating level from stored XP to repair currently stuck profiles.

## Impact
- Affected specs: boss-quests
- Affected code: app/api/boss-quests/[id]/complete/route.ts, reward-calculator level helpers, character context/dashboard progress display, migration/backfill tooling
