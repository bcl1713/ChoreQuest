# Frontend Architecture Delta: Icon-Text Button Alignment

## ADDED Requirements

### Requirement: Consistent mobile header button display

The dashboard header action buttons (Admin, Create Quest,
Profile, Logout) SHALL all display as icon-only on mobile
viewports (below `sm` breakpoint) and as icon-plus-text on
desktop viewports (`sm` and above). Each button SHALL use a
`startIcon` prop for its icon and wrap its text label in a
responsive visibility class.

#### Scenario: All buttons icon-only on mobile

- **WHEN** the dashboard header renders on a viewport below
  the `sm` breakpoint
- **THEN** all four action buttons (Admin, Create Quest,
  Profile, Logout) SHALL display only their icon with no
  visible text

#### Scenario: All buttons show icon and text on desktop

- **WHEN** the dashboard header renders on a viewport at or
  above the `sm` breakpoint
- **THEN** all four action buttons SHALL display their icon
  followed by their text label

#### Scenario: Logout button has an icon

- **WHEN** the Logout button renders
- **THEN** it SHALL include a `LogOut` icon via the
  `startIcon` prop, matching the pattern used by Admin,
  Create Quest, and Profile buttons

### Requirement: Centered icons on icon-only buttons

Header action buttons SHALL render their icon visually
centered when no text is visible. The flex gap between icon
and children wrapper SHALL NOT cause off-center alignment
on mobile viewports.

#### Scenario: Icon centered when text is hidden

- **WHEN** a header button renders with its text label
  hidden on mobile
- **THEN** the icon SHALL appear visually centered within
  the button, with no extra gap or empty space beside it

#### Scenario: Icon and text properly spaced on desktop

- **WHEN** a header button renders with visible text on
  desktop
- **THEN** the standard flex gap SHALL apply between the
  icon and text label

### Requirement: Accessible icon-only buttons

Each header action button SHALL include an `aria-label`
attribute so that screen readers can identify the button
purpose when its text label is visually hidden.

#### Scenario: Screen reader announces button purpose

- **WHEN** a screen reader encounters any header action
  button on a mobile viewport
- **THEN** the button SHALL announce its purpose via
  `aria-label` (e.g., "Admin", "Create Quest", "Profile",
  "Logout")

#### Scenario: aria-label matches visible desktop text

- **WHEN** a header action button is rendered on desktop
  with visible text
- **THEN** the `aria-label` value SHALL match the visible
  text content

### Requirement: Inline icon-text alignment on link buttons

Buttons implemented as `<Link>` elements using the
`fantasy-button` CSS class SHALL render their icon and text
on the same horizontal line. Conflicting CSS display
properties (`inline-block` with `flex`, or `block` with
`flex`) SHALL NOT be applied to the same element.

#### Scenario: Landing page hero buttons aligned

- **WHEN** the landing page renders the "Enter Your Realm",
  "Create Family Guild", or "Join Existing Guild" buttons
- **THEN** the icon and text SHALL appear side-by-side on a
  single horizontal line

#### Scenario: Migration notice button aligned

- **WHEN** the migration notice renders the "Create New
  Guild" button
- **THEN** the icon and text SHALL appear side-by-side on a
  single horizontal line

#### Scenario: No conflicting display classes

- **WHEN** a `fantasy-button` link element uses flex layout
  for icon+text alignment
- **THEN** the element SHALL NOT also have `inline-block` or
  `block` classes that conflict with the flex display
