# Proposal: Add Redemption Request Timestamp to Pending Cards

## Why

Pending redemption cards in the admin Reward Management view show no
timestamp, leaving parents without context for when a request was made.
The `requested_at` field already exists in the database and is displayed
in the approved/history sections — it simply needs to be surfaced on the
pending cards too.

## What Changes

- Display `requested_at` timestamp on each pending redemption card in
  the admin Reward Management view
- Format matches the existing approved/history display (`toLocaleString()`
  for full date+time)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `pending-redemption-display`: Pending redemption cards must show the
  `requested_at` timestamp

## Impact

- `components/rewards/reward-manager/redemption-list.tsx` — the pending
  redemptions section needs a timestamp line added to each card
- No API, database, or type changes required — `requested_at` is already
  returned in `RewardRedemptionWithUser`
