# PRD: E2E Test Refactoring with Worker-Based Fixtures

## Introduction/Overview

The current E2E test suite is slow, doesn't handle parallel execution well, and relies on direct database inserts for user creation which has proven problematic (Supabase key complexities, foreign key constraints). This refactoring will migrate all E2E tests to use worker-based fixtures that create persistent Guild Master (GM) accounts via the application UI, significantly improving test speed, reliability, and maintainability.

**Problem:** Tests are painfully slow when run serially, fail when run in parallel, and database-insertion approaches are fragile and difficult to maintain.

**Goal:** Create a robust, fast, maintainable E2E test suite using worker-scoped fixtures that maintain authenticated user sessions throughout test execution.

## Goals

1. **Improve Test Speed:** Reduce test execution time by creating users once per worker instead of per-test
2. **Enable Parallel Execution:** Tests should reliably pass when run with multiple workers (currently configured for 2 workers)
3. **Eliminate Database Complexity:** Remove direct database user insertion in favor of UI-based user creation
4. **Maintain Test Isolation:** Each worker gets its own authenticated GM context that persists throughout its test runs
5. **Reduce Flakiness:** Improve test reliability through better user/session management
6. **Easier Maintenance:** Simplify test code by providing clean helper functions for common operations

## User Stories

1. **As a developer**, I want tests to run quickly in parallel so that I get faster feedback during development
2. **As a developer**, I want to write tests without worrying about Supabase keys and database schemas so that I can focus on testing application behavior
3. **As a developer**, I want each test worker to have a persistent logged-in user so that I don't waste time repeatedly logging in
4. **As a developer**, I want to easily create additional ephemeral users when my test needs multiple accounts so that I can test multi-user scenarios
5. **As a developer**, I want test data to be cleaned up after test runs so that the database doesn't accumulate stale test data
6. **As a CI system**, I want all 20 test suites to pass reliably when run with 2 workers so that deployments aren't blocked

## Functional Requirements

### 1. Worker-Scoped Fixture System

**FR-1.1:** Each Playwright worker MUST create one Guild Master (GM) user at worker startup using the application UI (signup flow)

**FR-1.2:** The GM user MUST remain logged in throughout all tests executed by that worker

**FR-1.3:** The GM user's browser context MUST persist across all tests in that worker

**FR-1.4:** Worker fixtures MUST have access to the GM's authentication state (cookies, session tokens, etc.)

**FR-1.5:** Worker fixture scope MUST be set to `{ scope: 'worker' }` in Playwright configuration

### 2. Ephemeral User Creation

**FR-2.1:** Fixture system MUST provide a helper function to create additional ephemeral users via UI when tests require multiple users

**FR-2.2:** Ephemeral users MUST be created through the application signup flow (NOT database inserts)

**FR-2.3:** Each ephemeral user creation MUST use unique, generated credentials (email, password, username)

**FR-2.4:** Ephemeral user helper MUST return user credentials and any created character/profile IDs

### 3. Browser Context Management

**FR-3.1:** System MUST support creating additional browser contexts for ephemeral users

**FR-3.2:** Tests MUST be able to switch between the GM context and ephemeral user contexts

**FR-3.3:** The primary GM context MUST remain logged in and available even when tests use additional contexts

**FR-3.4:** Each browser context MUST maintain isolated session state (cookies, localStorage, etc.)

### 4. Test Data Cleanup

**FR-4.1:** All test users (GM and ephemeral) created by a worker MUST be deleted after the worker completes its tests

**FR-4.2:** Cleanup MUST handle cascading deletes for related data (families, characters, profiles, quests, etc.)

**FR-4.3:** Cleanup MUST occur in a `workerInfo.teardown` or similar lifecycle hook

**FR-4.4:** Cleanup failures MUST be logged but not fail the test suite

### 5. Test Suite Migration

**FR-5.1:** Migration MUST proceed one test suite at a time

**FR-5.2:** Each migrated test suite MUST pass all tests before moving to the next suite

**FR-5.3:** Migrated tests MUST import from the new fixture system instead of creating their own users

**FR-5.4:** Old user-creation code MUST be removed from migrated test files

**FR-5.5:** All 20 test suites MUST be migrated:
- admin-activity-feed.spec.ts
- admin-dashboard-access.spec.ts
- admin-dashboard-tabs.spec.ts
- admin-guild-master-management.spec.ts
- admin-statistics.spec.ts
- character-creation.spec.ts
- family-joining.spec.ts
- family-management.spec.ts
- hero-reward-display.spec.ts
- quest-completion-rewards.spec.ts
- quest-pickup-management.spec.ts
- quest-system.spec.ts
- quest-template-creation.spec.ts
- quest-template-full-workflow.spec.ts
- quest-template-management.spec.ts
- quest-template-realtime.spec.ts
- reward-management.spec.ts
- reward-realtime.spec.ts
- reward-redemption-approval.spec.ts
- reward-store.spec.ts

**FR-5.6:** Test suite execution MUST be performed by the user, NOT by Claude (to preserve context and usage limitations)

### 6. Fixture Interface

**FR-6.1:** Fixture MUST expose the following to each test:
```typescript
{
  gmPage: Page;              // Authenticated GM browser page
  gmEmail: string;           // GM credentials
  gmPassword: string;
  gmId: string;             // GM user ID
  familyId: string;         // GM's family ID
  familyCode: string;       // Family join code
  characterId: string;      // GM's character ID
  createEphemeralUser: () => Promise<EphemeralUser>;  // Helper function
}
```

**FR-6.2:** `createEphemeralUser()` helper MUST create users via UI and return:
```typescript
{
  page: Page;               // New authenticated browser context
  email: string;
  password: string;
  userId: string;
  characterId: string;
}
```

