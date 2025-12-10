# boss-quests Specification

## Purpose
Describe how boss quests are created, joined, and completed with GM-controlled approvals, realtime updates, and reward distribution (including class bonuses).
## Requirements
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
participants receive nothing, and reward application SHALL recalculate and
persist each participant's character level based on total XP so the UI reflects
level-ups immediately after completion.

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

#### Scenario: Level recalculation after rewards
- **WHEN** boss quest rewards are applied to a participant's character
- **THEN** the system recalculates level from total XP (including multi-level
  jumps), persists the new level, and emits the updated level/progress so the
  XP bar is not left at 100% on an outdated level

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

### Requirement: Admin Dashboard Character Progress shows gems and honor
The admin overview Character Progress table SHALL display each character's gems and honor alongside XP and gold using the same formatting and styling used for existing currency columns.

#### Scenario: Currency totals displayed with existing styling
- **WHEN** a Guild Master opens the admin dashboard overview
- **THEN** each character row shows XP, gold, gems, and honor totals with the existing typography, color accents, and number formatting applied consistently to all currency columns

### Requirement: Admin Dashboard Boss Battle Summary
The admin overview SHALL include a boss battle summary section that surfaces boss quests defeated this week and this month plus the top participant based on weighted participation across completed boss quests.

#### Scenario: Boss battles counted by completion period
- **WHEN** a boss quest is marked defeated and rewards are applied
- **THEN** it increments the week or month boss battle count based on the completion/approval timestamp, and repeated submissions for the same boss quest do not double-count the period total

#### Scenario: Top participant uses weighted participation
- **WHEN** ranking boss quest participants for the current week or month
- **THEN** each approved participant contributes 1 participation, each partial credit contributes an average of the XP and gold payout fractions (actual awarded / full-approval payout for that participant) clamped between 0 and 1, denied/zero-payout entries contribute 0, and the participant with the highest total is shown as the top participant with their participation score; ties break by higher boss-quest XP earned in the period, then gold, then alphabetical display name

#### Scenario: Summary matches admin overview styling
- **WHEN** the boss battle summary renders
- **THEN** its cards and highlight states reuse the existing admin overview visual style (gradient cards, typography, spacing) so it visually aligns with the Family Statistics block

