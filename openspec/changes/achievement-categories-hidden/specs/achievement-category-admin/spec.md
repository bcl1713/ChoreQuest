# Achievement Category Admin

## ADDED Requirements

### Requirement: Admin category list view

The admin panel SHALL display a tab showing all achievement
categories in a table ordered by display_order, with columns
for name, description, icon, achievement count, and actions
(edit, delete).

#### Scenario: View categories list

- **WHEN** an admin navigates to the Achievement Categories
  tab in the admin panel
- **THEN** all categories are displayed in a table sorted
  by display_order, showing name, description, icon, and
  the count of achievements in each category

#### Scenario: Empty categories state

- **WHEN** no achievement categories exist
- **THEN** the tab displays an empty state message with a
  prompt to create the first category

### Requirement: Admin category create

The admin panel SHALL provide a form to create new
achievement categories with name, description, icon, and
display_order fields.

#### Scenario: Create a new category

- **WHEN** an admin fills in the category form with a name,
  description, icon, and display_order and submits
- **THEN** a new category is created via POST to
  `/api/admin/achievement-categories` and the list refreshes
  to include the new category

#### Scenario: Validation on required fields

- **WHEN** an admin submits the category form without a name
- **THEN** a validation error is displayed and the form is
  not submitted

### Requirement: Admin category edit

The admin panel SHALL allow editing existing achievement
categories inline or via a form.

#### Scenario: Edit an existing category

- **WHEN** an admin clicks edit on a category, modifies
  fields, and saves
- **THEN** the category is updated via PATCH to
  `/api/admin/achievement-categories/[id]` and the list
  refreshes with the updated values

### Requirement: Admin category reorder

The admin panel SHALL allow reordering categories by
updating their display_order values.

#### Scenario: Reorder categories

- **WHEN** an admin changes the display_order of a category
  and saves
- **THEN** the category's display_order is updated and the
  list re-sorts to reflect the new ordering

### Requirement: Admin category delete

The admin panel SHALL allow deleting categories that have
no achievements assigned.

#### Scenario: Delete an empty category

- **WHEN** an admin clicks delete on a category with zero
  achievements
- **THEN** the category is deleted via DELETE to
  `/api/admin/achievement-categories/[id]` and removed
  from the list

#### Scenario: Prevent deletion of category with achievements

- **WHEN** an admin clicks delete on a category that has
  achievements assigned
- **THEN** an error message is displayed explaining the
  category cannot be deleted while it has achievements

### Requirement: Admin achievement list view

The admin panel SHALL display a tab showing all achievements
in a table with columns for name, category, hidden status,
rewards, and actions.

#### Scenario: View achievements list

- **WHEN** an admin navigates to the Achievements tab in
  the admin panel
- **THEN** all achievements are displayed in a table showing
  name, category name, is_hidden flag, xp_reward,
  gold_reward, and action buttons (edit)

#### Scenario: Filter achievements by category

- **WHEN** an admin selects a category filter on the
  achievements tab
- **THEN** only achievements in that category are shown

### Requirement: Admin achievement create

The admin panel SHALL provide a form to create new
achievements with all required fields including category
assignment and hidden flag.

#### Scenario: Create a new achievement

- **WHEN** an admin fills in the achievement form with name,
  description, category, icon, xp_reward, gold_reward,
  is_hidden, criteria_type, criteria_config and submits
- **THEN** a new achievement is created via POST to
  `/api/admin/achievements` and the list refreshes

#### Scenario: Category selection dropdown

- **WHEN** an admin opens the achievement creation form
- **THEN** a dropdown lists all available categories for
  assignment ordered by display_order

### Requirement: Admin achievement edit

The admin panel SHALL allow editing existing achievements.

#### Scenario: Edit an existing achievement

- **WHEN** an admin clicks edit on an achievement, modifies
  fields (including category and hidden flag), and saves
- **THEN** the achievement is updated via PATCH to
  `/api/admin/achievements/[id]` and the list refreshes

#### Scenario: Toggle hidden flag

- **WHEN** an admin toggles the is_hidden checkbox on an
  achievement and saves
- **THEN** the achievement's is_hidden value is updated in
  the database

### Requirement: Admin API authentication

All admin achievement API routes SHALL require Guild Master
role authentication.

#### Scenario: Authenticated Guild Master request

- **WHEN** a Guild Master sends a request to any
  `/api/admin/achievement-categories` or
  `/api/admin/achievements` endpoint
- **THEN** the request is processed successfully

#### Scenario: Non-admin request rejected

- **WHEN** a non-Guild-Master user sends a request to any
  admin achievement endpoint
- **THEN** the response is 403 Forbidden

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated request is sent to any admin
  achievement endpoint
- **THEN** the response is 401 Unauthorized
