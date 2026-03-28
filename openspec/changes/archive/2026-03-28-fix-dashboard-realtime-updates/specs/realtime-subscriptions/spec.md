# Realtime Subscriptions — Delta

## MODIFIED Requirements

### Requirement: Character Realtime Updates

The system SHALL display character-related data (XP, gold,
level, class, honor, gems) in real-time via `useRealtime()`
context subscription only when changes are confirmed in the
database (no optimistic updates). Character realtime events
SHALL be processed by merging the event payload in-place into
the existing character state, without triggering a network
refetch. The `CharacterContext` SHALL be the single canonical
subscription point for character realtime events.

#### Scenario: Character XP gain merges in-place on dashboard

- **WHEN** a user completes a quest and receives XP rewards
  confirmed in database, triggering a character UPDATE event
- **THEN** the `CharacterContext` SHALL merge the event
  record into the current character state using
  `setCharacter(prev => ({ ...prev, ...event.record }))`
  and the dashboard XP value and progress bar SHALL update
  within 100ms with visual feedback (glow/flash effect)

#### Scenario: Character gold changes merge in-place

- **WHEN** a user redeems a reward or receives gold confirmed
  in the database, triggering a character UPDATE event
- **THEN** the `CharacterContext` SHALL merge the event
  record in-place and the gold balance SHALL update within
  100ms with visual feedback across all open pages

#### Scenario: Level-up detected during in-place merge

- **WHEN** a character UPDATE event is merged in-place and
  the new XP value crosses a level threshold
- **THEN** the `CharacterContext` SHALL detect the level
  change by comparing the previous character level against
  the recalculated level from the merged XP, and SHALL
  trigger a level-up notification/modal within 100ms

#### Scenario: Rapid successive updates both applied

- **WHEN** two character UPDATE events arrive in rapid
  succession (e.g., quest approval followed by reward
  redemption)
- **THEN** both events SHALL be merged sequentially using
  functional state updates (`setState(prev => ...)`) so
  that neither update is lost or overwritten

#### Scenario: No duplicate character subscriptions

- **WHEN** the application has both `CharacterContext` and
  any other character-consuming components mounted
- **THEN** exactly one realtime listener SHALL be registered
  for the characters table via `CharacterContext`, and no
  separate `useCharacter` hook SHALL maintain its own
  independent subscription

#### Scenario: Fetch reserved for initial load only

- **WHEN** the `CharacterContext` mounts for the first time
- **THEN** it SHALL perform an initial fetch via
  `fetchCharacter()` to load the current character state
- **AND** subsequent realtime events SHALL NOT trigger
  additional fetches
