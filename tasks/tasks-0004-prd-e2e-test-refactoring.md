# Task List: E2E Test Suite Refactoring

## Current State Assessment

The ChoreQuest E2E test suite has:
- **20 test files** totaling ~4,854 lines in `tests/e2e/`
- **1 helper file** (`setup-helpers.ts`) with basic auth/setup functions
- **Playwright config** with `workers: 1` and `fullyParallel: false` (significant performance bottleneck)
- **Test runtime**: 20+ minutes for ~97 tests
- **Existing patterns**: Tests use `setupUserWithCharacter` and `loginUser` helpers
- **Realtime tests**: Already using two browser contexts pattern (good!)
- **No data-testid attributes** in most of the application code yet

### Key Observations

1. Tests already have some helper structure (`tests/e2e/helpers/setup-helpers.ts`)
2. Playwright is configured for single-worker sequential execution (major performance issue)
3. Test files are organized flat in `tests/e2e/` without feature grouping
4. User mentioned removing `waitForTimeout` already, but tests still slow
5. Common pattern: Each test creates new family/user from scratch (heavy duplication)

## Relevant Files

### Test Helper Files (To Be Created)
- `tests/e2e/helpers/auth-helpers.ts` - Extract and expand authentication flows from setup-helpers.ts
- `tests/e2e/helpers/character-helpers.ts` - Character creation, stat manipulation, level-up helpers
- `tests/e2e/helpers/quest-helpers.ts` - Quest template/instance creation, assignment, completion workflows
- `tests/e2e/helpers/reward-helpers.ts` - Reward creation, redemption, approval workflows
- `tests/e2e/helpers/navigation-helpers.ts` - Common navigation patterns (tabs, pages, modals)
- `tests/e2e/helpers/realtime-helpers.ts` - Standardized real-time update watchers and assertions
- `tests/e2e/helpers/assertions.ts` - Custom Playwright assertions for ChoreQuest patterns
- `tests/e2e/helpers/fixtures.ts` - Pre-configured test data generators and scenarios
- `tests/e2e/helpers/selectors.ts` - Centralized selector constants and utilities

### Test Organization (To Be Restructured)
- `tests/e2e/core/auth.spec.ts` - Authentication and family management (from family-management.spec.ts, family-joining.spec.ts)
- `tests/e2e/characters/character-creation.spec.ts` - Character creation flow (from character-creation.spec.ts)
- `tests/e2e/quests/quest-management.spec.ts` - Quest CRUD operations (from quest-system.spec.ts)
- `tests/e2e/quests/quest-workflow.spec.ts` - Quest assignment, completion, approval (from quest-pickup-management.spec.ts, quest-completion-rewards.spec.ts)
- `tests/e2e/quests/quest-templates.spec.ts` - Template management (from quest-template-*.spec.ts files)
- `tests/e2e/rewards/reward-management.spec.ts` - Reward CRUD operations (from reward-management.spec.ts)
- `tests/e2e/rewards/reward-store.spec.ts` - Reward display and redemption (from reward-store.spec.ts, hero-reward-display.spec.ts)
- `tests/e2e/rewards/reward-approval.spec.ts` - Reward redemption approval workflow (from reward-redemption-approval.spec.ts)
- `tests/e2e/admin/admin-dashboard.spec.ts` - Admin dashboard features (consolidate admin-*.spec.ts files)
- `tests/e2e/realtime/quest-realtime.spec.ts` - Quest real-time updates (from quest-template-realtime.spec.ts)
- `tests/e2e/realtime/reward-realtime.spec.ts` - Reward real-time updates (from reward-realtime.spec.ts)

### Existing Files To Modify
- `tests/e2e/helpers/setup-helpers.ts` - Refactor and split into specialized helpers
- `playwright.config.ts` - Update for parallelization and performance optimizations

### Documentation Files
- `tests/e2e/AUDIT.md` - **CREATED** - Detailed analysis of code patterns and duplication (2025-10-03)
- `tests/e2e/BASELINE-METRICS.md` - **CREATED** - Complete baseline metrics and success criteria (2025-10-03)
- `test-results-baseline.txt` - **CREATED** - Full test execution log (10.5 min, 95/97 passing)
- `tests/e2e/README.md` - Comprehensive testing guide with examples (to be created)
- `tests/e2e/docs/test-templates.md` - Example test templates for common patterns (to be created)

