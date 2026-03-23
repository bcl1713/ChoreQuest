# Achievement Notification — Family Achievements Delta

## ADDED Requirements

### Requirement: Family achievement unlock notification

The system SHALL display a toast notification when a
family achievement is unlocked. The toast SHALL show
the family achievement name, description, icon, and
a visual indicator that this is a family achievement
(e.g., "Family Achievement!" label). The toast SHALL
auto-dismiss after 5 seconds and provide a manual
dismiss button.

#### Scenario: Toast appears on family unlock

- **WHEN** a `family_achievement_progress` row is
  updated with `unlocked_at` transitioning from null
  to non-null for the current user's family
- **THEN** an `AchievementUnlockToast` SHALL appear
  displaying the family achievement details with a
  "Family Achievement!" label

#### Scenario: Toast auto-dismisses after timeout

- **WHEN** a family achievement unlock toast has been
  visible for 5 seconds
- **THEN** the toast SHALL automatically dismiss

### Requirement: Family notification broadcast

Family achievement unlock notifications SHALL be
visible to ALL online family members simultaneously,
not just the member whose action triggered the unlock.

#### Scenario: All online members see notification

- **WHEN** a family achievement unlocks due to member
  A's action
- **THEN** members A, B, and C (if online) SHALL all
  see the family achievement toast

#### Scenario: Offline members see catch-up

- **WHEN** a family member was offline when a family
  achievement unlocked and later comes online
- **THEN** the catch-up query SHALL include unnotified
  family achievement unlocks

### Requirement: Family notification realtime subscription

The notification system SHALL subscribe to
`family_achievement_progress` UPDATE events filtered
by the current user's `family_id` to detect family
achievement unlocks in realtime.

#### Scenario: Subscription filters by family

- **WHEN** the notification manager mounts
- **THEN** it SHALL subscribe to
  `family_achievement_progress` changes filtered to
  the current user's `family_id`

#### Scenario: Non-family events are ignored

- **WHEN** a realtime event arrives for a different
  family's achievement progress
- **THEN** the system SHALL NOT add it to the
  notification queue

### Requirement: Family notification queue integration

Family achievement notifications SHALL share the same
notification queue as individual achievement
notifications, processing sequentially.

#### Scenario: Mixed queue ordering

- **WHEN** an individual achievement and a family
  achievement unlock at the same time
- **THEN** both SHALL be added to the same queue and
  displayed sequentially

#### Scenario: Deduplication by achievement ID

- **WHEN** a family achievement unlock notification
  arrives via both catch-up and realtime
- **THEN** the system SHALL deduplicate by
  `family_achievement_id` and display only once

### Requirement: Family notified state management

The system SHALL mark family achievement progress as
`notified: true` after displaying the toast, per-user,
to prevent re-showing on page refresh.

#### Scenario: Notified flag set on display

- **WHEN** a family achievement unlock toast is
  displayed to a user
- **THEN** the system SHALL update
  `family_achievement_progress.notified` to `true`
  via API route

#### Scenario: Already-notified not re-shown

- **WHEN** a realtime event arrives for a family
  achievement where `notified` is already `true`
- **THEN** the system SHALL NOT add it to the queue

### Requirement: Family notified update API route

The system SHALL provide an API route for updating the
`notified` flag on `family_achievement_progress` rows.

#### Scenario: PATCH updates notified flag

- **WHEN** a `PATCH` request is sent to
  `/api/family-achievement-progress/[id]/notified`
- **THEN** the API SHALL update the row and return 200

#### Scenario: Unauthorized request rejected

- **WHEN** an unauthenticated request is sent
- **THEN** the API SHALL return 401
