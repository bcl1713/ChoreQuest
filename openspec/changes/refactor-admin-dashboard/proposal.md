# Refactor Admin Dashboard

## Why

The admin dashboard refactoring from issue #48 (part of
the larger #89 effort) was partially completed —
`admin-dashboard.tsx` is now a lean 125-line container,
but both `quest-management-tab.tsx` (299 lines) and
`quest-dashboard/index.tsx` (299 lines) sit at the
absolute 300-line threshold from the frontend-architecture
spec. These components have complex state management with
numerous hooks, memoized computations, and inline handler
logic that makes them difficult to test in isolation and
extend safely.

## What Changes

- Extract quest action handlers and confirmation modal
  logic from `quest-management-tab.tsx` into dedicated
  custom hooks
- Extract section rendering (pending approvals,
  unassigned, in-progress) from
  `quest-management-tab.tsx` into focused presentational
  components
- Extract data orchestration and filtering logic from
  `quest-dashboard/index.tsx` into a custom hook
  (e.g., `useQuestDashboardData`)
- Extract quest dashboard sections (boss quests, pending
  approvals, my quests, family quests, quest history)
  into standalone components
- Ensure all extracted components and hooks are
  independently testable

## Capabilities

### New Capabilities

- `quest-management-decomposition`: Decompose the
  quest-management-tab into smaller components and
  hooks, extracting action handlers, modal logic,
  and section rendering
- `quest-dashboard-decomposition`: Decompose the
  quest-dashboard orchestrator into smaller components
  and a data hook, extracting filtering/memoization
  and section rendering

### Modified Capabilities

## Impact

- `components/admin/quest-management-tab.tsx` — will be
  significantly reduced, delegating to new
  sub-components and hooks
- `components/quests/quest-dashboard/index.tsx` — will
  become a thinner orchestrator composing extracted
  section components
- New files under `components/admin/` and
  `components/quests/quest-dashboard/` for extracted
  pieces
- Existing tests will need to be updated/split to cover
  the new component boundaries
- No API or data model changes — this is a pure frontend
  structural refactor
