# Achievement Badge Display

## Purpose

Defines the visual display of achievement badges on the character profile,
including the data API, badge component states, grid layout with category
filtering, detail modal, count summary, section integration, and mobile
responsiveness.

## Requirements

### Requirement: Achievement data API

The system SHALL expose a GET `/api/achievements` endpoint
that returns all achievements grouped by category with the
authenticated character's progress merged in. The response
SHALL include category metadata (name, icon, display_order),
achievement definitions, and character_achievements progress
records. Achievements without a character_achievements row
SHALL be returned with null progress and null unlocked_at.

#### Scenario: Authenticated user fetches achievements

- **WHEN** an authenticated user sends GET `/api/achievements`
- **THEN** the response contains all achievement categories
  with their achievements, each including the character's
  progress (current/threshold), unlock status (unlocked_at),
  and achievement metadata (name, description, icon,
  xp_reward, gold_reward, is_hidden)

#### Scenario: Unauthenticated request

- **WHEN** an unauthenticated request is sent to
  GET `/api/achievements`
- **THEN** the response is 401 Unauthorized

#### Scenario: Character has no progress records

- **WHEN** a character has no character_achievements rows
- **THEN** all achievements are returned with progress=null
  and unlocked_at=null

### Requirement: Achievement badge visual states

The AchievementBadge component SHALL render four distinct
visual states based on achievement and progress data.

#### Scenario: Unlocked achievement

- **WHEN** an achievement has a non-null unlocked_at value
- **THEN** the badge displays with gold styling, the
  achievement icon, name, and description are fully visible,
  and a gold glow effect is applied

#### Scenario: Locked achievement with progress

- **WHEN** an achievement has null unlocked_at and a progress
  record with current > 0
- **THEN** the badge displays in default styling with a
  progress bar showing current/threshold values, and the
  achievement name and description are visible

#### Scenario: Locked achievement without progress

- **WHEN** an achievement has null unlocked_at and either
  no progress record or current = 0
- **THEN** the badge displays in default dimmed styling
  with the achievement name and description visible but
  no progress bar

#### Scenario: Hidden achievement not yet unlocked

- **WHEN** an achievement has is_hidden=true and
  unlocked_at is null
- **THEN** the badge displays "???" as the name, an
  obscured description, and a lock icon instead of the
  achievement icon

#### Scenario: Hidden achievement already unlocked

- **WHEN** an achievement has is_hidden=true and
  unlocked_at is not null
- **THEN** the badge displays identically to a normal
  unlocked achievement with full name, description, and
  gold styling

### Requirement: Achievement grid with category filtering

The AchievementGrid component SHALL display all achievements
in a responsive grid layout organized by category tabs.

#### Scenario: Default view shows all achievements

- **WHEN** the achievement grid loads
- **THEN** an "All" tab is selected by default showing
  every achievement, and category tabs are displayed
  with each category's icon and achievement count

#### Scenario: Category tab filtering

- **WHEN** a user selects a category tab
- **THEN** only achievements in that category are displayed
  in the grid

#### Scenario: Responsive grid layout

- **WHEN** the achievement grid is rendered
- **THEN** it displays in a responsive grid with 1 column
  on mobile, 2 columns on medium screens, and 3 columns
  on large screens

#### Scenario: Category ordering

- **WHEN** categories are displayed as tabs
- **THEN** they are ordered by display_order from the
  achievement_categories table

### Requirement: Achievement detail modal

Clicking an achievement badge SHALL open a detail modal
with the full achievement information.

#### Scenario: View unlocked achievement details

- **WHEN** a user clicks an unlocked achievement badge
- **THEN** a modal opens showing the achievement icon,
  name, full description, XP reward, gold reward, and
  the date it was unlocked

#### Scenario: View locked achievement details

- **WHEN** a user clicks a locked (non-hidden) achievement
- **THEN** a modal opens showing the achievement icon,
  name, full description, XP reward, gold reward, and
  progress bar with current/threshold if progress exists

#### Scenario: View hidden locked achievement details

- **WHEN** a user clicks a hidden locked achievement
- **THEN** a modal opens showing "???" as the name, an
  obscured description text, and no reward information

#### Scenario: Close modal

- **WHEN** a user clicks outside the modal or presses
  the close button
- **THEN** the modal closes

### Requirement: Achievement count summary

The system SHALL display an achievement progress summary
above the achievement grid.

#### Scenario: Display unlock count

- **WHEN** the achievement section renders
- **THEN** a summary displays the count of unlocked
  achievements out of total non-hidden achievements
  (e.g., "12/30 Achievements Unlocked")

#### Scenario: Display overall progress bar

- **WHEN** the achievement section renders
- **THEN** a progress bar shows the overall unlock
  percentage based on unlocked count vs total count

#### Scenario: Hidden achievements excluded from count

- **WHEN** calculating the summary counts
- **THEN** hidden achievements that are still locked
  are excluded from the total count, but hidden
  achievements that are unlocked are included

### Requirement: Achievement section integration

The achievement display SHALL be accessible from the
character profile or dashboard.

#### Scenario: Achievements visible on profile

- **WHEN** a user navigates to their character
  profile/dashboard
- **THEN** an achievements section or tab is visible
  showing the achievement summary and grid

#### Scenario: Achievement data loads on mount

- **WHEN** the achievements section mounts
- **THEN** achievement data is fetched via the
  useAchievements hook and a loading state is shown
  until data arrives

#### Scenario: Error handling

- **WHEN** the achievement data fetch fails
- **THEN** an error message is displayed with an
  option to retry

### Requirement: Mobile-responsive badge display

The achievement badge display SHALL be fully functional
on mobile devices.

#### Scenario: Touch interaction on mobile

- **WHEN** a user taps an achievement badge on mobile
- **THEN** the detail modal opens the same as on desktop

#### Scenario: Grid adapts to screen size

- **WHEN** the achievement grid is viewed on a mobile
  device
- **THEN** badges display in a single-column layout
  with appropriately sized icons and text