### Application Code (Minimal Changes)
- Add `data-testid` attributes to critical UI elements as needed for reliable selectors

### Notes
- Tests are currently run with single worker (`workers: 1`) - this is the biggest performance bottleneck
- Many test files can be consolidated (5 admin files → 1, 4 quest-template files → 1, etc.)
- Existing `setup-helpers.ts` provides a good starting point but needs expansion
- Real-time tests already use the two-context pattern correctly

## Tasks

- [x] 1.0 Audit Current Test Suite and Create Baseline Metrics
  - [x] 1.1 Run full test suite with timing enabled (`npx playwright test --reporter=line`) and capture total runtime
  - [x] 1.2 Generate test list with runtime per file (`npx playwright test --reporter=json > test-results-before.json`)
  - [x] 1.3 Analyze all 20 test files and identify common patterns (auth flows, quest creation, reward creation, etc.)
  - [x] 1.4 Count occurrences of each pattern (e.g., "creates family" appears in X tests, "creates quest" in Y tests)
  - [x] 1.5 Document top 10 most duplicated code blocks in a `AUDIT.md` file
  - [x] 1.6 Identify any remaining uses of `waitForTimeout` or `page.reload()` (should be zero per user)
  - [x] 1.7 Count current data-testid usage vs generic selectors (text(), role(), CSS classes)
  - [x] 1.8 Create baseline metrics document with current state (runtime, LOC, duplication %)

