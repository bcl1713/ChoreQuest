# Delta Spec: Realtime Subscriptions

## MODIFIED Requirements

### Requirement: Reward Realtime Updates

Reward catalog and redemption changes SHALL update in real-time across the
family.

#### Scenario: New reward creation visible immediately in store

- **WHEN** a guild master creates a new reward
- **THEN** the new reward SHALL appear in the catalog within 100ms on all
  open sessions without refresh

#### Scenario: Reward redemption updates gold balance in real-time

- **WHEN** a user redeems a reward from the store
- **THEN** the user's gold balance SHALL decrease within 100ms on all open
  pages showing the balance

#### Scenario: Redemption history updates immediately

- **WHEN** a user redeems a reward
- **THEN** the new redemption SHALL appear in the history/approval queue
  within 100ms

#### Scenario: Reward deletion propagates to all viewers

- **WHEN** a guild master deletes a reward from the catalog
- **THEN** the reward SHALL be removed from all reward displays within 100ms

#### Scenario: Redemption status change propagates to all admin sessions

- **WHEN** any admin or GM approves, denies, or fulfills a redemption
- **THEN** all other open admin/GM sessions SHALL reflect the updated
  redemption status within 100ms without requiring a manual refresh

#### Scenario: In-place state merge on redemption realtime event

- **WHEN** a `reward_redemption_updated` realtime event arrives
- **THEN** the matching redemption record SHALL be updated in local state
  by merging the changed fields in-place, without a full re-fetch of all
  redemptions from the server
