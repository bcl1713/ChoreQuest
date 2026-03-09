# Design: Refactor Dashboard Tabs

## Context

The app has two tab implementations:

1. **Dashboard** (`dashboard-layout.tsx` lines 173-202): Uses
   `Button` components in a pill-style toggle with
   `bg-dark-800 p-1 rounded-lg` container, switching between
   `gold` and `ghost` variants.
2. **ProfileSettings** (`ProfileSettings.tsx` lines 58-80):
   Uses native `<button>` elements with a bordered card
   container (`fantasy-card`), bottom-border active indicator,
   and icon + responsive text.

Both manage `activeTab` state via `useState` and render tab
content conditionally. The ProfileSettings pattern is the
target design.

## Goals / Non-Goals

**Goals:**

- Extract a reusable `TabBar` component matching the
  ProfileSettings visual style
- Replace both dashboard and ProfileSettings inline tab
  markup with the shared component
- Maintain all existing functionality: state management,
  responsive labels, icons, test IDs

**Non-Goals:**

- Changing tab content or behavior (quest/reward logic stays
  the same)
- Adding new tabs or changing tab order
- Animating tab transitions
- Modifying the `fantasy-card` wrapper — each page still
  controls its own card layout

## Decisions

### 1. Generic TabBar component with render-agnostic API

Create `components/ui/tab-bar.tsx` accepting a typed tab
config array and active/onChange props.

```typescript
interface TabItem<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  testId?: string;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}
```

**Why over alternatives:**

- **vs. Headless UI / Radix Tabs**: Adds a dependency for a
  simple two-tab bar. The app doesn't use a headless UI
  library yet, so introducing one for this alone is
  disproportionate.
- **vs. Keeping inline markup**: Duplicated tab styling in
  two places violates DRY and the SOLID composition principle
  from the frontend-architecture spec.

### 2. Styling matches ProfileSettings pattern

The component renders the bordered bottom-indicator style:

- `border-b border-gold-700/30 bg-dark-800/50` on the
  container
- `border-b-2 border-gold-500 text-gold-400 bg-dark-700/50`
  for active state
- `border-transparent text-gray-400 hover:text-gold-300`
  for inactive
- Icon always visible; full label hidden below `sm`
  breakpoint, `shortLabel` shown instead (falls back to
  first word of `label` if not provided)

### 3. Parent controls wrapper and content

The `TabBar` only renders the tab buttons row. The parent
page wraps it in whatever container it needs (e.g.
`fantasy-card` in ProfileSettings, or a standalone `div` on
the dashboard). This keeps the component focused on tab
selection only.

### 4. Dashboard removes pill-style container

The dashboard's `bg-dark-800 p-1 rounded-lg` wrapper and
`Button` usage are replaced entirely. The `setActiveTab` prop
and `activeTab` state in `dashboard-content.tsx` remain
unchanged.

## Risks / Trade-offs

- **Visual regression on dashboard** — The dashboard tabs
  will look different after this change. Mitigated by
  matching the proven ProfileSettings design exactly.
- **Test selector changes** — Tests using `data-testid`
  attributes will continue to work since `testId` is
  supported in the `TabItem` config. Tests relying on
  `Button` component internals may need updates.
- **Removing `Button` import from dashboard-layout** — The
  `Button` component may still be used elsewhere in the
  file; verify before removing the import.
