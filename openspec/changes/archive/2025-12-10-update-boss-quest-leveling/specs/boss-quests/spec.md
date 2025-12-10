## MODIFIED Requirements
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
