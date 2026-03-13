# Quest Management Decomposition

## ADDED Requirements

### Requirement: useQuestManagementActions hook

The system SHALL provide a `useQuestManagementActions`
custom hook in `components/admin/useQuestManagementActions.ts`
that encapsulates all quest action handlers, confirmation
modal state, and processing state currently inline in
`quest-management-tab.tsx`.

The hook SHALL accept a configuration object with:

- `reload`: async function to refresh quest data
- `success`: notification success callback
- `error`: notification error callback

The hook SHALL return:

- `handleAssignQuest(questId, characterId)` — assigns a
  quest via `questInstanceApiService.assignFamilyQuest`
- `handleApproveQuest(questId)` — approves a quest
- `handleDenyQuest(questId)` — opens confirm modal for deny
- `handleCancelQuest(questId)` — opens confirm modal for
  cancel
- `handleReleaseQuest(questId)` — opens confirm modal for
  release
- `handleConfirmAction()` — executes the pending confirmed
  action
- `handleDismissModal()` — closes the modal without acting
- `confirmModal` — current modal state object
- `isProcessing` — boolean loading flag
- `selectedAssignee` — assignee selection state
- `handleAssigneeChange(questId, userId)` — updates
  assignee selection

#### Scenario: Assign quest through hook

- **WHEN** `handleAssignQuest` is called with a valid
  questId and characterId
- **THEN** the hook SHALL call
  `questInstanceApiService.assignFamilyQuest`, clear the
  selected assignee for that quest, show a success
  notification, and call `reload`

#### Scenario: Deny quest with confirmation

- **WHEN** `handleDenyQuest` is called with a questId
- **THEN** the hook SHALL set `confirmModal` to open with
  title "Send Quest Back to Pending?" and action "deny"
- **WHEN** `handleConfirmAction` is called while modal
  action is "deny"
- **THEN** the hook SHALL call
  `questInstanceApiService.denyQuest`, show success
  notification, close the modal, and call `reload`

#### Scenario: Action failure handling

- **WHEN** any quest action API call throws an error
- **THEN** the hook SHALL call the error notification
  callback with the error message and set `isProcessing`
  to false

### Requirement: QuestManagementSection component

The system SHALL provide a `QuestManagementSection`
presentational component in
`components/admin/quest-management-section.tsx` that renders
a single quest management section (e.g., "Unassigned" or
"In Progress").

The component SHALL accept props:

- `title` — section heading text
- `count` — number badge value
- `quests` — array of `QuestInstance` items
- `emptyMessage` — text shown when quests array is empty
- `familyMembers` — assignable character options
- `selectedAssignee` — current assignee selections
- `hideAssignment` — optional boolean to hide assignment UI
- Quest action callbacks: `onAssigneeChange`, `onAssign`,
  `onApprove`, `onDeny`, `onCancel`, `onRelease`
- `getAssignedHeroName` — function to resolve hero names

#### Scenario: Render section with quests

- **WHEN** the component receives a non-empty quests array
- **THEN** it SHALL render a section header with title and
  count badge, and a stagger-animated grid of `QuestCard`
  components

#### Scenario: Render empty section

- **WHEN** the component receives an empty quests array
- **THEN** it SHALL render the section header and a styled
  empty state container with the `emptyMessage` text

#### Scenario: Hide assignment controls

- **WHEN** `hideAssignment` is true
- **THEN** the component SHALL pass `hideAssignment={true}`
  to each rendered `QuestCard`

### Requirement: Reduced quest-management-tab orchestrator

The `QuestManagementTab` component SHALL compose
`useQuestManagementActions`, `QuestManagementSection`, and
the existing `PendingApprovalsSection` to render the quest
management interface.

The component SHALL NOT contain inline `useCallback`
handlers for quest actions, confirmation modal state
management, or section rendering logic.

The component SHALL remain under 150 lines.

#### Scenario: Compose from extracted pieces

- **WHEN** `QuestManagementTab` renders
- **THEN** it SHALL use `useQuestManagementActions` for all
  action handlers and modal state, render
  `PendingApprovalsSection` for pending approvals, and
  render `QuestManagementSection` for the "Unassigned"
  and "In Progress" sections

#### Scenario: Loading and error states preserved

- **WHEN** quests are loading or an error occurs
- **THEN** `QuestManagementTab` SHALL render the same
  loading spinner and error UI as the current
  implementation
