# Frontend Architecture Spec

## ADDED Requirements

### Requirement: SOLID-Aligned UI Composition

Frontend components and hooks SHALL follow SOLID
principles: each file has a single reason to change,
presentational pieces avoid side effects, extensions
use composition rather than modification, and
dependencies on data/side-effects are inverted behind
interfaces.

#### Scenario: Single responsibility enforced

- **WHEN** a UI component or hook is added or refactored
- **THEN** data fetching, mutations, and side effects
  are extracted to containers/services while the
  presentational component focuses on rendering and UI
  logic only

#### Scenario: Dependency inversion for side effects

- **WHEN** a component needs Supabase/realtime data or
  other side effects
- **THEN** it depends on an injected interface (via
  props, hooks, or context) rather than importing
  concrete clients directly, enabling mocking and
  substitution without code changes

#### Scenario: Extension via composition

- **WHEN** new behavior is needed for an existing
  component
- **THEN** the change is delivered by composing or
  configuring the component (or creating a derived
  wrapper) instead of modifying internal logic,
  preserving open/closed behavior

### Requirement: Feature-First Modules with Clear Boundaries

Feature modules SHALL be organized around
routes/features with explicit public entrypoints, using
container components for orchestration and presentational
components for rendering, and shared primitives SHALL
live under common UI libraries to avoid duplication.

#### Scenario: Container and presentational split

- **WHEN** building or refactoring a feature module
- **THEN** the module exposes container components that
  coordinate data via services/hooks and pass state into
  presentational components that handle layout/styling
  without side effects

#### Scenario: Shared primitives reused

- **WHEN** multiple features need the same UI pattern
  (e.g., buttons, cards, lists)
- **THEN** the pattern is implemented or extended in
  shared primitives (`components/ui` or equivalent) and
  reused rather than duplicating bespoke variants inside
  feature folders

#### Scenario: Controlled dependencies

- **WHEN** a feature module imports code
- **THEN** it only depends on its own module, shared
  primitives, and service interfaces/hooks defined for
  cross-cutting concerns, avoiding upward or cyclic
  dependencies between feature modules

### Requirement: TypeScript File Size Guardrails

TypeScript source files (including `.ts` and `.tsx`)
SHALL be limited to a maximum of 300 lines enforced by
linting, with documented exceptions only when approved.

#### Scenario: Lint gate for oversized files

- **WHEN** linting runs in CI or locally
- **THEN** any `.ts`/`.tsx` file exceeding 300 lines
  fails the lint check unless an explicitly documented
  and approved override is present

#### Scenario: Decomposition of large files

- **WHEN** a TS/TSX file approaches or exceeds 300
  lines during refactors
- **THEN** it is split into smaller
  components/hooks/services that respect single
  responsibility without changing user-facing behavior

#### Scenario: Legacy max-line waivers removed

- **WHEN** working through the `legacyMaxLineWaivers`
  ESLint override list
- **THEN** waivers are removed via refactors until only
  generated `.ts`/`.tsx` files (e.g., Supabase type
  outputs) remain above 300 lines with documented
  justification

#### Scenario: Baseline lint errors resolved

- **WHEN** the max-lines rule is introduced
- **THEN** pre-existing lint errors/warnings and rule
  exemptions (including `no-explicit-any`,
  `react-hooks/exhaustive-deps`, and `ban-ts-comment`
  cases) are remediated so the lint baseline returns to
  clean and suppressions are limited to narrowly
  justified ignores

### Requirement: Quest completion timestamp on approval cards

The `QuestMeta` component SHALL display a human-readable
completion timestamp when the quest status is `COMPLETED`
and `completed_at` is non-null. The timestamp SHALL use
relative formatting for recent completions and absolute
formatting for older ones.

#### Scenario: Recent completion shows relative time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is less than 24 hours ago
- **THEN** the metadata row displays
  "Completed X minutes ago" or "Completed X hours ago"

#### Scenario: Yesterday completion shows day and time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is between 24 and 48 hours ago
- **THEN** the metadata row displays
  "Completed yesterday at HH:MM AM/PM"

#### Scenario: Older completion shows date and time

- **WHEN** a quest has status `COMPLETED` and
  `completed_at` is more than 48 hours ago
- **THEN** the metadata row displays
  "Completed Mon DD at HH:MM AM/PM"
  (e.g., "Completed Mar 5 at 3:42 PM")

#### Scenario: No completed_at value

- **WHEN** a quest has status `COMPLETED` but
  `completed_at` is null
- **THEN** no completion timestamp is displayed

#### Scenario: Non-approval quest status

- **WHEN** a quest has any status other than `COMPLETED`
- **THEN** no completion timestamp is displayed

### Requirement: Completion time formatting utility

The system SHALL provide a `formatCompletedTime`
function in `lib/utils/formatting.ts` that accepts a
date string and returns a human-readable
relative/absolute time string.

#### Scenario: Null or invalid input

- **WHEN** `formatCompletedTime` is called with null,
  undefined, or an invalid date string
- **THEN** it SHALL return null

#### Scenario: Minutes ago

- **WHEN** the date is less than 60 minutes ago
- **THEN** it SHALL return "X minutes ago"
  (minimum "1 minute ago")

#### Scenario: Hours ago

- **WHEN** the date is between 1 and 23 hours ago
- **THEN** it SHALL return "X hours ago"

#### Scenario: Yesterday

- **WHEN** the date is between 24 and 47 hours ago
- **THEN** it SHALL return "yesterday at HH:MM AM/PM"

#### Scenario: Older dates

- **WHEN** the date is 48 or more hours ago
- **THEN** it SHALL return "Mon DD at HH:MM AM/PM"

### Requirement: FantasyButton inline icon and text layout

The `FantasyButton` component's children wrapper SHALL
render as an inline-flex container with vertical centering
so that icon elements and text within children always
appear on a single horizontal line regardless of button
size.

#### Scenario: Icon and text on same line

- **WHEN** a `FantasyButton` receives children containing
  an SVG icon element followed by text
- **THEN** the icon and text SHALL render side-by-side on
  a single horizontal line

#### Scenario: Large button size preserves layout

- **WHEN** a `FantasyButton` with `size="lg"` receives
  children containing an icon and text
- **THEN** the icon and text SHALL remain on the same
  horizontal line without wrapping

#### Scenario: Icon-only or text-only children unaffected

- **WHEN** a `FantasyButton` receives children containing
  only text or only an icon (no mixed content)
- **THEN** the rendering SHALL be visually unchanged from
  current behavior

#### Scenario: Icon prop still works independently

- **WHEN** a `FantasyButton` uses the `icon` prop instead
  of inline icon children
- **THEN** the icon SHALL render before the children text
  on the same horizontal line as before

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

### Requirement: Shared tab navigation primitive

When multiple pages use a tab-based navigation pattern,
the tab bar SHALL be implemented as a shared presentational
primitive in `components/ui/` rather than duplicated inline
across feature components. The shared component SHALL accept
configuration (tab items, active state, change handler) via
props and SHALL contain no side effects or data fetching.

#### Scenario: Tab pattern reuse across pages

- **WHEN** two or more pages render a tab-based navigation
  bar
- **THEN** both pages SHALL import and configure the same
  shared `TabBar` component from `components/ui/` rather
  than maintaining independent inline tab markup

#### Scenario: Presentational-only tab component

- **WHEN** the shared `TabBar` component renders
- **THEN** it SHALL depend only on its props for state and
  SHALL not import Supabase clients, fetch data, or trigger
  side effects
