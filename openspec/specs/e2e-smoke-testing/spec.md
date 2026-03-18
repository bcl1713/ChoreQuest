# E2E Smoke Testing

## Purpose

Defines the end-to-end smoke testing capability using Playwright. Covers
configuration, test script setup, smoke test scenarios for authentication
and dashboard flows, CI integration, and test directory structure.

## Requirements

### Requirement: Playwright configuration

The project SHALL include a Playwright configuration file
at the project root that configures Chromium as the sole
test browser, sets the base URL, and uses the `webServer`
option to automatically start the Next.js dev server.

#### Scenario: Configuration file exists and is valid

- **WHEN** a developer clones the repository
- **THEN** a `playwright.config.ts` file EXISTS at the
  project root with Chromium configured as the only browser
  project

#### Scenario: Dev server starts automatically

- **WHEN** a developer runs `npx playwright test`
- **THEN** Playwright starts the Next.js dev server via the
  `webServer` configuration before executing tests

### Requirement: E2E test script

The project SHALL provide an `npm run test:e2e` script that
executes the Playwright smoke suite. This script SHALL be
separate from the existing `test` script.

#### Scenario: Running the E2E suite

- **WHEN** a developer runs `npm run test:e2e`
- **THEN** Playwright executes all tests in `tests/e2e/`
  and reports results

#### Scenario: Existing test script unchanged

- **WHEN** a developer runs `npm run test`
- **THEN** only unit and integration tests execute;
  E2E tests are NOT included

### Requirement: Login success smoke test

The smoke suite SHALL include a test that verifies a valid
user can log in and reach the dashboard.

#### Scenario: Successful login redirects to dashboard

- **WHEN** a user navigates to `/auth/login`
- **AND** enters valid credentials
- **AND** submits the login form
- **THEN** the user is redirected to `/dashboard`
- **AND** the dashboard page content is visible

### Requirement: Login failure smoke test

The smoke suite SHALL include a test that verifies invalid
credentials produce visible error feedback.

#### Scenario: Invalid credentials show error message

- **WHEN** a user navigates to `/auth/login`
- **AND** enters invalid credentials
- **AND** submits the login form
- **THEN** an error message is displayed on the login page
- **AND** the user remains on the login page

### Requirement: Authenticated dashboard load smoke test

The smoke suite SHALL include a test that verifies an
authenticated user can load the dashboard and see expected
content.

#### Scenario: Dashboard displays expected content

- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the page loads without errors
- **AND** key dashboard elements are visible (e.g.,
  navigation, quest list, or user greeting)

### Requirement: Core interaction smoke test

The smoke suite SHALL include at least one test that
exercises a core user interaction beyond navigation, such
as viewing a quest or reward.

#### Scenario: User can interact with a core feature

- **WHEN** an authenticated user is on the dashboard
- **AND** performs a core interaction (e.g., viewing quest
  details or navigating to rewards)
- **THEN** the expected UI response is displayed without
  errors

### Requirement: CI integration

The project SHALL include a GitHub Actions workflow that
runs the Playwright smoke suite on pull requests targeting
the `main` and `develop` branches.

#### Scenario: Smoke suite runs on PR

- **WHEN** a pull request is opened or updated against
  `main` or `develop`
- **THEN** the GitHub Actions workflow executes
  `npm run test:e2e`
- **AND** the PR status reflects the test results

#### Scenario: CI installs Playwright browsers

- **WHEN** the GitHub Actions workflow runs
- **THEN** Playwright browser binaries are installed
  before test execution

### Requirement: Test directory structure

E2E test files SHALL be located in `tests/e2e/` to maintain
consistency with the existing `tests/unit/` and
`tests/integration/` directory structure.

#### Scenario: E2E tests are in the correct directory

- **WHEN** a developer looks for E2E tests
- **THEN** all smoke test files are located under
  `tests/e2e/`
