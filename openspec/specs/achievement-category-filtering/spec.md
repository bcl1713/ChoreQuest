# Achievement Category Filtering

## Purpose

Defines the client-side category filtering behavior on the achievement grid,
including completion count display per category tab, the "All" tab aggregate,
client-side filtering mechanics, and empty category handling.

## Requirements

### Requirement: Category tab completion counts

Each category tab on the achievement grid SHALL display a
completion count showing how many achievements the character
has unlocked out of the total in that category.

#### Scenario: Category with partial completion

- **WHEN** a character has unlocked 3 out of 8 achievements
  in the "Questing" category
- **THEN** the Questing tab displays "3/8" as a completion
  badge

#### Scenario: Category with full completion

- **WHEN** a character has unlocked all achievements in a
  category
- **THEN** the tab displays the full count (e.g., "8/8")
  with a visual indicator of completion

#### Scenario: Category with no progress

- **WHEN** a character has unlocked zero achievements in a
  category
- **THEN** the tab displays "0/N" where N is the total
  achievement count in that category

#### Scenario: Hidden achievements in count

- **WHEN** a category contains hidden achievements
- **THEN** locked hidden achievements are excluded from
  the total count, but unlocked hidden achievements are
  included in both unlocked and total counts

### Requirement: All tab completion count

The "All" tab SHALL display overall completion counts
across all categories.

#### Scenario: Overall completion displayed

- **WHEN** the "All" tab is active or visible
- **THEN** it displays the total unlocked count out of
  total non-hidden-locked achievements across all
  categories

### Requirement: Client-side category filtering

Category filtering SHALL operate client-side on the
already-fetched achievement data without additional API
requests.

#### Scenario: Switch between category tabs

- **WHEN** a user clicks a category tab
- **THEN** the grid immediately filters to show only
  achievements in that category without a loading state
  or network request

#### Scenario: Return to All tab

- **WHEN** a user clicks the "All" tab after viewing a
  specific category
- **THEN** all achievements are immediately displayed

### Requirement: Empty category display

The grid SHALL handle categories with no matching
achievements gracefully.

#### Scenario: Category with no achievements

- **WHEN** a user selects a category tab that has no
  achievements assigned
- **THEN** an empty state message is displayed within
  the grid area