- [ ] 2.0 Create Comprehensive Test Helper Library
  - [ ] 2.1 Create `tests/e2e/helpers/auth-helpers.ts` with functions:
    - [ ] 2.1.1 `createFamilyAndLogin(page, familyName, options)` - Full signup flow returning user data
    - [ ] 2.1.2 `loginAsGuildMaster(page, email, password)` - Login existing GM user
    - [ ] 2.1.3 `joinExistingFamily(page, inviteCode, email, password, userName)` - Family joining flow
    - [ ] 2.1.4 `logout(page)` - Clear session and logout
    - [ ] 2.1.5 Add JSDoc comments to all functions
  - [ ] 2.2 Create `tests/e2e/helpers/character-helpers.ts` with functions:
    - [ ] 2.2.1 `createCharacter(page, name, characterClass)` - Complete character creation
    - [ ] 2.2.2 `getCharacterStats(page)` - Return { gold, xp, level } from UI
    - [ ] 2.2.3 `giveCharacterGoldViaQuest(page, amount)` - Award gold through quest completion
    - [ ] 2.2.4 `waitForCharacterStatsUpdate(page, expectedStats)` - Wait for stats to change
    - [ ] 2.2.5 Add JSDoc comments to all functions
  - [ ] 2.3 Create `tests/e2e/helpers/quest-helpers.ts` with functions:
    - [ ] 2.3.1 `createQuestTemplate(page, templateData)` - Create quest template
    - [ ] 2.3.2 `createQuestFromTemplate(page, templateName, assignTo?)` - Create quest instance
    - [ ] 2.3.3 `createCustomQuest(page, questData)` - Create custom quest directly
    - [ ] 2.3.4 `pickupQuest(page, questName)` - Accept/pickup a quest
    - [ ] 2.3.5 `completeQuest(page, questName)` - Mark quest as complete
    - [ ] 2.3.6 `approveQuest(page, questName)` - GM approves quest
    - [ ] 2.3.7 `denyQuest(page, questName)` - GM denies quest
    - [ ] 2.3.8 `getQuestStatus(page, questName)` - Return quest status from UI
    - [ ] 2.3.9 Add JSDoc comments to all functions
  - [ ] 2.4 Create `tests/e2e/helpers/reward-helpers.ts` with functions:
    - [ ] 2.4.1 `createReward(page, rewardData)` - Create reward with name, type, cost
    - [ ] 2.4.2 `redeemReward(page, rewardName)` - Redeem reward as hero
    - [ ] 2.4.3 `approveRewardRedemption(page, rewardName)` - GM approves redemption
    - [ ] 2.4.4 `denyRewardRedemption(page, rewardName)` - GM denies redemption
    - [ ] 2.4.5 `markRedemptionFulfilled(page, rewardName)` - GM marks as fulfilled
    - [ ] 2.4.6 `toggleRewardActive(page, rewardName)` - Activate/deactivate reward
    - [ ] 2.4.7 Add JSDoc comments to all functions
  - [ ] 2.5 Create `tests/e2e/helpers/navigation-helpers.ts` with functions:
    - [ ] 2.5.1 `navigateToDashboard(page)` - Go to main dashboard
    - [ ] 2.5.2 `navigateToAdmin(page)` - Go to admin page
    - [ ] 2.5.3 `switchToAdminTab(page, tabName)` - Switch admin dashboard tabs
    - [ ] 2.5.4 `openQuestCreationModal(page)` - Open quest creation modal
    - [ ] 2.5.5 `openRewardCreationModal(page)` - Open reward creation modal
    - [ ] 2.5.6 `closeModal(page)` - Close any open modal
    - [ ] 2.5.7 Add JSDoc comments to all functions
  - [ ] 2.6 Create `tests/e2e/helpers/realtime-helpers.ts` with functions:
    - [ ] 2.6.1 `waitForRealtimeChange(page, selector, getCurrentValue, options)` - Generic realtime watcher
    - [ ] 2.6.2 `waitForNewListItem(page, listSelector, expectedItemText)` - Wait for new item in list
    - [ ] 2.6.3 `waitForListItemRemoved(page, listSelector, itemText)` - Wait for item removal
    - [ ] 2.6.4 `waitForTextChange(page, selector, expectedText)` - Wait for specific text change
    - [ ] 2.6.5 `setupTwoContextTest(browser)` - Setup two browser contexts for realtime tests
    - [ ] 2.6.6 Add JSDoc comments to all functions
  - [ ] 2.7 Create `tests/e2e/helpers/assertions.ts` with custom assertions:
    - [ ] 2.7.1 `expectCharacterStats(page, { gold?, xp?, level? })` - Assert character stats match
    - [ ] 2.7.2 `expectQuestStatus(page, questName, status)` - Assert quest has specific status
    - [ ] 2.7.3 `expectRewardInStore(page, rewardName)` - Assert reward visible in store
    - [ ] 2.7.4 `expectToastMessage(page, message)` - Wait for and verify toast
    - [ ] 2.7.5 Add JSDoc comments to all functions
  - [ ] 2.8 Create `tests/e2e/helpers/fixtures.ts` with fixture generators:
    - [ ] 2.8.1 `setupFamilyWithGM(page)` - Create family with one Guild Master
    - [ ] 2.8.2 `setupFamilyWithMultipleGMs(page)` - Create family with 2 GMs
    - [ ] 2.8.3 `setupFamilyWithHeroes(page, heroCount)` - Create family with GM and heroes
    - [ ] 2.8.4 `setupQuestWorkflow(page)` - Create family with templates and active quests
    - [ ] 2.8.5 `setupRewardStore(page)` - Create family with active rewards
    - [ ] 2.8.6 Add JSDoc comments to all functions
  - [ ] 2.9 Create `tests/e2e/helpers/selectors.ts` with selector constants:
    - [ ] 2.9.1 Define AUTH_SELECTORS object (login button, signup fields, etc.)
    - [ ] 2.9.2 Define QUEST_SELECTORS object (quest cards, modals, buttons)
    - [ ] 2.9.3 Define REWARD_SELECTORS object (reward cards, redemption buttons)
    - [ ] 2.9.4 Define ADMIN_SELECTORS object (admin tabs, management sections)
    - [ ] 2.9.5 Export all selector constants

