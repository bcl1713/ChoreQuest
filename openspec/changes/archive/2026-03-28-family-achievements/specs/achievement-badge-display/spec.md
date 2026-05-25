# Achievement Badge Display — Family Achievements Delta

## ADDED Requirements

### Requirement: Family achievements dashboard section

The system SHALL display a dedicated "Family
Achievements" section on the dashboard, separate from
individual achievements. This section SHALL be visible
to all family members.

#### Scenario: Family section visible on dashboard

- **WHEN** a user navigates to the dashboard
- **THEN** a "Family Achievements" section SHALL be
  visible alongside the individual achievements section

#### Scenario: Family section data loads on mount

- **WHEN** the family achievements section mounts
- **THEN** family achievement data SHALL be fetched via
  a `useFamilyAchievements` hook and a loading state
  SHALL be shown until data arrives

#### Scenario: Error handling

- **WHEN** the family achievement data fetch fails
- **THEN** an error message SHALL be displayed with an
  option to retry

#### Scenario: No family

- **WHEN** a user without a family views the dashboard
- **THEN** the family achievements section SHALL not
  be rendered

### Requirement: Family achievement badge visual states

The `FamilyAchievementBadge` component SHALL render
visual states consistent with individual badges but
with a distinct family styling indicator.

#### Scenario: Unlocked family achievement

- **WHEN** a family achievement has a non-null
  `unlocked_at` value
- **THEN** the badge SHALL display with gold styling,
  the achievement icon, name, description, and a
  family indicator icon or label

#### Scenario: Locked family achievement with progress

- **WHEN** a family achievement has null `unlocked_at`
  and progress with `current > 0`
- **THEN** the badge SHALL display with a progress bar
  showing `current/threshold` values

#### Scenario: Locked family achievement without progress

- **WHEN** a family achievement has null `unlocked_at`
  and either no progress or `current = 0`
- **THEN** the badge SHALL display in dimmed styling

### Requirement: Family achievement grid

The `FamilyAchievementGrid` component SHALL display
family achievements in a responsive grid layout with
category filtering, consistent with the individual
achievement grid.

#### Scenario: Default view shows all family achievements

- **WHEN** the family achievement grid loads
- **THEN** an "All" tab SHALL be selected by default
  showing every family achievement

#### Scenario: Category tab filtering

- **WHEN** a user selects a category tab
- **THEN** only family achievements in that category
  SHALL be displayed

#### Scenario: Responsive grid layout

- **WHEN** the family achievement grid is rendered
- **THEN** it SHALL display in a responsive grid with
  1 column on mobile, 2 columns on medium screens,
  and 3 columns on large screens

### Requirement: Family achievement count summary

The system SHALL display a family achievement progress
summary above the family achievement grid.

#### Scenario: Display unlock count

- **WHEN** the family achievements section renders
- **THEN** a summary SHALL display the count of
  unlocked family achievements out of total (e.g.,
  "3/10 Family Achievements Unlocked")

#### Scenario: Display overall progress bar

- **WHEN** the family achievements section renders
- **THEN** a progress bar SHALL show the overall
  unlock percentage

### Requirement: Family achievement detail modal

Clicking a family achievement badge SHALL open a
detail modal with full achievement information.

#### Scenario: View unlocked family achievement details

- **WHEN** a user clicks an unlocked family
  achievement badge
- **THEN** a modal SHALL open showing the achievement
  icon, name, full description, and the date it was
  unlocked

#### Scenario: View locked family achievement details

- **WHEN** a user clicks a locked family achievement
- **THEN** a modal SHALL open showing the achievement
  icon, name, description, and progress bar with
  current/threshold if progress exists

### Requirement: Admin family achievement progress view

Guild Masters SHALL be able to view family achievement
progress in the admin panel.

#### Scenario: Admin panel shows family achievements

- **WHEN** a Guild Master navigates to the admin panel
- **THEN** a "Family Achievements" section SHALL
  display all family achievements with their current
  progress

#### Scenario: Progress details visible

- **WHEN** a Guild Master views a family achievement
  in the admin panel
- **THEN** the current progress value, threshold, and
  unlock status SHALL be visible
