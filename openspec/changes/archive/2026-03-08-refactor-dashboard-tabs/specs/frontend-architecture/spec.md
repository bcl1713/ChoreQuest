# Frontend Architecture Spec (Delta)

## ADDED Requirements

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