- [ ] 3.0 Reorganize Tests by Feature Area
  - [ ] 3.1 Create new directory structure:
    - [ ] 3.1.1 `mkdir -p tests/e2e/core`
    - [ ] 3.1.2 `mkdir -p tests/e2e/characters`
    - [ ] 3.1.3 `mkdir -p tests/e2e/quests`
    - [ ] 3.1.4 `mkdir -p tests/e2e/rewards`
    - [ ] 3.1.5 `mkdir -p tests/e2e/admin`
    - [ ] 3.1.6 `mkdir -p tests/e2e/realtime`
  - [ ] 3.2 Consolidate and move auth tests:
    - [ ] 3.2.1 Merge `family-management.spec.ts` and `family-joining.spec.ts` into `core/auth.spec.ts`
    - [ ] 3.2.2 Update imports to use new helper paths
    - [ ] 3.2.3 Run tests to verify they still pass
  - [ ] 3.3 Move character tests:
    - [ ] 3.3.1 Move `character-creation.spec.ts` to `characters/character-creation.spec.ts`
    - [ ] 3.3.2 Update imports to use new helper paths
    - [ ] 3.3.3 Run tests to verify they still pass
  - [ ] 3.4 Consolidate and move quest tests:
    - [ ] 3.4.1 Move `quest-system.spec.ts` to `quests/quest-management.spec.ts`
    - [ ] 3.4.2 Merge `quest-pickup-management.spec.ts` and `quest-completion-rewards.spec.ts` into `quests/quest-workflow.spec.ts`
    - [ ] 3.4.3 Merge `quest-template-creation.spec.ts`, `quest-template-full-workflow.spec.ts`, and `quest-template-management.spec.ts` into `quests/quest-templates.spec.ts`
    - [ ] 3.4.4 Update all imports and run tests
  - [ ] 3.5 Consolidate and move reward tests:
    - [ ] 3.5.1 Move `reward-management.spec.ts` to `rewards/reward-management.spec.ts`
    - [ ] 3.5.2 Merge `reward-store.spec.ts` and `hero-reward-display.spec.ts` into `rewards/reward-store.spec.ts`
    - [ ] 3.5.3 Move `reward-redemption-approval.spec.ts` to `rewards/reward-approval.spec.ts`
    - [ ] 3.5.4 Update all imports and run tests
  - [ ] 3.6 Consolidate and move admin tests:
    - [ ] 3.6.1 Merge all `admin-*.spec.ts` files into `admin/admin-dashboard.spec.ts`
    - [ ] 3.6.2 Organize tests by admin feature (access, tabs, GM management, statistics, activity feed)
    - [ ] 3.6.3 Update imports and run tests
  - [ ] 3.7 Move realtime tests:
    - [ ] 3.7.1 Move `quest-template-realtime.spec.ts` to `realtime/quest-realtime.spec.ts`
    - [ ] 3.7.2 Move `reward-realtime.spec.ts` to `realtime/reward-realtime.spec.ts`
    - [ ] 3.7.3 Update imports and run tests
  - [ ] 3.8 Delete old test files after verification:
    - [ ] 3.8.1 Verify all tests pass in new locations
    - [ ] 3.8.2 Delete remaining files in `tests/e2e/*.spec.ts` (should be empty except organized subdirs)
    - [ ] 3.8.3 Commit reorganization: `git add tests/e2e && git commit -m "refactor: reorganize E2E tests by feature area"`

