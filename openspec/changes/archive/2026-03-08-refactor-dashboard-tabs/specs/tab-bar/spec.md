# Tab Bar Spec

## ADDED Requirements

### Requirement: Reusable TabBar component

The system SHALL provide a generic `TabBar` component at
`components/ui/tab-bar.tsx` that accepts a typed array of
tab items and renders a horizontal tab bar with bordered
bottom-indicator active state. The component SHALL be
presentational only — the parent controls active state
via props.

#### Scenario: Renders all provided tabs

- **WHEN** `TabBar` receives an array of tab items
- **THEN** it SHALL render one button per item in
  horizontal layout order

#### Scenario: Active tab indicated by bottom border

- **WHEN** a tab's `id` matches the `activeTab` prop
- **THEN** that tab SHALL display a gold bottom border,
  gold text color, and a subtle background highlight

#### Scenario: Inactive tab styling

- **WHEN** a tab's `id` does not match the `activeTab`
  prop
- **THEN** that tab SHALL display gray text with no
  bottom border and show a gold hover state

#### Scenario: Tab change callback

- **WHEN** a user clicks an inactive tab
- **THEN** the component SHALL call `onTabChange` with
  the clicked tab's `id`

### Requirement: Icon display on all viewports

Each tab item SHALL always display its icon. The icon
SHALL be rendered at a consistent size (18px) and SHALL
not be hidden at any breakpoint.

#### Scenario: Icon visible on mobile

- **WHEN** the viewport is below the `sm` breakpoint
- **THEN** each tab SHALL display its icon

#### Scenario: Icon visible on desktop

- **WHEN** the viewport is at or above the `sm`
  breakpoint
- **THEN** each tab SHALL display its icon alongside
  its label text

### Requirement: Responsive tab labels

Tab labels SHALL adapt to viewport size. On desktop
(`sm` and above) the full label is shown. On mobile
(below `sm`) a shorter label is displayed.

#### Scenario: Full label on desktop

- **WHEN** the viewport is at or above the `sm`
  breakpoint
- **THEN** each tab SHALL display its full `label` text

#### Scenario: Short label on mobile

- **WHEN** the viewport is below the `sm` breakpoint
  and a `shortLabel` is provided
- **THEN** the tab SHALL display `shortLabel` instead
  of the full label

#### Scenario: Fallback short label

- **WHEN** the viewport is below the `sm` breakpoint
  and no `shortLabel` is provided
- **THEN** the tab SHALL display the first word of
  `label`

### Requirement: Test ID support

Each tab button SHALL support an optional `testId`
property that is rendered as a `data-testid` attribute
for automated testing.

#### Scenario: Custom test ID rendered

- **WHEN** a tab item includes a `testId` value
- **THEN** the rendered button SHALL have a
  `data-testid` attribute matching that value

#### Scenario: No test ID when omitted

- **WHEN** a tab item does not include a `testId` value
- **THEN** the rendered button SHALL not have a
  `data-testid` attribute

### Requirement: Keyboard accessibility

Tab buttons SHALL be keyboard accessible using native
`<button>` elements so they receive focus via Tab key
and activate via Enter/Space without additional ARIA
configuration.

#### Scenario: Tab key navigation

- **WHEN** a user presses Tab to navigate
- **THEN** focus SHALL move through each tab button
  in order

#### Scenario: Enter/Space activation

- **WHEN** a focused tab button receives an Enter or
  Space keypress
- **THEN** the `onTabChange` callback SHALL fire with
  that tab's `id`
