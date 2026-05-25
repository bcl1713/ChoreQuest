# Achievement Notification Specification

## Purpose

Define the behavior of the achievement unlock notification system, which displays
toast notifications when a character unlocks an achievement, queues multiple
simultaneous unlocks, and persists notified state to prevent re-displaying on
page refresh or reconnection.

## Requirements

### Requirement: Achievement unlock toast display

The system SHALL display a toast notification when a
character unlocks an achievement. The toast MUST show the
achievement name, description, icon, and any XP/gold
rewards earned. The toast MUST auto-dismiss after 5
seconds and provide a manual dismiss button.

#### Scenario: Toast appears on achievement unlock

- **WHEN** a `character_achievements` row is updated
  with `unlocked_at` transitioning from null to non-null
  for the current character
- **THEN** an `AchievementUnlockToast` SHALL appear as a
  fixed overlay displaying the achievement name,
  description, icon, and XP/gold reward amounts

#### Scenario: Toast auto-dismisses after timeout

- **WHEN** an achievement unlock toast has been visible
  for 5 seconds without user interaction
- **THEN** the toast SHALL automatically dismiss with an
  exit animation

#### Scenario: Toast manually dismissed

- **WHEN** the user clicks the dismiss button on an
  achievement unlock toast
- **THEN** the toast SHALL immediately dismiss with an
  exit animation

#### Scenario: Toast renders with celebratory animation

- **WHEN** an achievement unlock toast appears
- **THEN** the toast SHALL render with a CSS entrance
  animation (slide-in and/or scale effect) to create a
  celebratory visual flourish

### Requirement: Achievement notification queue

The system SHALL queue multiple simultaneous achievement
unlocks and display them sequentially, one at a time.

#### Scenario: Multiple simultaneous unlocks queued

- **WHEN** two or more achievements unlock at the same
  time for the current character
- **THEN** the system SHALL display them one at a time
  in sequence, showing the next toast only after the
  previous one is dismissed or auto-dismissed

#### Scenario: Queue processes in order

- **WHEN** three achievements (A, B, C) are queued for
  notification
- **THEN** the system SHALL display A first, then B after
  A is dismissed, then C after B is dismissed

#### Scenario: New unlock during active toast

- **WHEN** a new achievement unlocks while a toast is
  currently being displayed
- **THEN** the new achievement SHALL be added to the end
  of the queue and displayed after all preceding toasts
  are dismissed

### Requirement: Achievement notified state management

The system SHALL mark achievements as `notified: true`
in the database after displaying their toast to prevent
re-showing on page refresh or reconnection.

#### Scenario: Notified flag set on display

- **WHEN** an achievement unlock toast is displayed to
  the user
- **THEN** the system SHALL immediately update
  `character_achievements.notified` to `true` via API
  route

#### Scenario: Already-notified achievements not re-shown

- **WHEN** a realtime event arrives for an achievement
  where `notified` is already `true`
- **THEN** the system SHALL NOT add it to the
  notification queue

#### Scenario: Notified update persists across refresh

- **WHEN** a user refreshes the page after an
  achievement toast was displayed
- **THEN** the achievement SHALL NOT appear in the
  notification queue because `notified` is `true` in
  the database

### Requirement: Catch-up notification on mount

The system SHALL query for unnotified unlocked
achievements on mount and queue them for display, so
achievements unlocked while the user was offline or on
another page are not missed.

#### Scenario: Unnotified achievements shown on mount

- **WHEN** the notification manager component mounts and
  the current character has achievements where
  `unlocked_at IS NOT NULL AND notified = false`
- **THEN** those achievements SHALL be added to the
  notification queue and displayed sequentially

#### Scenario: No duplicate between catch-up and realtime

- **WHEN** a catch-up query returns an achievement and
  a realtime event arrives for the same achievement
- **THEN** the system SHALL deduplicate by
  `achievement_id` and display the achievement only once

#### Scenario: No catch-up toasts for notified achievements

- **WHEN** the notification manager mounts and all
  unlocked achievements for the current character have
  `notified = true`
- **THEN** no toasts SHALL be displayed

### Requirement: Character-scoped notifications

The notification system SHALL only display achievement
toasts for the currently selected character, filtering
out events for other characters.

#### Scenario: Only current character events shown

- **WHEN** a `character_achievements` realtime event
  arrives for a character that is NOT the currently
  selected character
- **THEN** the system SHALL NOT add it to the
  notification queue

#### Scenario: Queue clears on character switch

- **WHEN** the user switches to a different character
  while achievement toasts are queued
- **THEN** the pending queue SHALL be cleared and
  catch-up query SHALL re-run for the new character

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

#### Scenario: Family toast auto-dismisses after timeout

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

#### Scenario: Catch-up suppressed when backfill reports failure

- **WHEN** `GET /api/family-achievements` returns HTTP 200
  but with `backfill_ok: false` in the response body
- **THEN** `fetchUnnotifiedFamilyAchievements` SHALL return
  an empty array and suppress catch-up notifications, to
  avoid false toasts from stale `unlocked_at` rows that
  a failed backfill could not verify or correct

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

#### Scenario: Family notified flag set on display

- **WHEN** a family achievement unlock toast is
  displayed to a user
- **THEN** the system SHALL update
  `family_achievement_progress.notified` to `true`
  via API route

#### Scenario: Already-notified family achievement not re-shown

- **WHEN** a realtime event arrives for a family
  achievement where `notified` is already `true`
- **THEN** the system SHALL NOT add it to the queue

### Requirement: Family notified update API route

The system SHALL provide an API route for updating the
`notified` flag on `family_achievement_progress` rows.

#### Scenario: PATCH updates family notified flag

- **WHEN** a `PATCH` request is sent to
  `/api/family-achievement-progress/[id]/notified`
- **THEN** the API SHALL update the row and return 200

#### Scenario: Family notified unauthorized request rejected

- **WHEN** an unauthenticated request is sent
- **THEN** the API SHALL return 401

### Requirement: Notified update API route

The system SHALL provide an API route for updating the
`notified` flag on `character_achievements` rows, since
RLS restricts direct client writes to service-role only.

#### Scenario: PATCH updates notified flag

- **WHEN** a `PATCH` request is sent to
  `/api/character-achievements/[id]/notified`
- **THEN** the API SHALL update the
  `character_achievements` row and return 200

#### Scenario: Unauthorized request rejected

- **WHEN** an unauthenticated request is sent to the
  notified API route
- **THEN** the API SHALL return 401

#### Scenario: Non-existent record returns 404

- **WHEN** a `PATCH` request targets a
  `character_achievements` ID that does not exist
- **THEN** the API SHALL return 404