- [ ] 4.0 Refactor Tests to Use Helper Functions
  - [ ] 4.1 Refactor core/auth tests:
    - [ ] 4.1.1 Replace manual family creation with `createFamilyAndLogin` helper
    - [ ] 4.1.2 Replace manual login flows with `loginAsGuildMaster` helper
    - [ ] 4.1.3 Replace family joining code with `joinExistingFamily` helper
    - [ ] 4.1.4 Run tests and verify all pass
  - [ ] 4.2 Refactor character tests:
    - [ ] 4.2.1 Replace character creation code with `createCharacter` helper
    - [ ] 4.2.2 Use `getCharacterStats` for stat assertions
    - [ ] 4.2.3 Run tests and verify all pass
  - [ ] 4.3 Refactor quest management tests:
    - [ ] 4.3.1 Replace quest creation code with `createQuestTemplate` and `createCustomQuest` helpers
    - [ ] 4.3.2 Use navigation helpers for modal operations
    - [ ] 4.3.3 Use selector constants from `selectors.ts`
    - [ ] 4.3.4 Run tests and verify all pass
  - [ ] 4.4 Refactor quest workflow tests:
    - [ ] 4.4.1 Replace quest pickup code with `pickupQuest` helper
    - [ ] 4.4.2 Replace quest completion code with `completeQuest` and `approveQuest` helpers
    - [ ] 4.4.3 Use `giveCharacterGoldViaQuest` for gold awards
    - [ ] 4.4.4 Use `expectCharacterStats` for stat assertions
    - [ ] 4.4.5 Run tests and verify all pass
  - [ ] 4.5 Refactor quest template tests:
    - [ ] 4.5.1 Replace template creation code with `createQuestTemplate` helper
    - [ ] 4.5.2 Replace quest-from-template code with `createQuestFromTemplate` helper
    - [ ] 4.5.3 Use navigation helpers for template management UI
    - [ ] 4.5.4 Run tests and verify all pass
  - [ ] 4.6 Refactor reward management tests:
    - [ ] 4.6.1 Replace reward creation code with `createReward` helper
    - [ ] 4.6.2 Use `toggleRewardActive` for activation/deactivation
    - [ ] 4.6.3 Use navigation helpers for reward modals
    - [ ] 4.6.4 Run tests and verify all pass
  - [ ] 4.7 Refactor reward store tests:
    - [ ] 4.7.1 Replace reward redemption code with `redeemReward` helper
    - [ ] 4.7.2 Use `expectRewardInStore` for reward visibility assertions
    - [ ] 4.7.3 Use `giveCharacterGoldViaQuest` to setup gold for redemptions
    - [ ] 4.7.4 Run tests and verify all pass
  - [ ] 4.8 Refactor reward approval tests:
    - [ ] 4.8.1 Replace approval code with `approveRewardRedemption` and `denyRewardRedemption` helpers
    - [ ] 4.8.2 Use `markRedemptionFulfilled` helper for fulfillment workflow
    - [ ] 4.8.3 Run tests and verify all pass
  - [ ] 4.9 Refactor admin dashboard tests:
    - [ ] 4.9.1 Use `navigateToAdmin` and `switchToAdminTab` helpers
    - [ ] 4.9.2 Use selector constants for admin UI elements
    - [ ] 4.9.3 Replace setup code with fixtures (`setupFamilyWithMultipleGMs`, etc.)
    - [ ] 4.9.4 Run tests and verify all pass
  - [ ] 4.10 Refactor realtime tests:
    - [ ] 4.10.1 Replace manual two-context setup with `setupTwoContextTest` helper
    - [ ] 4.10.2 Replace custom wait logic with `waitForRealtimeChange` and `waitForNewListItem` helpers
    - [ ] 4.10.3 Use `waitForTextChange` for realtime text updates
    - [ ] 4.10.4 Run tests and verify all pass
  - [ ] 4.11 Add data-testid attributes to application code:
    - [ ] 4.11.1 Add data-testid to quest cards, buttons, and modals
    - [ ] 4.11.2 Add data-testid to reward cards, buttons, and modals
    - [ ] 4.11.3 Add data-testid to admin dashboard sections and tabs
    - [ ] 4.11.4 Add data-testid to character stats display
    - [ ] 4.11.5 Update tests to use new data-testid selectors
    - [ ] 4.11.6 Run all tests to verify selectors work
  - [ ] 4.12 Run full test suite and fix any issues:
    - [ ] 4.12.1 Run `npx playwright test` and capture results
    - [ ] 4.12.2 Fix any failing tests due to refactoring
    - [ ] 4.12.3 Ensure all 97 tests still pass
    - [ ] 4.12.4 Commit refactoring: `git add . && git commit -m "refactor: migrate all tests to use helper functions"`

- [ ] 5.0 Configure Playwright for Maximum Performance
  - [ ] 5.1 Update `playwright.config.ts`:
    - [ ] 5.1.1 Change `fullyParallel: false` to `fullyParallel: true`
    - [ ] 5.1.2 Change `workers: 1` to `workers: process.env.CI ? 4 : 6` (adjust based on CPU cores)
    - [ ] 5.1.3 Add `test.describe.configure({ mode: 'parallel' })` to independent test groups
    - [ ] 5.1.4 Reduce `navigationTimeout` from 30000 to 15000 if tests are faster with helpers
    - [ ] 5.1.5 Reduce `actionTimeout` from 10000 to 5000 if tests are faster with helpers
  - [ ] 5.2 Configure test isolation:
    - [ ] 5.2.1 Ensure each test creates unique family (already done via timestamp in helpers)
    - [ ] 5.2.2 Verify Supabase RLS properly isolates test data between families
    - [ ] 5.2.3 Add cleanup in afterEach hooks if needed (or rely on family isolation)
  - [ ] 5.3 Optimize test execution order:
    - [ ] 5.3.1 Use `test.describe.configure({ mode: 'serial' })` only for tests that must run sequentially
    - [ ] 5.3.2 Mark independent tests with `test.describe.configure({ mode: 'parallel' })`
    - [ ] 5.3.3 Group related tests that can share setup in same describe block
  - [ ] 5.4 Test parallelization:
    - [ ] 5.4.1 Run tests with `workers: 2` and verify all pass
    - [ ] 5.4.2 Run tests with `workers: 4` and verify all pass
    - [ ] 5.4.3 Run tests with `workers: 6` and measure performance
    - [ ] 5.4.4 Find optimal worker count for best performance without failures
  - [ ] 5.5 Commit performance config: `git add playwright.config.ts && git commit -m "perf: enable parallel test execution"`

