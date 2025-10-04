# Task List: E2E Test Suite Refactoring

**PRD:** tasks/0004-prd-e2e-test-refactoring.md
**Baseline Established:** 2025-10-03
**Current State:** 10.5 min runtime, 95/97 passing, 4,854 LOC, 60% duplication

## Relevant Files

### Test Files to Fix (Quick Wins)
- `tests/e2e/admin-activity-feed.spec.ts` - Fix undefined `activityFeed` variable at line 236
- `tests/e2e/admin-statistics.spec.ts` - Fix undefined `statsPanel` variable at line 89

### Helper Modules to Create
- `tests/e2e/helpers/auth-helpers.ts` - Login, logout, family code extraction (addresses patterns #1, #5, #6)
- `tests/e2e/helpers/quest-helpers.ts` - Quest creation, completion workflows (addresses patterns #2, #10)
- `tests/e2e/helpers/reward-helpers.ts` - Reward CRUD and redemption (addresses pattern #3)
- `tests/e2e/helpers/navigation-helpers.ts` - Tab navigation, modal operations (addresses patterns #4, #8, #9)
- `tests/e2e/helpers/realtime-helpers.ts` - Real-time update assertions (addresses pattern #7)
- `tests/e2e/helpers/assertions.ts` - Custom Playwright assertions for ChoreQuest patterns
- `tests/e2e/helpers/fixtures.ts` - Pre-configured test scenarios (family setups, quest workflows)

### Existing Helper to Refactor
- `tests/e2e/helpers/setup-helpers.ts` - Current helper (395 lines), will be split into specialized modules

### Configuration Files
- `playwright.config.ts` - Update workers and parallelization settings (currently workers: 1)

### Documentation Files to Create
- `tests/e2e/README.md` - Comprehensive testing guide with helper usage examples
- `tests/e2e/TESTING_PATTERNS.md` - Test templates for CRUD, realtime, approval workflows
- `tests/e2e/PARALLEL_SAFETY.md` - Document parallel safety investigation findings and fixes

### All 20 Test Files (To Be Refactored with Helpers)
- `tests/e2e/admin-activity-feed.spec.ts` (9 tests, 288 lines)
- `tests/e2e/admin-dashboard-access.spec.ts` (4 tests)
- `tests/e2e/admin-dashboard-tabs.spec.ts` (5 tests)
- `tests/e2e/admin-guild-master-management.spec.ts` (6 tests)
- `tests/e2e/admin-statistics.spec.ts` (10 tests)
- `tests/e2e/character-creation.spec.ts` (6 tests)
- `tests/e2e/family-joining.spec.ts` (3 tests)
- `tests/e2e/family-management.spec.ts` (5 tests)
- `tests/e2e/hero-reward-display.spec.ts` (2 tests)
- `tests/e2e/quest-completion-rewards.spec.ts` (5 tests)
- `tests/e2e/quest-pickup-management.spec.ts` (3 tests)
- `tests/e2e/quest-system.spec.ts` (4 tests)
- `tests/e2e/quest-template-creation.spec.ts` (6 tests)
- `tests/e2e/quest-template-full-workflow.spec.ts` (2 tests)
- `tests/e2e/quest-template-management.spec.ts` (6 tests)
- `tests/e2e/quest-template-realtime.spec.ts` (5 tests)
- `tests/e2e/reward-management.spec.ts` (5 tests)
- `tests/e2e/reward-realtime.spec.ts` (3 tests)
- `tests/e2e/reward-redemption-approval.spec.ts` (6 tests)
- `tests/e2e/reward-store.spec.ts` (6 tests)

### Notes
- Baseline: 10.5 min runtime, 95/97 passing (2 test bugs), 4,854 LOC
- Target: 2-3 min runtime, 97/97 passing, 2,400-2,900 LOC
- Critical blocker: Tests fail in parallel (workers > 1) - must fix before performance gains
- 7 anti-pattern instances to fix (waitForTimeout/page.reload)
- 60% code duplication identified (~2,900 lines)

## Tasks

- [x] 0.0 Baseline Analysis and Audit (COMPLETED 2025-10-03)
  - [x] 0.1 Run full test suite and establish baseline metrics
  - [x] 0.2 Analyze code patterns and identify duplication
  - [x] 0.3 Create AUDIT.md with detailed findings
  - [x] 0.4 Create BASELINE-METRICS.md with success criteria
  - [x] 0.5 Commit baseline documentation

- [ ] 1.0 Fix Test Code Bugs and Anti-Patterns (Quick Wins)
  - [ ] 1.1 Fix admin-activity-feed.spec.ts:211 - Add missing `activityFeed` variable declaration
  - [ ] 1.2 Fix admin-statistics.spec.ts:41 - Add missing `statsPanel` variable declaration
  - [ ] 1.3 Run tests to verify both bugs fixed (should be 97/97 passing)
  - [ ] 1.4 Search for all 7 anti-pattern instances (waitForTimeout/page.reload)
  - [ ] 1.5 Replace each anti-pattern with proper wait mechanism
  - [ ] 1.6 Run full test suite to verify 97/97 passing with zero anti-patterns
  - [ ] 1.7 Commit fixes: "fix: resolve test code bugs and eliminate anti-patterns"

- [ ] 2.0 Create Comprehensive Helper Library
  - [ ] 2.1 Create auth-helpers.ts module
    - [ ] 2.1.1 Extract `logout(page)` helper (13 occurrences)
    - [ ] 2.1.2 Extract `getFamilyCode(page)` helper (8+ occurrences)
    - [ ] 2.1.3 Extract `joinExistingFamily(page, inviteCode, userData)` helper
    - [ ] 2.1.4 Add JSDoc comments with usage examples
    - [ ] 2.1.5 Write unit tests for auth helpers (if feasible)
  - [ ] 2.2 Create quest-helpers.ts module
    - [ ] 2.2.1 Create `createCustomQuest(page, questData)` helper (addresses 349 form filling occurrences)
    - [ ] 2.2.2 Create `createQuestTemplate(page, templateData)` helper
    - [ ] 2.2.3 Create `createQuestFromTemplate(page, templateName, options)` helper
    - [ ] 2.2.4 Create `pickupQuest(page, questName)` helper
    - [ ] 2.2.5 Create `completeQuest(page, questName)` helper (12+ occurrences)
    - [ ] 2.2.6 Create `approveQuest(page, questName)` helper (12+ occurrences)
    - [ ] 2.2.7 Create `denyQuest(page, questName)` helper
    - [ ] 2.2.8 Add JSDoc comments with usage examples
  - [ ] 2.3 Create reward-helpers.ts module
    - [ ] 2.3.1 Create `createReward(page, rewardData)` helper (32 occurrences)
    - [ ] 2.3.2 Create `redeemReward(page, rewardName)` helper
    - [ ] 2.3.3 Create `approveRewardRedemption(page, rewardName)` helper
    - [ ] 2.3.4 Create `denyRewardRedemption(page, rewardName)` helper
    - [ ] 2.3.5 Create `markRedemptionFulfilled(page, rewardName)` helper
    - [ ] 2.3.6 Create `toggleRewardActive(page, rewardName)` helper
    - [ ] 2.3.7 Add JSDoc comments with usage examples
  - [ ] 2.4 Create navigation-helpers.ts module
    - [ ] 2.4.1 Create `navigateToTab(page, tabName)` helper (40+ occurrences)
    - [ ] 2.4.2 Create `navigateToAdmin(page)` helper (25+ occurrences)
    - [ ] 2.4.3 Create `openModal(page, modalType)` helper (60+ occurrences)
    - [ ] 2.4.4 Create `closeModal(page, modalType)` helper (60+ occurrences)
    - [ ] 2.4.5 Create `switchAdminTab(page, tabName)` helper
    - [ ] 2.4.6 Add JSDoc comments with usage examples
  - [ ] 2.5 Create realtime-helpers.ts module
    - [ ] 2.5.1 Create `setupTwoContextTest(browser)` fixture (15 occurrences)
    - [ ] 2.5.2 Create `waitForRealtimeChange(page, selector, options)` generic helper
    - [ ] 2.5.3 Create `waitForNewListItem(page, listSelector, itemText)` helper
    - [ ] 2.5.4 Create `waitForListItemRemoved(page, listSelector, itemText)` helper
    - [ ] 2.5.5 Create `waitForTextChange(page, selector, expectedText)` helper
    - [ ] 2.5.6 Add JSDoc comments with usage examples
  - [ ] 2.6 Create assertions.ts module
    - [ ] 2.6.1 Create `expectCharacterStats(page, { gold?, xp?, level? })` assertion
    - [ ] 2.6.2 Create `expectQuestStatus(page, questName, status)` assertion
    - [ ] 2.6.3 Create `expectRewardInStore(page, rewardName)` assertion
    - [ ] 2.6.4 Create `expectToastMessage(page, message)` assertion
    - [ ] 2.6.5 Add JSDoc comments with usage examples
  - [ ] 2.7 Create fixtures.ts module
    - [ ] 2.7.1 Create `setupFamilyWithGM(page)` fixture
    - [ ] 2.7.2 Create `setupFamilyWithMultipleGMs(page)` fixture
    - [ ] 2.7.3 Create `setupFamilyWithHeroes(page, heroCount)` fixture
    - [ ] 2.7.4 Create `setupQuestWorkflow(page)` fixture
    - [ ] 2.7.5 Create `setupRewardStore(page)` fixture
    - [ ] 2.7.6 Add JSDoc comments with usage examples
  - [ ] 2.8 Refactor existing setup-helpers.ts
    - [ ] 2.8.1 Keep `setupUserWithCharacter` (still needed, but can use new helpers internally)
    - [ ] 2.8.2 Keep `loginUser` (still needed for realtime tests)
    - [ ] 2.8.3 Update `giveCharacterGoldViaQuest` to use new quest helpers
    - [ ] 2.8.4 Move `clearBrowserState` to auth-helpers if not already there
    - [ ] 2.8.5 Update imports to reference new helper modules
  - [ ] 2.9 Commit helper library: "feat: create comprehensive E2E test helper library"

- [ ] 3.0 Investigate and Fix Parallel Safety Issues
  - [ ] 3.1 Initial investigation
    - [ ] 3.1.1 Run 10 tests with `workers: 2` and document failures
    - [ ] 3.1.2 Categorize failure types (timeouts, assertion failures, race conditions)
    - [ ] 3.1.3 Identify common failure patterns across tests
  - [ ] 3.2 Check database connection pool
    - [ ] 3.2.1 Review Supabase local config for connection limits
    - [ ] 3.2.2 Increase connection pool size if needed
    - [ ] 3.2.3 Test with workers: 2 after pool changes
  - [ ] 3.3 Check realtime subscription cleanup
    - [ ] 3.3.1 Review test afterEach hooks for subscription cleanup
    - [ ] 3.3.2 Add explicit cleanup for realtime subscriptions if missing
    - [ ] 3.3.3 Test with workers: 2 after cleanup changes
  - [ ] 3.4 Add missing waits for async operations
    - [ ] 3.4.1 Add `await page.waitForLoadState('networkidle')` after auth operations
    - [ ] 3.4.2 Add explicit waits for Supabase database writes to complete
    - [ ] 3.4.3 Increase timeouts for operations under load (e.g., 10s → 15s)
    - [ ] 3.4.4 Test with workers: 2 after wait changes
  - [ ] 3.5 Fix race conditions in setupUserWithCharacter
    - [ ] 3.5.1 Review helper for timing assumptions
    - [ ] 3.5.2 Add explicit waits between signup and character creation
    - [ ] 3.5.3 Ensure unique family names prevent conflicts
    - [ ] 3.5.4 Test with workers: 2 after race condition fixes
  - [ ] 3.6 Verify all tests pass with workers: 2
    - [ ] 3.6.1 Run full suite with workers: 2
    - [ ] 3.6.2 Document any remaining failures in PARALLEL_SAFETY.md
    - [ ] 3.6.3 If needed, mark specific tests as serial-only with test.describe.configure
  - [ ] 3.7 Commit parallel safety fixes: "fix: resolve parallel execution issues for workers: 2"

- [ ] 4.0 Refactor Tests to Use Helper Functions
  - [ ] 4.1 Refactor admin tests (5 files, ~32 tests)
    - [ ] 4.1.1 Update admin-activity-feed.spec.ts to use helpers
    - [ ] 4.1.2 Update admin-dashboard-access.spec.ts to use helpers
    - [ ] 4.1.3 Update admin-dashboard-tabs.spec.ts to use helpers
    - [ ] 4.1.4 Update admin-guild-master-management.spec.ts to use helpers
    - [ ] 4.1.5 Update admin-statistics.spec.ts to use helpers
    - [ ] 4.1.6 Run admin tests to verify all pass
    - [ ] 4.1.7 Measure LOC reduction for admin tests
  - [ ] 4.2 Refactor quest tests (6 files, ~19 tests)
    - [ ] 4.2.1 Update quest-system.spec.ts to use helpers
    - [ ] 4.2.2 Update quest-pickup-management.spec.ts to use helpers
    - [ ] 4.2.3 Update quest-completion-rewards.spec.ts to use helpers
    - [ ] 4.2.4 Update quest-template-creation.spec.ts to use helpers
    - [ ] 4.2.5 Update quest-template-management.spec.ts to use helpers
    - [ ] 4.2.6 Update quest-template-full-workflow.spec.ts to use helpers
    - [ ] 4.2.7 Run quest tests to verify all pass
    - [ ] 4.2.8 Measure LOC reduction for quest tests
  - [ ] 4.3 Refactor reward tests (4 files, ~18 tests)
    - [ ] 4.3.1 Update reward-management.spec.ts to use helpers
    - [ ] 4.3.2 Update reward-store.spec.ts to use helpers
    - [ ] 4.3.3 Update hero-reward-display.spec.ts to use helpers
    - [ ] 4.3.4 Update reward-redemption-approval.spec.ts to use helpers
    - [ ] 4.3.5 Run reward tests to verify all pass
    - [ ] 4.3.6 Measure LOC reduction for reward tests
  - [ ] 4.4 Refactor realtime tests (2 files, ~8 tests)
    - [ ] 4.4.1 Update quest-template-realtime.spec.ts to use realtime helpers
    - [ ] 4.4.2 Update reward-realtime.spec.ts to use realtime helpers
    - [ ] 4.4.3 Run realtime tests to verify all pass
    - [ ] 4.4.4 Measure LOC reduction for realtime tests
  - [ ] 4.5 Refactor character and auth tests (3 files, ~9 tests)
    - [ ] 4.5.1 Update character-creation.spec.ts to use helpers
    - [ ] 4.5.2 Update family-joining.spec.ts to use helpers
    - [ ] 4.5.3 Update family-management.spec.ts to use helpers
    - [ ] 4.5.4 Run character/auth tests to verify all pass
    - [ ] 4.5.5 Measure LOC reduction for character/auth tests
  - [ ] 4.6 Verify all tests still pass after refactoring
    - [ ] 4.6.1 Run full test suite (97 tests)
    - [ ] 4.6.2 Verify 97/97 passing
    - [ ] 4.6.3 Calculate total LOC reduction (target: 2,400-2,900 lines, 50-60% reduction)
  - [ ] 4.7 Commit test refactoring: "refactor: migrate all E2E tests to use helper library"

- [ ] 5.0 Enable Gradual Parallelization
  - [ ] 5.1 Enable workers: 2
    - [ ] 5.1.1 Update playwright.config.ts to set workers: 2
    - [ ] 5.1.2 Update playwright.config.ts to set fullyParallel: true
    - [ ] 5.1.3 Run full test suite and measure runtime
    - [ ] 5.1.4 Verify 97/97 passing with workers: 2
    - [ ] 5.1.5 Run tests 3 times to check for flakiness
    - [ ] 5.1.6 Document runtime (target: ~5-6 minutes)
  - [ ] 5.2 Increase to workers: 4
    - [ ] 5.2.1 Update playwright.config.ts to set workers: 4
    - [ ] 5.2.2 Run full test suite and measure runtime
    - [ ] 5.2.3 Verify 97/97 passing with workers: 4
    - [ ] 5.2.4 Run tests 3 times to check for flakiness
    - [ ] 5.2.5 Document runtime (target: ~2.5-3 minutes)
  - [ ] 5.3 Increase to workers: 6 (stretch goal)
    - [ ] 5.3.1 Update playwright.config.ts to set workers: 6
    - [ ] 5.3.2 Run full test suite and measure runtime
    - [ ] 5.3.3 Verify 97/97 passing with workers: 6
    - [ ] 5.3.4 Run tests 3 times to check for flakiness
    - [ ] 5.3.5 Document runtime (target: ~1.75-2 minutes)
  - [ ] 5.4 Determine optimal worker count
    - [ ] 5.4.1 Compare stability and performance across worker counts
    - [ ] 5.4.2 Choose optimal workers setting (likely 4 or 6)
    - [ ] 5.4.3 Update playwright.config.ts with final workers setting
  - [ ] 5.5 Final performance validation
    - [ ] 5.5.1 Run full test suite 5 times with final workers setting
    - [ ] 5.5.2 Verify 100% pass rate across all runs
    - [ ] 5.5.3 Document final runtime in BASELINE-METRICS.md
    - [ ] 5.5.4 Calculate performance improvement percentage
  - [ ] 5.6 Commit parallelization: "perf: enable parallel test execution with N workers"

- [ ] 6.0 Create Testing Documentation
  - [ ] 6.1 Create tests/e2e/README.md
    - [ ] 6.1.1 Add "Getting Started" section (how to run tests locally)
    - [ ] 6.1.2 Add "Running Tests" section (all, specific files, specific tests)
    - [ ] 6.1.3 Add "Test Structure" section (directory organization)
    - [ ] 6.1.4 Add "Helper Functions" section (overview of each helper module)
    - [ ] 6.1.5 Add "Writing New Tests" section (best practices, patterns)
    - [ ] 6.1.6 Add "Real-time Testing" section (how to test realtime updates)
    - [ ] 6.1.7 Add "Parallel Execution" section (how parallelization works, gotchas)
    - [ ] 6.1.8 Add "Troubleshooting" section (common issues and solutions)
  - [ ] 6.2 Create tests/e2e/TESTING_PATTERNS.md
    - [ ] 6.2.1 Add "CRUD Operations Template" with code example
    - [ ] 6.2.2 Add "Real-time Updates Template" with code example
    - [ ] 6.2.3 Add "Approval Workflow Template" with code example
    - [ ] 6.2.4 Add "Multi-user Interaction Template" with code example
  - [ ] 6.3 Update PARALLEL_SAFETY.md
    - [ ] 6.3.1 Document all parallel safety issues found
    - [ ] 6.3.2 Document all fixes applied
    - [ ] 6.3.3 Document any remaining limitations or serial-only tests
    - [ ] 6.3.4 Provide guidance for writing parallel-safe tests
  - [ ] 6.4 Verify helper JSDoc coverage
    - [ ] 6.4.1 Ensure all helpers have JSDoc comments
    - [ ] 6.4.2 Ensure all JSDoc includes usage examples
    - [ ] 6.4.3 Ensure parameter types and return types documented
  - [ ] 6.5 Commit documentation: "docs: create comprehensive E2E testing guide"

- [ ] 7.0 Final Validation and Metrics
  - [ ] 7.1 Run complete quality gate
    - [ ] 7.1.1 Run npm run build (zero errors)
    - [ ] 7.1.2 Run npm run lint (zero warnings/errors)
    - [ ] 7.1.3 Run npm run test (all unit tests pass)
    - [ ] 7.1.4 Run npx playwright test (all 97 E2E tests pass)
  - [ ] 7.2 Update BASELINE-METRICS.md with final results
    - [ ] 7.2.1 Add "After Refactoring" section with new metrics
    - [ ] 7.2.2 Document final runtime vs baseline (10.5 min → X min)
    - [ ] 7.2.3 Document pass rate improvement (95/97 → 97/97)
    - [ ] 7.2.4 Document LOC reduction (4,854 → X lines)
    - [ ] 7.2.5 Document worker count enabled (1 → N)
    - [ ] 7.2.6 Calculate improvement percentages
  - [ ] 7.3 Create final summary
    - [ ] 7.3.1 List all acceptance criteria from PRD
    - [ ] 7.3.2 Mark each as achieved or not achieved
    - [ ] 7.3.3 Document any known limitations or future improvements
  - [ ] 7.4 Commit final updates: "docs: update metrics with refactoring results"
  - [ ] 7.5 Create PR to main
    - [ ] 7.5.1 Write comprehensive PR description with before/after metrics
    - [ ] 7.5.2 Include links to AUDIT.md and BASELINE-METRICS.md
    - [ ] 7.5.3 Create PR from feature/e2e-test-refactoring to main
  - [ ] 7.6 Merge and cleanup
    - [ ] 7.6.1 Merge PR after review
    - [ ] 7.6.2 Delete feature branch
    - [ ] 7.6.3 Celebrate! 🎉
