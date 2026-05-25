# Achievement Badge Display (Delta)

## MODIFIED Requirements

### Requirement: Achievement grid with category filtering

The AchievementGrid component SHALL display all achievements
in a responsive grid layout organized by category tabs. Each
category tab SHALL include a completion count badge showing
unlocked/total for that category.

#### Scenario: Default view shows all achievements

- **WHEN** the achievement grid loads
- **THEN** an "All" tab is selected by default showing
  every achievement, and category tabs are displayed
  with each category's icon, achievement count, and
  completion count badge

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

### Requirement: Achievement count summary

The system SHALL display an achievement progress summary
above the achievement grid. When a specific category is
selected, the summary SHALL reflect that category's
counts.

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

#### Scenario: Category-scoped summary

- **WHEN** a specific category tab is selected
- **THEN** the summary updates to show counts for only
  that category's achievements
