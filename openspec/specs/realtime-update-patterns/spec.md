# Realtime Update Patterns

## ADDED Requirements

### Requirement: In-place state merge on realtime events

All data hooks that subscribe to Supabase realtime events
SHALL merge the event payload directly into local state using
a functional state updater (`setState(prev => ...)`) rather
than triggering a network refetch.

#### Scenario: Character stats merge on UPDATE event

- **WHEN** a `character_updated` realtime event arrives with
  an UPDATE action and the record's `user_id` matches the
  current user
- **THEN** the character state SHALL be updated by spreading
  the event record over the previous state
  (`{ ...prev, ...event.record }`) without issuing any
  network request

#### Scenario: Quest instance merge on UPDATE event

- **WHEN** a `quest_updated` realtime event arrives with an
  UPDATE action
- **THEN** the matching quest in local state SHALL be updated
  by merging the event record in-place without refetching

#### Scenario: INSERT event adds to local collection

- **WHEN** a realtime event arrives with an INSERT action for
  a collection-based hook (quests, rewards, family members)
- **THEN** the new record SHALL be appended to the local
  collection state without refetching the entire collection

#### Scenario: DELETE event removes from local collection

- **WHEN** a realtime event arrives with a DELETE action
- **THEN** the matching record SHALL be removed from local
  state by filtering it out, without refetching

### Requirement: No refetch on realtime success path

Realtime event handlers SHALL NOT call fetch/reload functions
when processing a successfully received event. Refetching
SHALL be reserved exclusively for initial data loading and
error recovery scenarios.

#### Scenario: Realtime handler does not trigger fetch

- **WHEN** a realtime event is received and processed
  successfully via in-place merge
- **THEN** no network request SHALL be initiated as a result
  of that event

#### Scenario: Initial load uses fetch

- **WHEN** a data hook mounts for the first time
- **THEN** the hook SHALL perform an initial fetch to load
  the current state from the database

#### Scenario: Error recovery uses fetch

- **WHEN** a component detects inconsistent state or a user
  triggers a manual refresh
- **THEN** the hook MAY perform a full refetch to reconcile
  state

### Requirement: Functional state updater pattern

All realtime event handlers that update React state SHALL use
the functional updater form of `setState` to avoid stale
closure bugs.

#### Scenario: Concurrent events processed correctly

- **WHEN** two realtime events arrive in rapid succession for
  the same state (e.g., two character updates)
- **THEN** both events SHALL be applied sequentially using
  `setState(prev => ...)` so that neither overwrites the
  other's changes

#### Scenario: No stale closure on re-render

- **WHEN** a component re-renders while a realtime event is
  being processed
- **THEN** the state updater SHALL reference the latest state
  via the `prev` parameter, not a captured variable from the
  render closure

### Requirement: Event filtering by ownership

Realtime event handlers SHALL filter events by the relevant
ownership identifier (e.g., `user_id`, `family_id`) before
updating local state, to prevent applying changes meant for
other users or families.

#### Scenario: Character event filtered by user_id

- **WHEN** a character realtime event arrives with a
  `user_id` that does not match the current user
- **THEN** the event SHALL be ignored and no state update
  SHALL occur

#### Scenario: Family-scoped event accepted for family

- **WHEN** a quest realtime event arrives for a quest
  belonging to the current user's family
- **THEN** the event SHALL be processed and merged into
  local state

### Requirement: Single subscription per data domain

Each data domain (characters, quests, rewards, etc.) SHALL
have exactly one canonical subscription point that serves as
the source of truth. Duplicate subscriptions to the same
table from different hooks or contexts SHALL NOT exist.

#### Scenario: One character subscription app-wide

- **WHEN** the application is running with the dashboard
  and any other character-consuming component mounted
- **THEN** exactly one realtime listener SHALL be registered
  for character updates (via `CharacterContext`), not
  multiple independent listeners

#### Scenario: Hook consumers share context state

- **WHEN** multiple components call `useCharacter()`
- **THEN** all components SHALL receive state from the same
  `CharacterContext` provider, not from independent
  subscriptions
