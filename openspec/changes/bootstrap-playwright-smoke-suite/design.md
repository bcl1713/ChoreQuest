# Design: Bootstrap Playwright Smoke Suite

## Context

ChoreQuest is a Next.js 15 app with an existing test structure
under `tests/` — unit tests (Jest) and integration tests
(Jest with a real database). There are no E2E browser tests.
The app uses a custom auth system via `useAuth()` context with
login/register flows at `/auth/login` and `/auth/register`.
Authenticated users land on `/dashboard`. There is no CI
workflow yet (no `.github/workflows/` directory).

## Goals / Non-Goals

**Goals:**

- Add Playwright with a minimal, stable configuration
- Create a small smoke suite covering critical auth and
  dashboard flows
- Add `npm run test:e2e` for local and CI execution
- Add a GitHub Actions workflow that runs the smoke suite
  on pull requests

**Non-Goals:**

- Full E2E coverage across all product areas
- Testing admin, rewards, or quest lifecycle flows
- Visual regression testing
- Cross-browser testing beyond Chromium for the bootstrap
- Performance or load testing

## Decisions

### Decision 1: Playwright over Cypress

Use Playwright (`@playwright/test`) for the E2E framework.

- **Why**: Playwright has built-in auto-wait, parallel
  execution, and first-class support for modern web APIs.
  It ships with a test runner — no extra dependencies needed.
- **Alternative**: Cypress — heavier runtime, requires a
  separate dashboard for parallelization, and has limitations
  with multi-tab and iframe testing.

### Decision 2: Chromium-only for bootstrap

Run smoke tests against Chromium only in the initial suite.

- **Why**: Reduces CI time and flakiness surface. Adding
  Firefox/WebKit is trivial later via config.
- **Alternative**: Multi-browser from day one — unnecessary
  for a smoke suite and slows CI.

### Decision 3: Test directory at `tests/e2e/`

Place E2E tests in `tests/e2e/` alongside existing
`tests/unit/` and `tests/integration/`.

- **Why**: Consistent with the existing test directory
  structure. Keeps all test types co-located.
- **Alternative**: Top-level `e2e/` directory — breaks the
  established pattern.

### Decision 4: Separate npm script

Add `test:e2e` as a standalone script; do not add it to the
existing `test` script.

- **Why**: E2E tests require a running server and are slower.
  The existing `test` script runs unit + integration tests
  and should remain fast for TDD workflows.
- **Alternative**: Add to `test` script — would slow down
  the dev feedback loop.

### Decision 5: CI with `webServer` config

Use Playwright's built-in `webServer` configuration to start
the Next.js dev server automatically during CI runs.

- **Why**: Eliminates manual server management in CI. The
  `webServer` option handles startup, readiness checks, and
  teardown automatically.
- **Alternative**: Manually start/stop the server in CI
  scripts — error-prone and adds complexity.

### Decision 6: Auth via UI for smoke tests

Authenticate through the login form UI rather than injecting
cookies or tokens directly.

- **Why**: This is a smoke suite — the login flow itself is
  a critical path under test. Shortcutting auth defeats the
  purpose for these specific tests.
- **Alternative**: API-based auth with stored state —
  appropriate for larger suites but premature here.

## Risks / Trade-offs

- **Flakiness from real server dependency**: E2E tests hit a
  live app, which can introduce timing issues.
  Mitigation: Use Playwright's auto-wait and explicit
  assertions; keep the suite small.
- **CI duration increase**: Adding E2E tests extends CI time.
  Mitigation: Chromium-only, small suite, parallel execution.
- **Database seeding**: Smoke tests need known user accounts
  to log in.
  Mitigation: Use a seeded test database or create test
  fixtures as part of the test setup.
- **Environment parity**: Local dev vs CI environments may
  differ.
  Mitigation: Use Playwright's `webServer` config
  consistently in both environments.
