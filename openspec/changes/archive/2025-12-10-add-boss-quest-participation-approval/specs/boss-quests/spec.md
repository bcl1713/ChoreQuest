## ADDED Requirements

### Requirement: Boss Quest Creation Modal with Defaults

Guild Masters SHALL create boss quests through a modal launched from the create
quest screen (e.g., a boss quest tab) with default rewards prefilled to 50 gold
and 100 XP that can be adjusted before saving.

#### Scenario: Creation launched from modal on create quest screen

- **WHEN** a GM chooses to create a boss quest
- **THEN** the flow opens a modal from the create quest screen (not the main
  dashboard list) with boss quest-specific inputs available

#### Scenario: Default rewards are prefilled

- **WHEN** the boss quest creation modal opens
- **THEN** the gold reward defaults to 50 and the XP reward defaults to 100
  while allowing the GM to edit both values

### Requirement: Boss Quest Status Realtime Subscription

The system SHALL stream boss quest status updates in realtime so participant
joins and GM decisions are reflected live to connected clients without manual
refresh.

#### Scenario: Participant joins update in realtime

- **WHEN** a member joins a boss quest
- **THEN** other connected clients viewing the boss quest see the participant
  list/status update in realtime

#### Scenario: GM decisions propagate live

- **WHEN** a GM approves, partially credits, or denies a participant
- **THEN** connected clients viewing the boss quest see the updated
  participation/approval status in realtime

### Requirement: Boss Quest History and Activity Visibility

Boss quests SHALL appear in quest history and the admin activity feed with
defeat outcomes and GM approval decisions visible.

#### Scenario: Boss quest recorded in quest history

- **WHEN** a boss quest is defeated
- **THEN** the quest history shows the boss quest entry with its outcome,
  rewards applied, and per-participant approval/partial/denial decisions

#### Scenario: Admin activity feed includes boss quest events

- **WHEN** a boss quest is created or defeated
- **THEN** the admin activity feed records the event with key details such as
  participants, GM decisions, and reward totals

### Requirement: Boss Quest Completion Rewards and Class Bonuses

When a GM declares a boss quest defeated, the system SHALL require
per-participant review so the GM can approve, partially credit, or deny each
participant before applying rewards; approved participants receive configured
rewards with their character class bonuses applied to gold, XP, and honor, while
partial credit uses GM-provided amounts without class bonuses and denied
participants receive nothing.

#### Scenario: GM approval gates payouts

- **WHEN** a GM marks a boss quest as defeated and reviews participants
- **THEN** only approved or partially credited participants receive rewards,
  denied participants receive none, and each participant defaults to approval if
  no explicit decision is supplied

#### Scenario: Approved participants get class bonuses

- **WHEN** a participant is approved
- **THEN** their gold, XP, and honor rewards are multiplied by their class
  bonuses before being granted

#### Scenario: Partial credit uses GM amounts without bonuses

- **WHEN** a GM assigns partial credit with custom gold/XP/honor values
- **THEN** those values are granted without applying class multipliers and honor
  may be reduced to zero if the GM sets it so

#### Scenario: Completion is idempotent

- **WHEN** a GM attempts to run completion/approval for the same boss quest
  again
- **THEN** duplicate rewards or honor points are not applied a second time and
  prior approvals/denials are preserved

#### Scenario: Reward distribution is recorded

- **WHEN** the approval decisions trigger reward distribution
- **THEN** the system records the gold, XP, honor outcomes, and approval
  decision per participant for audit/history
