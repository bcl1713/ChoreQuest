# Refactor Dashboard Tabs

## Why

The dashboard uses a pill-style `Button` toggle (dark background,
rounded container) for switching between Quests and Rewards, while
ProfileSettings uses a bordered card with bottom-indicator tabs.
This visual inconsistency makes the app feel unfinished. Unifying
the tab pattern also creates an opportunity to extract a reusable
tab component, reducing duplication.

## What Changes

- Replace the dashboard's `Button`-based tab toggle with the
  bordered bottom-indicator tab style used in ProfileSettings
- Extract a shared `TabBar` component that both the dashboard
  and ProfileSettings can consume
- Maintain existing responsive behavior: icon + full text on
  desktop, shorter/icon-only labels on mobile
- Preserve `data-testid` attributes and keyboard accessibility
  on tab buttons

## Capabilities

### New Capabilities

- `tab-bar`: A reusable tab bar component with bordered
  bottom-indicator active state, icon support, and responsive
  labels

### Modified Capabilities

- `frontend-architecture`: The new shared TabBar component
  follows the SOLID composition pattern — presentational only,
  state managed by parent via props

## Impact

- `components/dashboard/dashboard-layout.tsx` — tab markup
  replaced with shared TabBar
- `components/profile/ProfileSettings.tsx` — inline tab
  markup replaced with shared TabBar
- New shared component file
  (e.g. `components/ui/tab-bar.tsx`)
- Existing dashboard and profile tests may need selector
  updates if markup changes
