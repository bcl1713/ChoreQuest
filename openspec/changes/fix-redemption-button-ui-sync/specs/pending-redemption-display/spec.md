# Delta Spec: Pending Redemption Display

## ADDED Requirements

### Requirement: Action buttons show loading state during mutation

While a redemption status mutation is in-flight, both the pending redemption
list and the redemption history SHALL disable the action buttons for that
specific redemption card and display a visual loading indicator (spinner or
disabled style).

#### Scenario: Pending list button disabled while updating

- **WHEN** an admin clicks approve or deny on a pending redemption card
- **THEN** both buttons on that card SHALL be disabled and show a loading
  indicator until the mutation completes or fails

#### Scenario: History list button disabled while updating

- **WHEN** an admin clicks approve, deny, or fulfill on a card in the
  redemption history view
- **THEN** the clicked button (and sibling buttons on that card) SHALL be
  disabled and show a loading indicator until the mutation completes or fails

#### Scenario: Other cards remain interactive during mutation

- **WHEN** an admin is updating one redemption card
- **THEN** the buttons on all other redemption cards SHALL remain enabled

### Requirement: Action buttons produce immediate visual confirmation

After a successful mutation, the redemption card SHALL immediately reflect its
new status without requiring a manual page refresh.

#### Scenario: Approved redemption leaves pending list

- **WHEN** an admin approves a pending redemption
- **THEN** the card SHALL disappear from the Pending Redemptions section
  within 200ms of the server confirming the update

#### Scenario: Denied redemption leaves pending list

- **WHEN** an admin denies a pending redemption
- **THEN** the card SHALL disappear from the Pending Redemptions section
  within 200ms of the server confirming the update

#### Scenario: Fulfilled redemption updates in history

- **WHEN** a guild master marks an approved redemption as fulfilled
- **THEN** the card SHALL update its status badge to FULFILLED within 200ms
  of the server confirming the update

### Requirement: Realtime-driven card updates display flash animation

When a redemption card's status changes due to a realtime event (i.e. an
action taken by a different admin/GM session), the updated card SHALL
display a brief flash or glow animation consistent with the
`animate-realtime-glow` pattern used elsewhere in the dashboard.

#### Scenario: Flash on remote approval

- **WHEN** another admin session approves a redemption while the current
  admin is viewing the reward management page
- **THEN** the affected card SHALL display the `animate-realtime-glow`
  animation for 500–800ms as it transitions to its new state

#### Scenario: No flash on own action

- **WHEN** the current user's own mutation causes the card state to change
- **THEN** no flash animation SHALL be shown (the button loading state
  already provides sufficient feedback)
