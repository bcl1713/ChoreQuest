# Realtime Subscriptions — Channel Stability Delta

## MODIFIED Requirements

### Requirement: Realtime Context Subscription API

The `useRealtime()` hook SHALL provide subscription callbacks for
character, quest, reward, and boss quest updates. The realtime
channel SHALL remain connected across auth token refreshes and
SHALL only be destroyed and recreated when the user's `family_id`
changes. The channel lifecycle MUST NOT depend on the `session` or
`user` objects from the auth context.

#### Scenario: Channel survives auth token refresh

- **WHEN** the Supabase auth client fires a `TOKEN_REFRESHED`
  event while a family realtime channel is active
- **THEN** the existing channel MUST remain connected and
  continue receiving `postgres_changes` events without
  interruption

#### Scenario: Channel reconnects on family change

- **WHEN** the user's `profile.family_id` changes (e.g., joining
  a different family)
- **THEN** the old channel MUST be removed via
  `supabase.removeChannel()` and a new channel MUST be created
  for the new family

#### Scenario: Channel removed on logout

- **WHEN** the user logs out and `profile` becomes null
- **THEN** the channel MUST be removed and listener registries
  MUST be cleared

#### Scenario: Components subscribe to character updates

- **WHEN** a component calls
  `const { onCharacterUpdate } = useRealtime()`
- **THEN** the callback fires with the realtime event data when
  the character table receives an UPDATE event

#### Scenario: Multiple components listen to same table updates

- **WHEN** two components subscribe to quest updates via
  `onQuestUpdate()`
- **THEN** both components receive the realtime event and can
  update independently

## ADDED Requirements

### Requirement: Stable listener registration

Data hooks (`useQuests`, `useRewards`, `useFamilyMembers`,
`useBossQuests`) MUST register their realtime listeners in a
`useEffect` whose dependency array does NOT include the
`onXxxUpdate` callback ref from `useRealtime()`. These callbacks
are stable (created with empty dependency arrays) and including
them adds no value while risking unnecessary re-subscriptions if
their stability guarantee ever changes.

#### Scenario: Listener persists across re-renders

- **WHEN** a component using `useQuests` re-renders due to
  unrelated state changes
- **THEN** the quest realtime listener MUST remain registered
  in the listener registry without being removed and re-added

#### Scenario: Listener re-registers on family change

- **WHEN** the user's `profile.family_id` changes
- **THEN** the old listener MUST be unregistered and a new
  listener MUST be registered for the new family context

### Requirement: Auth-context channel cleanup

The auth-context profile subscription channel MUST be cleaned up
using `supabase.removeChannel(channel)` instead of
`channel.unsubscribe()`. The effect that creates this channel
MUST NOT include `session` in its dependency array.

#### Scenario: Profile subscription survives token refresh

- **WHEN** the Supabase auth client fires a `TOKEN_REFRESHED`
  event while the profile subscription channel is active
- **THEN** the profile subscription channel MUST remain
  connected without being torn down and recreated

#### Scenario: No orphaned channels after repeated auth events

- **WHEN** multiple auth state changes fire in quick succession
  (e.g., `INITIAL_SESSION` followed by `SIGNED_IN`)
- **THEN** at most one profile subscription channel SHALL exist
  per user at any given time, with no orphaned channel objects in
  the Supabase client's internal channel list
