# Raise Auth & Dashboard Test Coverage

## Why

Automated test coverage in ChoreQuest has significant blind
spots in the highest-risk user paths: authentication flows,
the main dashboard, and most API routes. With the 0.7.0
release approaching, we need targeted coverage improvements
in these areas to catch regressions before they reach users.
Currently, 81% of API routes lack meaningful test coverage,
the AuthForm component has zero tests, and the main
DashboardContent component is entirely untested.

## What Changes

- Add unit tests for the `AuthForm` component covering
  login, registration, and family creation flows
- Add unit tests for auth action edge cases
  (`registerUser` validation, `updatePassword` flows)
- Add unit tests for `DashboardContent` component covering
  tab switching, data loading, and error states
- Add unit tests for the `useQuestTemplates` hook
- Add unit tests for the highest-traffic API route group:
  quest instance actions (approve, assign, deny, release)
- Establish a concrete coverage baseline and modest
  improvement target for the selected files

## Capabilities

### New Capabilities

- `auth-test-coverage`: Test coverage for auth forms,
  auth actions, and auth error handling components
- `dashboard-test-coverage`: Test coverage for dashboard
  content rendering, tab behavior, and data loading hooks
- `api-route-test-coverage`: Test coverage for the
  quest-instances API route group
  (approve, assign, deny, release, get)

### Modified Capabilities

No existing capabilities are modified. This change adds
tests only with no behavioral changes.

## Impact

- **Test files**: New test files in
  `src/components/auth/`,
  `src/components/dashboard/`, and
  `tests/unit/app/api/`
- **CI**: More tests run in the pipeline; no config
  changes needed
- **Dependencies**: No new dependencies
- **Code changes**: Test-only; no production code
  modifications unless minor refactors are needed
  for testability
