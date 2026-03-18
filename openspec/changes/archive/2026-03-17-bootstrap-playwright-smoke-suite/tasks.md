# Tasks: Bootstrap Playwright Smoke Suite

## 1. Setup and Configuration

- [x] 1.1 Install `@playwright/test` as a devDependency
- [x] 1.2 Install Playwright Chromium browser binary
- [x] 1.3 Create `playwright.config.ts` at project root
  with Chromium-only project, base URL, and `webServer`
  config pointing to `npm run dev`
- [x] 1.4 Add `test:e2e` script to `package.json`
- [x] 1.5 Add Playwright output directories to `.gitignore`
  (`test-results/`, `playwright-report/`)

## 2. Test Infrastructure

- [x] 2.1 Create `tests/e2e/` directory
- [x] 2.2 Create test helper/fixture for seeding a test
  user account or providing valid credentials
- [x] 2.3 Create shared auth helper that logs in via the
  UI and can be reused across tests

## 3. Smoke Tests

- [x] 3.1 Write login success test: navigate to
  `/auth/login`, enter valid credentials, submit, verify
  redirect to `/dashboard`
- [x] 3.2 Write login failure test: navigate to
  `/auth/login`, enter invalid credentials, submit, verify
  error message is displayed and user stays on login page
- [x] 3.3 Write dashboard load test: log in, navigate to
  `/dashboard`, verify key UI elements are visible
- [x] 3.4 Write core interaction test: as authenticated
  user, exercise one core feature (e.g., view quest
  details or navigate to rewards)

## 4. CI Integration

- [x] 4.1 Create `.github/workflows/` directory
- [x] 4.2 Create GitHub Actions workflow file for E2E
  tests that triggers on PRs to `main` and `develop`
- [x] 4.3 Configure workflow to install dependencies,
  install Playwright browsers, and run `npm run test:e2e`
- [x] 4.4 Configure workflow to upload Playwright report
  as artifact on failure

## 5. Verification

- [x] 5.1 Run `npm run test:e2e` locally and verify all
  smoke tests pass
- [x] 5.2 Verify `npm run test` still runs only unit and
  integration tests (unchanged)
- [x] 5.3 Verify Playwright config starts dev server
  automatically
