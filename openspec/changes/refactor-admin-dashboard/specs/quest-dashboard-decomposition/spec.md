# Quest Dashboard Decomposition

## ADDED Requirements

### Requirement: useQuestDashboardData hook

The system SHALL provide a `useQuestDashboardData` custom
hook in
`components/quests/quest-dashboard/useQuestDashboardData.ts`
that consolidates all data fetching, combined state, and
memoized filtering currently in `quest-dashboard/index.tsx`.

The hook SHALL accept:

- `userId` — current user ID (optional)

The hook SHALL return:

- `loading` — combined loading state from all data hooks
- `error` — first error from any data hook
- `loadData` — combined reload function via `Promise.all`
- `myActiveQuests` — user's active quest instances
- `myHistoricalQuests` — user's completed quest instances
- `claimableFamilyQuests` — family quests available to claim
- `pendingApprovalQuests` — quests awaiting GM approval
- `bossQuests` — active boss quests
- `bossHistoryQuests` — defeated boss quests
- `assignableCharacters` — family characters mapped for
  assignment display
- `familyMembers` — raw family member data
- `character` — current user's character
- `getAssignedHeroName(quest)` — memoized hero name
  resolver
- `isGuildMaster` — boolean role check
- `onLoadQuestsRef` handler — exposes reload to parent

#### Scenario: Combined loading state

- **WHEN** any of the underlying data hooks (family,
  character, quests, boss quests) is loading
- **THEN** the hook SHALL return `loading: true`

#### Scenario: Combined error state

- **WHEN** any underlying data hook returns an error
- **THEN** the hook SHALL return the first error string

#### Scenario: Memoized quest filtering

- **WHEN** quest instances change
- **THEN** the hook SHALL recompute filtered quest lists
  (active, historical, claimable, pending approval)
  using memoization

#### Scenario: Combined reload

- **WHEN** `loadData` is called
- **THEN** the hook SHALL reload all data hooks in
  parallel via `Promise.all`

### Requirement: MyQuestsSection component

The system SHALL provide a `MyQuestsSection` presentational
component in
`components/quests/quest-dashboard/my-quests-section.tsx`
that renders the user's active quests.

The component SHALL accept:

- `activeQuests` — array of active quest instances
- `historicalQuestCount` — number of completed quests
  (for hint text)
- `bossHistoryCount` — number of defeated bosses
  (for hint text)
- `onStartQuest` — callback for starting a quest
- `onCompleteQuest` — callback for completing a quest
- `onReleaseQuest` — callback for releasing a quest
- `familyMembers` — family member data for display
- `isHighlighted` — function to check realtime highlight

#### Scenario: Render active quests

- **WHEN** the component receives active quests
- **THEN** it SHALL render the "My Quests" heading and a
  `QuestList` with start, complete, and release action
  callbacks

#### Scenario: Show history hint

- **WHEN** `historicalQuestCount + bossHistoryCount > 0`
- **THEN** the component SHALL render a hint directing
  users to Quest History at the bottom of the page

#### Scenario: No active quests with history

- **WHEN** active quests is empty and history exists
- **THEN** the `QuestList` SHALL display an empty message
  with a hint about Quest History

### Requirement: FamilyQuestSection component

The system SHALL provide a `FamilyQuestSection`
presentational component in
`components/quests/quest-dashboard/family-quest-section.tsx`
that wraps the `FamilyQuestClaiming` component.

The component SHALL accept:

- `quests` — claimable family quest instances
- `character` — current user's character (nullable)
- `onClaimQuest` — claim callback

The component SHALL only render when `character` is
non-null and `quests` is non-empty.

#### Scenario: Render when claimable quests exist

- **WHEN** character is present and claimable quests
  array is non-empty
- **THEN** the component SHALL render `FamilyQuestClaiming`
  within a section element

#### Scenario: Hide when no character

- **WHEN** character is null
- **THEN** the component SHALL render nothing

### Requirement: QuestHistorySection component

The system SHALL provide a `QuestHistorySection` component
in
`components/quests/quest-dashboard/quest-history-section.tsx`
that manages the collapsible quest history display.

The component SHALL own its own `showQuestHistory` toggle
state internally.

The component SHALL accept:

- `historicalQuests` — completed quest instances
- `bossHistoryQuests` — defeated boss quest instances
- `familyMembers` — family member data for display

The component SHALL only render when total history count
is greater than zero.

#### Scenario: Toggle history visibility

- **WHEN** user clicks the show/hide history button
- **THEN** the component SHALL toggle visibility of the
  `QuestList` and `BossQuestHistoryList`

#### Scenario: Show count in toggle button

- **WHEN** history is hidden
- **THEN** the button SHALL display
  "Show History (N)" where N is total history count

#### Scenario: Hide when no history

- **WHEN** both `historicalQuests` and `bossHistoryQuests`
  are empty
- **THEN** the component SHALL render nothing

### Requirement: Reduced quest-dashboard orchestrator

The `QuestDashboard` component SHALL compose
`useQuestDashboardData`, `useQuestHandlers`,
realtime hooks, and the extracted section components to
render the quest dashboard.

The component SHALL NOT contain inline `useMemo` filtering,
combined loading/error state construction, or section
rendering logic.

The component SHALL remain under 150 lines.

#### Scenario: Compose from extracted pieces

- **WHEN** `QuestDashboard` renders
- **THEN** it SHALL use `useQuestDashboardData` for all
  data, `useQuestHandlers` for action callbacks, render
  `BossQuestPanel`, conditionally render
  `PendingApprovalsSection`, `MyQuestsSection`,
  `FamilyQuestSection`, and `QuestHistorySection`

#### Scenario: Realtime subscription in orchestrator

- **WHEN** a quest update event arrives via realtime
- **THEN** the orchestrator SHALL trigger highlight
  animation via `useRealtimeHighlight` and pass the
  `isHighlighted` check to `MyQuestsSection`

#### Scenario: Loading and error states preserved

- **WHEN** data is loading or an error occurs
- **THEN** `QuestDashboard` SHALL render the same loading
  spinner and error UI with retry button as the current
  implementation