## Non-Goals (Out of Scope)

1. **Migrating unit tests** - This refactoring only affects E2E tests
2. **Changing test assertions** - Focus is on setup/fixtures, not test logic
3. **Modifying application code** - Changes are test-infrastructure only
4. **Performance testing** - While speed improves, formal performance benchmarking is out of scope
5. **Database seeding strategies** - We're moving away from direct database manipulation
6. **Multi-browser testing** - Currently scoped to Chromium only (per existing config)
7. **Visual regression testing** - Not part of this refactoring

## Design Considerations

### Fixture Architecture

The fixture system should be structured as follows:

```
tests/e2e/helpers/
├── family-fixture.ts          # Main fixture definition (worker-scoped)
├── createEphemeralUser.ts     # UI-based user creation helper
├── createFamilyForWorker.ts   # DEPRECATED - to be removed/refactored
└── ...other helpers
```

### Key Design Principles

1. **UI-First:** All user creation must go through the actual signup flow the application provides
2. **Worker Isolation:** Each worker operates independently with its own GM user and family
3. **Context Preservation:** The GM's authenticated state persists for the entire worker lifetime
4. **Lazy Cleanup:** Cleanup happens at worker teardown, not after each test
5. **Fail-Safe:** Fixture failures should provide clear error messages about what went wrong during setup

### Migration Pattern

Each test suite migration should follow this pattern:

**Before:**
```typescript
test('some test', async ({ page }) => {
  await page.goto('/login');
  await page.fill('email', 'test@example.com');
  // ... manual login/setup
});
```

**After:**
```typescript
test('some test', async ({ gmPage, familyId }) => {
  // gmPage is already logged in as GM
  await gmPage.goto('/dashboard');
  // ... test logic
});
```

## Technical Considerations

### Current Challenges to Overcome

1. **Supabase Key Confusion:** The existing `createFamilyForWorker` uses `SUPABASE_SERVICE_ROLE_KEY` for direct DB access - this approach is being abandoned
2. **Foreign Key Constraints:** Direct user insertion triggers FK errors - UI creation avoids this by using proper application logic
3. **Scope Issues:** Existing `family-fixture.ts` has `{ scope: 'test' }` but should use `{ scope: 'worker' }`

### Dependencies

- Playwright test framework (already configured with 2 workers)
- @faker-js/faker for generating test data
- Existing helper functions in `tests/e2e/helpers/` (setup-helpers, quest-helpers, etc.)
- Application signup/login flows must be stable and reliable

### Implementation Notes

1. The `createEphemeralUser` function exists but currently uses `supabase.auth.signUp()` - needs refactoring to use UI
2. Remove all imports of `createClient` from `@supabase/supabase-js` in test files
3. Remove all usage of `SUPABASE_SERVICE_ROLE_KEY` in test code
4. Worker teardown should use Supabase admin API or UI-based deletion (TBD during implementation)

## Success Metrics

### Performance
- Test suite execution time improves (target: faster than current serial execution)
- Tests reliably pass with `workers: 2` configuration

### Reliability
- Zero flaky test failures related to user creation or authentication
- All 20 test suites pass consistently

### Maintainability
- Reduced lines of test setup code (estimate: 30-50% reduction in setup boilerplate)
- No direct database manipulation in test files
- Clear, simple fixture API that junior developers can understand

### Quality Gates
- `npm run build` - Zero compilation errors
- `npm run lint` - Zero linting errors/warnings
- `npm run test` - All unit tests pass
- `npx playwright test` - All E2E tests pass (run by user)

## Open Questions

1. **Cleanup Strategy:** Should worker teardown use:
   - UI-based account deletion (navigate to settings, click delete account)?
   - Supabase admin client for cleanup (keep service key usage minimal, only for cleanup)?
   - Database triggers/cascade deletes?

2. **Character Creation:** When the GM signs up via UI, does a character get auto-created, or does the fixture need to navigate through character creation flow?

3. **Family Creation:** Does the GM user automatically get a family created, or does the fixture need to create one via the UI?

4. **Error Handling:** Should fixture setup failures:
   - Retry automatically?
   - Take screenshots for debugging?
   - Fail fast or attempt partial cleanup?

5. **Existing Fixtures:** Should we keep `createFamilyForWorker.ts` and refactor it to use UI, or create a new function entirely?

6. **Storage State:** Should we use Playwright's `storageState` feature to persist authentication between test runs, or always create fresh users per worker execution?

## Migration Checklist

- [ ] Refactor `createEphemeralUser` to use UI instead of `supabase.auth.signUp()`
- [ ] Update `family-fixture.ts` to use `{ scope: 'worker' }`
- [ ] Implement worker-scoped GM user creation via UI
- [ ] Implement worker teardown with user cleanup
- [ ] Add browser context switching utilities
- [ ] Migrate test suite 1/20 (user selects which)
- [ ] Verify suite 1 passes with user testing
- [ ] Migrate test suite 2/20
- [ ] ... continue through all 20 suites
- [ ] Remove deprecated `createFamilyForWorker` if no longer needed
- [ ] Remove all `@supabase/supabase-js` imports from test files
- [ ] Update documentation in CLAUDE.md if test execution patterns change
- [ ] Final full test suite run by user with 2 workers

## Notes

- User must run all test executions to preserve Claude context/usage limits
- Tests previously passed when run serially but were slow
- Current `playwright.config.ts` has `workers: 2` and `fullyParallel: true` configured
- Existing helpers in `tests/e2e/helpers/` should be leveraged where possible (setup-helpers, quest-helpers, assertions, etc.)
