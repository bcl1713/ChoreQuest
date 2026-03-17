# Bootstrap Playwright Smoke Suite

## Why

ChoreQuest has unit and integration tests but no end-to-end
browser tests. Critical user flows — login, dashboard load,
core interactions — have zero automated browser-level
validation. As the app approaches v0.7.0 with increasing
feature complexity, regressions in auth and navigation paths
can slip through undetected. A lightweight Playwright smoke
suite provides confidence that the most important user
journeys work before every merge.

## What Changes

- Add Playwright as a dev dependency with project
  configuration
- Add `npm run test:e2e` script for running the smoke suite
- Create `tests/e2e/` directory with smoke tests covering:
  - Login success flow
  - Login failure feedback
  - Authenticated dashboard load
  - One core interaction (e.g., quest claim or reward view)
- Add GitHub Actions CI workflow to run the smoke suite on
  PRs

## Capabilities

### New Capabilities

- `e2e-smoke-testing`: Playwright configuration, test
  infrastructure, smoke test suite, and CI integration for
  critical auth and dashboard flows

### Modified Capabilities

None — this is additive test infrastructure with no changes
to existing specs.

## Impact

- **Dependencies**: Adds `@playwright/test` as a
  devDependency; requires Playwright browser binaries in CI
- **CI**: New GitHub Actions workflow for E2E tests; needs a
  running app server during test execution
- **Project structure**: New `tests/e2e/` directory alongside
  existing `tests/unit/` and `tests/integration/`
- **Scripts**: New `test:e2e` npm script; existing `test`
  script unchanged (smoke suite runs separately)
