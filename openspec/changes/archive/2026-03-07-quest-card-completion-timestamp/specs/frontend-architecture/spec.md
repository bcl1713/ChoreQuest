# Delta Spec: frontend-architecture

## ADDED Requirements

### Requirement: Quest completion timestamp on approval cards

The `QuestMeta` component SHALL display a human-readable
completion timestamp when the quest status is
`COMPLETED` and `completed_at` is non-null. The
timestamp SHALL use relative formatting for recent
completions and absolute formatting for older ones.

#### Scenario: Recent completion shows relative time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is less than 24 hours ago
- **THEN** the metadata row displays "Completed X minutes
  ago" or "Completed X hours ago"

#### Scenario: Yesterday completion shows day and time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is between 24 and 48 hours ago
- **THEN** the metadata row displays
  "Completed yesterday at HH:MM AM/PM"

#### Scenario: Older completion shows date and time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is more than 48 hours ago
- **THEN** the metadata row displays
  "Completed Mon DD at HH:MM AM/PM"
  (e.g., "Completed Mar 5 at 3:42 PM")

#### Scenario: No completed_at value

- **WHEN** a quest has status `COMPLETED` but
  `completed_at` is null
- **THEN** no completion timestamp is displayed

#### Scenario: Non-approval quest status

- **WHEN** a quest has any status other than
  `COMPLETED`
- **THEN** no completion timestamp is displayed

### Requirement: Completion time formatting utility

The system SHALL provide a `formatCompletedTime` function
in `lib/utils/formatting.ts` that accepts a date string
and returns a human-readable relative/absolute time string.

#### Scenario: Null or invalid input

- **WHEN** `formatCompletedTime` is called with null,
  undefined, or an invalid date string
- **THEN** it SHALL return null

#### Scenario: Minutes ago

- **WHEN** the date is less than 60 minutes ago
- **THEN** it SHALL return "X minutes ago"
  (minimum "1 minute ago")

#### Scenario: Hours ago

- **WHEN** the date is between 1 and 23 hours ago
- **THEN** it SHALL return "X hours ago"

#### Scenario: Yesterday

- **WHEN** the date is between 24 and 47 hours ago
- **THEN** it SHALL return "yesterday at HH:MM AM/PM"

#### Scenario: Older dates

- **WHEN** the date is 48 or more hours ago
- **THEN** it SHALL return "Mon DD at HH:MM AM/PM"
