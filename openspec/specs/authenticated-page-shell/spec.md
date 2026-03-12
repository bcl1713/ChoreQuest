# Authenticated Page Shell

## Requirements

### Consistent page structure

The `AuthenticatedPageShell` component SHALL render a
consistent page structure consisting of a gradient
background, a header with character/guild information,
and a content area for page-specific children.

#### Scenario: Shell renders background and content slot

- **WHEN** a page renders `AuthenticatedPageShell`
  with `children` content
- **THEN** the shell SHALL render the dark gradient
  background (`from-dark-900 via-dark-800 to-dark-900`)
- **AND** the shell SHALL render the header above the
  content
- **AND** the shell SHALL render `children` inside a
  `<main>` element below the header

#### Scenario: Shell displays default title

- **WHEN** no `title` prop is provided
- **THEN** the header SHALL display "ChoreQuest" as
  the title with the gold gradient text styling

#### Scenario: Shell displays custom title

- **WHEN** a `title` prop is provided (e.g.,
  "Admin Dashboard")
- **THEN** the header SHALL display the custom title
  instead of "ChoreQuest"

#### Scenario: Shell displays title icon

- **WHEN** a `titleIcon` prop is provided
- **THEN** the header SHALL render the icon inline
  before the title text

### Header displays guild information

The header SHALL display the current guild name and
code when a family is available.

#### Scenario: Family is present

- **WHEN** the `family` prop is non-null
- **THEN** the header SHALL display the guild name
  highlighted in gold and the guild code in parentheses

#### Scenario: Family is null

- **WHEN** the `family` prop is null
- **THEN** the header SHALL omit the guild info line

### Header displays character information

The header SHALL display the character's name, class,
level, and role using the shared display maps.

#### Scenario: Character with class

- **WHEN** the character has a `class` value
- **THEN** the header SHALL display the class icon and
  label from `classDisplayMap` with the character's
  level using `IconWithLabel`

#### Scenario: Character without class

- **WHEN** the character has no `class` value
- **THEN** the header SHALL display
  "Unknown Class" with the character's level

#### Scenario: Profile with role

- **WHEN** the `profile` has a `role` value
- **THEN** the header SHALL display the role icon and
  label from `roleDisplayMap` using `IconWithLabel`

### Header displays current time

The header SHALL manage its own clock state internally
and display the current date and time.

#### Scenario: Time is displayed

- **WHEN** the header renders
- **THEN** the header SHALL display the formatted date
  and time with a clock icon, updated every second
- **AND** the time element SHALL use
  `suppressHydrationWarning` to prevent SSR mismatches

### Header renders custom action buttons

The header SHALL accept an `actions` ReactNode slot
for page-specific action buttons instead of hardcoding
specific buttons.

#### Scenario: Dashboard page actions

- **WHEN** the dashboard page provides Admin, Create
  Quest, Profile, and Logout buttons via `actions`
- **THEN** the header SHALL render those buttons in the
  action area

#### Scenario: Profile page actions

- **WHEN** the profile page provides Back to Dashboard
  and Logout buttons via `actions`
- **THEN** the header SHALL render those buttons in the
  action area

#### Scenario: Admin page actions

- **WHEN** the admin page provides a Back to Dashboard
  button via `actions`
- **THEN** the header SHALL render that button in the
  action area

### Responsive layout

The header SHALL be responsive, stacking vertically on
mobile and displaying inline on desktop.

#### Scenario: Mobile viewport

- **WHEN** the viewport is below the `sm` breakpoint
- **THEN** the header content (title area, character
  info, action buttons) SHALL stack vertically

#### Scenario: Desktop viewport

- **WHEN** the viewport is at or above the `sm`
  breakpoint
- **THEN** the title area and character info SHALL
  display side-by-side with character info right-aligned
