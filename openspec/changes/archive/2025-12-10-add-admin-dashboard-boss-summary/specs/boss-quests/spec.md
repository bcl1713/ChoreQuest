## ADDED Requirements
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
