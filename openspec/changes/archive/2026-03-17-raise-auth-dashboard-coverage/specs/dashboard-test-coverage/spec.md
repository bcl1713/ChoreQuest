# Dashboard Test Coverage Spec

## ADDED Requirements

### Requirement: AdminDashboard renders all tabs

The test suite SHALL verify that the AdminDashboard
component renders all six tabs with correct labels
and icons.

#### Scenario: All tabs visible

- **WHEN** AdminDashboard renders
- **THEN** it SHALL display tabs for Overview,
  Quest Management, Quest Templates, Rewards,
  Guild Masters, and Family Settings

#### Scenario: Default tab selected

- **WHEN** AdminDashboard renders without URL tab param
- **THEN** the first tab (Overview) SHALL be selected
- **AND** the Overview panel content SHALL be visible

### Requirement: AdminDashboard tab switching works

The test suite SHALL verify tab selection behavior.

#### Scenario: Clicking a tab switches content

- **WHEN** user clicks the "Rewards" tab
- **THEN** the Rewards panel SHALL become visible
- **AND** the selected tab SHALL have the active style

#### Scenario: Tab panels preserve state

- **WHEN** user switches from one tab to another and back
- **THEN** the original tab panel content SHALL be
  preserved (unmount=false behavior)

### Requirement: useQuestTemplates loads data correctly

The test suite SHALL verify the hook's data loading
behavior.

#### Scenario: Loads templates when enabled with familyId

- **WHEN** useQuestTemplates is called with
  enabled=true and a valid familyId
- **THEN** it SHALL query quest_templates filtered by
  family_id and is_active=true
- **AND** it SHALL return the loaded templates

#### Scenario: Skips loading when disabled

- **WHEN** useQuestTemplates is called with enabled=false
- **THEN** it SHALL NOT make any database queries
- **AND** it SHALL return an empty array

#### Scenario: Skips loading when familyId is null

- **WHEN** useQuestTemplates is called with
  enabled=true but familyId=null
- **THEN** it SHALL NOT make any database queries

#### Scenario: Handles database error gracefully

- **WHEN** the quest_templates query returns an error
- **THEN** the hook SHALL log the error
- **AND** it SHALL NOT throw

### Requirement: useQuestTemplates handles realtime updates

The test suite SHALL verify realtime subscription
behavior for quest template changes.

#### Scenario: INSERT adds active template

- **WHEN** a realtime INSERT event fires with an
  active template
- **THEN** the template SHALL be added to the list

#### Scenario: INSERT ignores inactive template

- **WHEN** a realtime INSERT event fires with
  is_active=false
- **THEN** the template SHALL NOT be added to the list

#### Scenario: UPDATE merges changes

- **WHEN** a realtime UPDATE event fires for an
  existing template
- **THEN** the template SHALL be updated in place

#### Scenario: UPDATE removes deactivated template

- **WHEN** a realtime UPDATE event sets
  is_active=false on an existing template
- **THEN** the template SHALL be removed from the list

#### Scenario: DELETE removes template

- **WHEN** a realtime DELETE event fires
- **THEN** the template SHALL be removed by id

### Requirement: AuthErrorHandler detects URL errors

The test suite SHALL verify the error handler component.

#### Scenario: Unauthorized error triggers callback

- **WHEN** URL contains error=unauthorized query param
- **THEN** onAuthError SHALL be called with the
  Guild Master access message

#### Scenario: Error clears after timeout

- **WHEN** an unauthorized error is detected
- **THEN** onAuthError(null) SHALL be called after
  5 seconds

#### Scenario: No error param is ignored

- **WHEN** URL has no error query parameter
- **THEN** onAuthError SHALL NOT be called
