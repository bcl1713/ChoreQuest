# Proposal: Fix Button Icon + Text Layout

## Why

Buttons that contain both an icon and text (e.g., the
"Enter Realm" login button) render the icon and text on
separate lines instead of side-by-side. This is a visual
regression that makes key call-to-action buttons look
broken, especially at the `lg` size where the extra
padding makes the stacking more obvious.

## What Changes

- Fix the `FantasyButton` component so that icon + text
  children always render on a single line
- The root cause is the plain `<span>` wrapper around
  `children` (line 108 of `FantasyButton.tsx`) which
  doesn't enforce inline-flex layout, causing SVG icons
  to stack above text content
- All buttons that pass icons as children (rather than
  via the `icon` prop) are affected, including the auth
  form buttons in `AuthForm.tsx`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-architecture`: Button component layout
  requirements — FantasyButton must ensure icon + text
  children remain horizontally aligned regardless of size

## Impact

- **Components affected**: `FantasyButton.tsx`
  (primary fix), and all consumers passing icon + text
  as children
  - `components/auth/AuthForm.tsx` — login, register,
    and create-family submit buttons
  - Any other component using inline icon + text
    children in FantasyButton
- **No API changes**: The `FantasyButton` props
  interface stays the same
- **No breaking changes**: This is a CSS/layout fix only
