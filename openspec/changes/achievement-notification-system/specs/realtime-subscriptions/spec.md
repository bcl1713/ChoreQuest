# Realtime Subscriptions — Achievement Delta

## MODIFIED Requirements

### Requirement: Realtime Context Subscription API

The `useRealtime()` hook SHALL provide subscription
callbacks for character, quest, reward, boss quest, and
**achievement unlock** updates. The realtime channel
SHALL remain connected across auth token refreshes and
SHALL only be destroyed and recreated when the user's
`family_id` changes. The channel lifecycle MUST NOT
depend on the `session` or `user` objects from the auth
context.

#### Scenario: Channel survives auth token refresh

- **WHEN** the Supabase auth client fires a
  `TOKEN_REFRESHED` event while a family realtime
  channel is active
- **THEN** the existing channel MUST remain connected
  and continue receiving `postgres_changes` events
  without interruption

#### Scenario: Channel reconnects on family change

- **WHEN** the user's `profile.family_id` changes
  (e.g., joining a different family)
- **THEN** the old channel MUST be removed via
  `supabase.removeChannel()` and a new channel MUST be
  created for the new family

#### Scenario: Channel removed on logout

- **WHEN** the user logs out and `profile` becomes null
- **THEN** the channel MUST be removed and listener
  registries MUST be cleared

#### Scenario: Components subscribe to character updates

- **WHEN** a component calls
  `const { onCharacterUpdate } = useRealtime()`
- **THEN** the callback fires with the realtime event
  data when the character table receives an UPDATE event

#### Scenario: Multiple components listen to same table updates

- **WHEN** two components subscribe to quest updates via
  `onQuestUpdate()`
- **THEN** both components receive the realtime event
  and can update independently

#### Scenario: Components subscribe to achievement unlock events

- **WHEN** a component calls
  `const { onAchievementUnlockUpdate } = useRealtime()`
- **THEN** the callback fires with the realtime event
  data when the `character_achievements` table receives
  an INSERT or UPDATE event

## ADDED Requirements

### Requirement: Achievement unlock realtime channel

The realtime system SHALL subscribe to the
`character_achievements` table and emit events through
an `achievementUnlock` listener registry, following the
existing one-channel-per-table pattern.

#### Scenario: Channel created for character_achievements

- **WHEN** the `RealtimeProvider` sets up channels for
  a family
- **THEN** a channel named
  `family_{familyId}_character_achievements` SHALL be
  created subscribing to all events on the
  `character_achievements` table

#### Scenario: No family_id filter on subscription

- **WHEN** the `character_achievements` channel is
  created
- **THEN** the subscription SHALL NOT include a
  `family_id` filter (the table has no `family_id`
  column), matching the pattern used by
  `reward_redemptions`

#### Scenario: Events emitted to achievement listener registry

- **WHEN** a postgres change event arrives on the
  `character_achievements` channel
- **THEN** the event SHALL be mapped to a
  `RealtimeEvent` with type
  `"achievement_unlock_updated"` and emitted to the
  `achievementUnlock` listener registry

### Requirement: Achievement unlock event type

The realtime type system SHALL include an event type
for achievement unlock table changes.

#### Scenario: RealtimeEventType includes achievement type

- **WHEN** the `RealtimeEventType` union is defined
- **THEN** it SHALL include
  `"achievement_unlock_updated"` as a valid member

#### Scenario: RealtimeContextType exposes callback

- **WHEN** the `RealtimeContextType` interface is
  defined
- **THEN** it SHALL include
  `onAchievementUnlockUpdate: (callback: Listener) => () => void`
