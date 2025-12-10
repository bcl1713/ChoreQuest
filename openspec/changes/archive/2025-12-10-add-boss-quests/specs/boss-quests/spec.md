## ADDED Requirements
### Requirement: Boss Quest Creation and Join Window
Guild Masters SHALL be able to create a boss quest with a limited join window that defaults to 60 minutes and prevents late joins after the countdown expires.

#### Scenario: Default join window is one hour
- **WHEN** a GM creates a boss quest without specifying a join window
- **THEN** the system sets the join window to 60 minutes and displays the countdown to the family

#### Scenario: Custom join window is enforced
- **WHEN** a GM sets a custom join window duration
- **THEN** the system enforces that duration for participation and shows the matching countdown

#### Scenario: Join window closure blocks new participants
- **WHEN** the join window expires
- **THEN** new participants cannot join and the UI/API indicate the boss quest join period is closed

### Requirement: Boss Quest Completion Rewards
When a GM declares a boss quest defeated, the system SHALL distribute the boss quest's GM-approved rewards (gold and XP) to all participants and grant each participant 1 honor point.

#### Scenario: Completion distributes configured rewards and honor
- **WHEN** a GM marks a boss quest as defeated
- **THEN** each participant receives the configured gold and XP rewards and gains 1 honor point for participating

#### Scenario: Completion is idempotent
- **WHEN** a GM attempts to mark the same boss quest defeated again
- **THEN** duplicate rewards and honor points are not applied a second time

#### Scenario: Reward distribution is recorded
- **WHEN** the completion rewards are applied
- **THEN** the system records reward events (gold, XP, honor) for each participant for audit/history
