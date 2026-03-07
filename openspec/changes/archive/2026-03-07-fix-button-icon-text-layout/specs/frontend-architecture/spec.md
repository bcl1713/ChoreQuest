# Delta: Frontend Architecture

## ADDED Requirements

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
