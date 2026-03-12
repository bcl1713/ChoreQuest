# Proposal: Extract Dashboard Layout

## Why

The dashboard header is duplicated across authenticated
pages — the profile page reimplements header layout,
class/role display logic, and time management inline
instead of reusing the existing `DashboardHeader`
component. The admin page has a similar but simplified
header. This violates DRY and the frontend architecture
spec's guidance on shared primitives, making header
changes error-prone and inconsistent.

## What Changes

- Create a shared `AuthenticatedPageShell` layout
  component that provides the common structure for all
  authenticated pages (gradient background, header,
  content area)
- Refactor `app/profile/page.tsx` to use the shared
  layout instead of inline header code, removing
  duplicated `getRoleDisplay()`/`getClassDisplay()`
  functions and local clock state
- Refactor `app/admin/page.tsx` to use the shared
  layout instead of its custom inline header
- Make `DashboardHeader` configurable enough to support
  variant action buttons per page (dashboard actions
  vs back-to-dashboard)

## Capabilities

### New Capabilities

- `authenticated-page-shell`: Shared layout wrapper for
  authenticated pages providing consistent header,
  background, and content area structure

### Modified Capabilities

_None — this is a structural refactor that doesn't
change any existing spec-level requirements._

## Impact

- **Components affected:**
  `components/dashboard/dashboard-header.tsx` (extend
  props for action variants), new
  `components/layout/authenticated-page-shell.tsx`
- **Pages affected:** `app/profile/page.tsx`,
  `app/admin/page.tsx`, `app/dashboard/page.tsx`
  (minor — wire through new shell)
- **Removed duplication:** ~70 lines of inline header
  code from profile page, ~25 lines from admin page
- **No API or dependency changes**
- **No breaking changes** — purely internal refactor
