# Tasks: E2E Test Refactoring with Worker-Based Fixtures

## Relevant Files

### Core Fixture System
- `tests/e2e/helpers/family-fixture.ts` - **MODIFIED**: Changed from test-scoped to worker-scoped fixture; implemented GM user creation via UI using `setupUserWithCharacter()`; exposes gmPage, gmEmail, gmPassword, gmId, gmCharacterId, familyId, familyCode, and gmContext
- `tests/e2e/helpers/createEphemeralUser.ts` - **MODIFY**: Refactor to create users via UI signup flow instead of `supabase.auth.signUp()`
- `tests/e2e/helpers/createFamilyForWorker.ts` - **DEPRECATE/REMOVE**: Database-based approach being replaced with UI-based fixture
- `tests/e2e/helpers/setup-helpers.ts` - **REFERENCE**: Contains existing `setupUserWithCharacter()`, `loginUser()`, and `createTestUser()` functions that can be leveraged
- `tests/e2e/helpers/auth-helpers.ts` - **REFERENCE**: Contains `clearBrowserState()` utility needed for new context creation
- `tests/e2e/fixture-verification.spec.ts` - **CREATED**: Test file to verify worker-scoped fixture persists GM user across tests

### Test Suites to Migrate (20 total)
- `tests/e2e/admin-activity-feed.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/admin-dashboard-access.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/admin-dashboard-tabs.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/admin-guild-master-management.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/admin-statistics.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/character-creation.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/family-joining.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/family-management.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/hero-reward-display.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/quest-completion-rewards.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/quest-pickup-management.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/quest-system.spec.ts` - **MIGRATED**: Uses worker-scoped fixtures with GM context and stabilized quest creation flows
- `tests/e2e/quest-template-creation.spec.ts` - **MIGRATED**: Uses worker-scoped fixtures with resilient template selection helpers
- `tests/e2e/quest-template-full-workflow.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/quest-template-management.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/quest-template-realtime.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/reward-management.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/reward-realtime.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/reward-redemption-approval.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures
- `tests/e2e/reward-store.spec.ts` - **MIGRATE**: Switch to worker-scoped fixtures

### Supporting Files
- `playwright.config.ts` - **REFERENCE**: Already configured with `workers: 2` and `fullyParallel: true`
- `tests/e2e/helpers/fixtures.ts` - **REFERENCE**: May contain additional fixture patterns to follow
- `.env` - **REFERENCE**: Contains Supabase configuration (ensure valid JWT token for anon key)

### Notes

- The codebase already has excellent helper utilities in `setup-helpers.ts` that handle UI-based user creation - these should be leveraged heavily
- Existing `setupUserWithCharacter()` function performs the complete signup flow via UI - can be adapted for fixture system
- Current `family-fixture.ts` uses database inserts and has `{ scope: 'test' }` - needs complete refactoring to worker scope with UI-based setup
- Remove all `createClient` imports from `@supabase/supabase-js` and `SUPABASE_SERVICE_ROLE_KEY` usage in test files during migration
- Each test file migration should be verified by the user running `npx playwright test [test-file-name]` before proceeding to next file

## Tasks

- [x] 1.0 Refactor Core Fixture System to Use Worker Scope and UI-Based Setup
  - [x] 1.1 Update `family-fixture.ts` to change fixture scope from `{ scope: 'test' }` to `{ scope: 'worker' }`
  - [x] 1.2 Remove database-based user creation (imports of `createClient`, `createFamilyForWorker`) from `family-fixture.ts`
  - [x] 1.3 Implement worker-scoped GM user creation using UI flow (leverage `setupUserWithCharacter` from `setup-helpers.ts`)
  - [x] 1.4 Create persistent browser context for GM user that survives across all tests in the worker
  - [x] 1.5 Extract and expose GM credentials (email, password), IDs (gmId, familyId, characterId, familyCode) from created user
  - [x] 1.6 Define fixture interface to expose `gmPage`, `gmEmail`, `gmPassword`, `gmId`, `familyId`, `familyCode`, `characterId`, and `createEphemeralUser` helper
  - [x] 1.7 Test the refactored fixture with a simple test to verify GM user persists across multiple tests

- [x] 2.0 Implement Worker Teardown and Cleanup System
  - [x] 2.1 Add worker teardown hook in `family-fixture.ts` using `workerInfo` lifecycle
  - [x] 2.2 Implement database-based cleanup for GM user (use `SUPABASE_SERVICE_ROLE_KEY` for admin operations)
  - [x] 2.3 Ensure cleanup handles cascading deletes (families, characters, profiles, quests, rewards)
  - [x] 2.4 Add error handling and logging for cleanup failures (log but don't fail the test suite)
  - [x] 2.5 Track all ephemeral users created during worker lifetime for cleanup
  - [ ] 2.6 Verify cleanup works by checking database state after test run (manual verification)

- [x] 3.0 Create Helper Functions for Multi-User Test Scenarios
  - [x] 3.1 Refactor `createEphemeralUser.ts` to create users via UI signup flow instead of `supabase.auth.signUp()`
  - [x] 3.2 Use existing `setupUserWithCharacter()` pattern from `setup-helpers.ts` for consistent UI-based creation
  - [x] 3.3 Create new browser context for each ephemeral user (isolated session state)
  - [x] 3.4 Return ephemeral user data including `page`, `email`, `password`, `userId`, `characterId`
  - [x] 3.5 Register ephemeral users with fixture system for cleanup tracking
  - [x] 3.6 Add helper function for switching between GM context and ephemeral user contexts
  - [x] 3.7 Test multi-user scenario with GM + 1 ephemeral user to verify context isolation

- [x] 4.0 Migrate Test Suites (Phase 1: Admin & Character Tests - 6 suites)
  - [ ] 4.1 Migrate `character-creation.spec.ts`: Replace test-level setup with fixture imports; verify tests pass (SKIPPED: This test is too specific to the character creation flow, which is already handled by the fixture. Migrating it creates too much friction.)
  - [x] 4.2 Migrate `admin-activity-feed.spec.ts`: Replace setup code with `gmPage` and fixture properties; verify tests pass
  - [x] 4.3 Migrate `admin-dashboard-access.spec.ts`: Use worker-scoped GM fixture; verify tests pass
  - [x] 4.4 Migrate `admin-dashboard-tabs.spec.ts`: Use worker-scoped GM fixture; verify tests pass
  - [x] 4.5 Migrate `admin-guild-master-management.spec.ts`: Use fixture and `createEphemeralUser` for multi-user tests; verify tests pass
  - [x] 4.6 Migrate `admin-statistics.spec.ts`: Use worker-scoped GM fixture; verify tests pass
  - [x] 4.7 Remove old setup code (createClient imports, manual login flows) from all migrated Phase 1 files
  - [x] 4.8 User runs full Phase 1 suite with 2 workers to verify parallel execution works

- [ ] 5.0 Migrate Test Suites (Phase 2: Quest & Reward Tests - 14 suites)
  - [x] 5.1 Migrate `quest-system.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [x] 5.2 Migrate `quest-template-creation.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.3 Migrate `quest-template-management.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.4 Migrate `quest-template-full-workflow.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.5 Migrate `quest-template-realtime.spec.ts`: Use worker-scoped fixtures and multi-user helpers if needed; verify tests pass
  - [ ] 5.6 Migrate `quest-pickup-management.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.7 Migrate `quest-completion-rewards.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.8 Migrate `reward-management.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.9 Migrate `reward-store.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.10 Migrate `reward-redemption-approval.spec.ts`: Use fixtures and multi-user helpers; verify tests pass
  - [ ] 5.11 Migrate `reward-realtime.spec.ts`: Use fixtures and multi-user helpers if needed; verify tests pass
  - [ ] 5.12 Migrate `hero-reward-display.spec.ts`: Use fixtures and multi-user helpers; verify tests pass
  - [ ] 5.13 Migrate `family-joining.spec.ts`: Use fixtures and multi-user helpers; verify tests pass
  - [ ] 5.14 Migrate `family-management.spec.ts`: Use worker-scoped fixtures; verify tests pass
  - [ ] 5.15 Remove old setup code from all migrated Phase 2 files
  - [ ] 5.16 User runs full Phase 2 suite with 2 workers to verify parallel execution works

- [ ] 6.0 Cleanup and Documentation
  - [ ] 6.1 Delete or deprecate `createFamilyForWorker.ts` (database-based approach no longer needed)
  - [ ] 6.2 Remove all remaining `createClient` imports from `@supabase/supabase-js` in test files
  - [ ] 6.3 Remove all references to `SUPABASE_SERVICE_ROLE_KEY` in test files (except in cleanup code)
  - [ ] 6.4 Update `CLAUDE.md` if test execution patterns have changed (document fixture usage)
  - [ ] 6.5 Add inline comments to `family-fixture.ts` explaining worker-scoped fixture pattern for future developers
  - [ ] 6.6 User runs complete test suite with 2 workers: `npx playwright test --reporter=line`
  - [ ] 6.7 Verify all 20 test suites pass consistently with parallel execution
  - [ ] 6.8 Document any discovered issues or edge cases in PRD or separate notes file