- [ ] 6.0 Create Documentation and Test Templates
  - [ ] 6.1 Create `tests/e2e/README.md`:
    - [ ] 6.1.1 Add "Getting Started" section with setup instructions
    - [ ] 6.1.2 Add "Running Tests" section (all tests, single file, single test)
    - [ ] 6.1.3 Add "Test Structure" section explaining directory organization
    - [ ] 6.1.4 Add "Helper Functions" section documenting each helper file and key functions
    - [ ] 6.1.5 Add "Real-time Testing" section with examples of waitForRealtimeChange usage
    - [ ] 6.1.6 Add "Writing New Tests" section with best practices
    - [ ] 6.1.7 Add "Performance Tips" section (parallelization, fixtures, selectors)
    - [ ] 6.1.8 Add "Troubleshooting" section for common issues
  - [ ] 6.2 Create `tests/e2e/docs/test-templates.md`:
    - [ ] 6.2.1 Add "CRUD Operations Template" with example test
    - [ ] 6.2.2 Add "Real-time Updates Template" with two-context example
    - [ ] 6.2.3 Add "Approval Workflow Template" with GM approval flow example
    - [ ] 6.2.4 Add "Multi-user Interaction Template" with family joining example
  - [ ] 6.3 Add JSDoc examples to key helpers:
    - [ ] 6.3.1 Add usage examples to auth-helpers.ts functions
    - [ ] 6.3.2 Add usage examples to quest-helpers.ts functions
    - [ ] 6.3.3 Add usage examples to reward-helpers.ts functions
    - [ ] 6.3.4 Add usage examples to realtime-helpers.ts functions
  - [ ] 6.4 Commit documentation: `git add tests/e2e/*.md tests/e2e/docs && git commit -m "docs: add E2E testing guide and templates"`

- [ ] 7.0 Validation and Performance Measurement
  - [ ] 7.1 Run full test suite and measure improvements:
    - [ ] 7.1.1 Run `npx playwright test --reporter=line` and capture total runtime
    - [ ] 7.1.2 Generate test results: `npx playwright test --reporter=json > test-results-after.json`
    - [ ] 7.1.3 Compare runtime before vs after (target: <10 minutes, stretch: 5-8 minutes)
    - [ ] 7.1.4 Verify all 97 tests still pass (100% pass rate)
  - [ ] 7.2 Measure code quality improvements:
    - [ ] 7.2.1 Count total lines of code in test files (before: ~4,854, target: reduce by 30-50%)
    - [ ] 7.2.2 Verify zero uses of `waitForTimeout` in test files
    - [ ] 7.2.3 Verify zero uses of `page.reload()` in test files
    - [ ] 7.2.4 Count helper function usage (target: >80% of tests use at least one helper)
    - [ ] 7.2.5 Count data-testid selectors vs generic selectors (target: >90% use data-testid)
  - [ ] 7.3 Run tests multiple times to check for flakiness:
    - [ ] 7.3.1 Run full suite 3 times in a row
    - [ ] 7.3.2 Identify any tests that fail intermittently
    - [ ] 7.3.3 Fix flaky tests with better waits or selectors
    - [ ] 7.3.4 Re-run until 3 consecutive full passes
  - [ ] 7.4 Create final metrics report:
    - [ ] 7.4.1 Document runtime improvement (before/after)
    - [ ] 7.4.2 Document code reduction (LOC, duplication %)
    - [ ] 7.4.3 Document test reliability (pass rate, flaky tests fixed)
    - [ ] 7.4.4 Document helper adoption (% of tests using helpers)
    - [ ] 7.4.5 Save report as `tests/e2e/REFACTORING_RESULTS.md`
  - [ ] 7.5 Update TASKS.md:
    - [ ] 7.5.1 Mark E2E test refactoring as complete
    - [ ] 7.5.2 Add results summary to TASKS.md
    - [ ] 7.5.3 Document any follow-up improvements for future work
  - [ ] 7.6 Final commit and PR:
    - [ ] 7.6.1 Run all quality gates (build, lint, unit tests, E2E tests)
    - [ ] 7.6.2 Commit final changes: `git add . && git commit -m "feat: E2E test suite refactoring complete"`
    - [ ] 7.6.3 Push branch and create PR with results summary
    - [ ] 7.6.4 Merge PR after review
