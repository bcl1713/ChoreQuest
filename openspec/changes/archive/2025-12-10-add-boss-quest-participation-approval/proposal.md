# Change: Boss quest participation approval, partial credit, defaults, and realtime status

## Why

Boss quests need safeguards against non-participating joiners and clearer GM
control over payouts, plus a smoother creation flow with sensible defaults and
live status updates.

## What Changes

- Add a GM review step after boss defeat to approve, partially credit, or deny
  each participant before rewards are applied.
- Support partial credit for players who contributed but did not fully finish,
  and block rewards for denied participants.
- Move boss quest creation into a modal/tabbed flow with default rewards
  prefilled (50 gold, 100 XP).
- Provide realtime boss quest status updates (joiners/changes) so everyone sees
  live participation.
- Ensure boss quests appear in quest history and the admin activity feed with
  outcomes and GM decisions visible.

## Impact

- Affected specs: boss-quests
- Affected code: boss quest creation UI (create quest screen/modal), boss quest
  completion/reward logic, participation tracking, realtime subscription layer
  for boss quest status, reward bookkeeping
