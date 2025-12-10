# Change: Admin dashboard boss battle summary and currencies

## Why
- Guild Masters want a quick view of boss battle engagement and who is carrying the team without leaving the admin overview.
- Character progress on the admin dashboard hides key currencies (gems and honor), making it hard to track progression and fairness across approvals.

## What Changes
- Add a boss battle summary block to the admin overview showing weekly/monthly defeated boss counts and the top participant using weighted participation (full = 1, partial = fractional based on awarded XP and gold).
- Extend the character progress table to display gems and honor alongside XP and gold, matching the existing overview styling.
- Update statistics calculations and data loading to provide the new boss metrics and currency totals.

## Impact
- Affected specs: boss-quests
- Affected code: components/admin/statistics-panel.tsx, lib/statistics-service.ts, admin overview styling/assets, boss quest reward/participation aggregates
