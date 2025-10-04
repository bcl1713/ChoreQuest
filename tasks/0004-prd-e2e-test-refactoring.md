# PRD: End-to-End Test Suite Refactoring

## Introduction/Overview

The current end-to-end test suite for ChoreQuest has grown to cover all critical functionality (97 tests) but suffers from significant performance and maintainability issues. The full suite takes over 20 minutes to run, contains substantial code duplication (same actions executed hundreds of times), and lacks standardized patterns for testing real-time features.

This refactoring effort will optimize the test suite to run in under 10 minutes while maintaining complete test coverage, eliminating all uses of `waitForTimeout` and `page.reload()`, and establishing reusable utilities and patterns that make tests easier to write and maintain.

**Problem Statement:** Test suite runtime is too long (20+ minutes), contains heavy duplication in setup/navigation/data creation, and lacks consistent patterns for real-time testing. This slows development velocity and makes test maintenance difficult.

**Goal:** Create a fast (<10 minutes), maintainable, and reliable E2E test suite with zero anti-patterns and comprehensive reusable utilities.

## Goals

1. **Reduce test execution time** from 20+ minutes to under 10 minutes (ideally 5-8 minutes)
2. **Eliminate all anti-patterns**: Zero uses of `waitForTimeout` or `page.reload()`
3. **Reduce code duplication** by extracting common setup, navigation, and assertion patterns
4. **Improve test reliability** with consistent real-time update testing patterns
5. **Maintain 100% of current test coverage** - all 97 tests must still pass
6. **Create reusable utilities** that make writing new tests faster and easier
7. **Establish testing best practices** with clear patterns for future test development

## User Stories

1. **As a developer**, I want tests to run in under 10 minutes so I can get faster feedback during development
2. **As a developer**, I want reusable test helpers so I don't have to duplicate setup code for every test
3. **As a developer**, I want consistent real-time testing patterns so I know the right way to test Supabase realtime updates
4. **As a developer**, I want to run tests in parallel so I can take advantage of multi-core systems
5. **As a QA engineer**, I want reliable tests without flaky timeouts so CI/CD pipelines are trustworthy
6. **As a new contributor**, I want clear test patterns to follow so I can write good tests without guessing

## Functional Requirements

### 1. Test Utilities & Helpers

**FR-1.1:** Create a `test-helpers/` directory containing reusable test utilities organized by concern:
- `auth-helpers.ts` - Login, signup, family creation/joining
- `character-helpers.ts` - Character creation, stat manipulation
- `quest-helpers.ts` - Quest template/instance creation, completion workflows
- `reward-helpers.ts` - Reward creation, redemption workflows
- `navigation-helpers.ts` - Common navigation patterns
- `realtime-helpers.ts` - Real-time update assertions and state watching
- `assertions.ts` - Custom assertions for common ChoreQuest patterns
- `fixtures.ts` - Pre-configured test data (users, families, characters)

**FR-1.2:** Each helper function must:
- Accept a Playwright `Page` object as first parameter
- Use explicit waits (e.g., `waitForSelector`, `waitForResponse`) instead of `waitForTimeout`
- Return meaningful data (e.g., created user ID, character stats)
- Include JSDoc comments explaining parameters and usage

**FR-1.3:** Create custom Playwright assertions for common patterns:
- `expectRealtimeUpdate(page, selector, expectedText)` - Wait for real-time DOM change
- `expectCharacterStats(page, { gold, xp, level })` - Assert character state
- `expectQuestStatus(page, questName, status)` - Assert quest in specific status
- `expectToastMessage(page, message)` - Wait for and verify toast notifications

**FR-1.4:** Create test fixtures for common scenarios:
- `setupFamilyWithGM()` - Family with one Guild Master
- `setupFamilyWithMultipleGMs()` - Family with co-parent Guild Masters
- `setupFamilyWithHeroes()` - Family with GM and 2-3 hero characters
- `setupQuestWorkflow()` - Family with active quest templates and instances
- `setupRewardStore()` - Family with active rewards ready for redemption

### 2. Real-Time Testing Patterns

**FR-2.1:** Standardize real-time update testing with a `waitForRealtimeChange` helper:
```typescript
async function waitForRealtimeChange(
  page: Page,
  selector: string,
  getCurrentValue: () => Promise<string>,
  options?: { timeout?: number }
): Promise<string>
```

**FR-2.2:** The helper must:
- Capture the current state before the change
- Wait for the DOM element to update (using `waitForFunction` or `waitForSelector` with state)
- Verify the new state is different from the old state
- Return the new state for assertions

**FR-2.3:** Create specialized real-time helpers:
- `waitForCharacterStatsUpdate(page)` - Watch character gold/XP/level changes
- `waitForQuestStatusUpdate(page, questName)` - Watch quest status changes
- `waitForNewItemInList(page, listSelector)` - Watch for new list items (quests, rewards, templates)
- `waitForItemRemoved(page, listSelector, itemName)` - Watch for list item removal

**FR-2.4:** Real-time tests must use two browser contexts or pages to simulate multi-user scenarios without page reloads.

### 3. Test Organization & Structure

**FR-3.1:** Reorganize tests into logical feature directories:
```
e2e/
├── core/
│   ├── auth.spec.ts
│   └── family-management.spec.ts
├── characters/
│   ├── character-creation.spec.ts
│   └── character-progression.spec.ts
├── quests/
│   ├── quest-templates.spec.ts
│   ├── quest-instances.spec.ts
│   └── quest-workflow.spec.ts
├── rewards/
│   ├── reward-management.spec.ts
│   ├── reward-redemption.spec.ts
│   └── reward-approval.spec.ts
├── admin/
│   ├── admin-dashboard.spec.ts
│   └── guild-master-management.spec.ts
├── realtime/
│   ├── quest-realtime.spec.ts
│   ├── reward-realtime.spec.ts
│   ├── template-realtime.spec.ts
│   └── character-realtime.spec.ts
└── helpers/
    ├── auth-helpers.ts
    ├── character-helpers.ts
    ├── quest-helpers.ts
    ├── reward-helpers.ts
    ├── navigation-helpers.ts
    ├── realtime-helpers.ts
    ├── assertions.ts
    └── fixtures.ts
```

**FR-3.2:** Each test file must focus on a single feature area with clear test descriptions.

**FR-3.3:** Use Playwright's `test.describe.configure({ mode: 'parallel' })` for independent tests within a file.

**FR-3.4:** Use `test.beforeEach` and `test.afterEach` hooks efficiently:
- Avoid creating unnecessary data in beforeEach if tests don't all need it
- Use fixtures instead of beforeEach when tests need different starting states

### 4. Performance Optimizations

**FR-4.1:** Maximize test parallelization:
- Configure Playwright to run tests in parallel across multiple workers
- Ensure tests are isolated and don't depend on each other
- Use separate database state per worker (Supabase handles this naturally)

**FR-4.2:** Optimize common operations:
- Cache authentication tokens when safe to reuse
- Use more specific selectors (data-testid, role-based) for faster element location
- Avoid unnecessary navigation - stay on same page when possible

**FR-4.3:** Reduce test data creation:
- Use fixtures that create minimal required data
- Reuse read-only test data across tests when safe
- Clean up only data that was created, not entire database

**FR-4.4:** Use network request interception strategically:
- Wait for specific API calls to complete instead of UI changes when appropriate
- Verify real-time updates via WebSocket messages when faster than DOM checking

### 5. Anti-Pattern Elimination

**FR-5.1:** Remove all uses of `page.waitForTimeout()`:
- Replace with `page.waitForSelector()` with specific state
- Replace with `page.waitForResponse()` for network requests
- Replace with custom `waitForRealtimeChange()` for real-time updates
- Replace with `page.waitForFunction()` for complex state checks

**FR-5.2:** Remove all uses of `page.reload()`:
- Use real-time update assertions instead
- Use navigation to same page if absolutely necessary
- Use browser context switching for multi-user scenarios

**FR-5.3:** Avoid brittle selectors:
- Prefer `data-testid` attributes over CSS classes
- Prefer `role` and accessibility selectors over generic selectors
- Add `data-testid` attributes to application code where needed for testability

### 6. Documentation & Standards

**FR-6.1:** Create `e2e/README.md` documenting:
- How to run tests locally
- How to run specific test suites
- Available helper functions and when to use them
- Real-time testing patterns with examples
- How to write new tests following established patterns
- Performance tips and best practices

**FR-6.2:** Add JSDoc comments to all helper functions with:
- Purpose description
- Parameter explanations with types
- Return value description
- Usage examples

**FR-6.3:** Create example test templates in documentation:
- Template for testing CRUD operations
- Template for testing real-time updates
- Template for testing approval workflows
- Template for testing multi-user interactions

## Non-Goals (Out of Scope)

1. **Adding new test cases** - This refactoring focuses on existing 97 tests, not expanding coverage
2. **Changing testing framework** - Will keep Playwright as the E2E testing framework
3. **Modifying application code** - Only test code will be changed (except adding data-testid attributes if needed)
4. **Application performance optimization** - Focus is on test performance, not app performance
5. **Unit test refactoring** - Only E2E tests are in scope
6. **Visual regression testing** - Not adding screenshot comparison or visual testing
7. **CI/CD pipeline changes** - Pipeline configuration is separate from test refactoring

## Design Considerations

### Test Helper Architecture

```typescript
// Example: auth-helpers.ts
export async function loginAsGuildMaster(
  page: Page,
  familyName?: string
): Promise<{ userId: string; familyId: string }> {
  // Implementation using explicit waits
}

export async function createFamilyAndLogin(
  page: Page,
  familyName: string
): Promise<{ userId: string; familyId: string; characterId: string }> {
  // Implementation
}

// Example: realtime-helpers.ts
export async function waitForRealtimeChange<T>(
  page: Page,
  selector: string,
  getCurrentValue: () => Promise<T>,
  options?: { timeout?: number; expectedValue?: T }
): Promise<T> {
  const initialValue = await getCurrentValue();

  await page.waitForFunction(
    async ({ sel, initial }) => {
      const element = document.querySelector(sel);
      return element?.textContent !== initial;
    },
    { selector, initial: initialValue },
    { timeout: options?.timeout ?? 5000 }
  );

  const newValue = await getCurrentValue();
  if (options?.expectedValue !== undefined) {
    expect(newValue).toBe(options.expectedValue);
  }
  return newValue;
}
```

### Test Organization Strategy

- **Feature-based organization**: Group tests by feature area (quests, rewards, admin)
- **Separate real-time tests**: Real-time tests in dedicated directory due to unique patterns
- **Shared helpers**: All helpers in `e2e/helpers/` for easy discovery and reuse
- **Parallel execution**: Configure tests to run in parallel where safe

### Data-Testid Naming Convention

Add `data-testid` attributes to application components following pattern:
- `{feature}-{component}-{element}` (e.g., `quest-card-complete-button`)
- `{page}-{section}-{element}` (e.g., `dashboard-stats-gold-amount`)
- List items: `{feature}-item-{identifier}` (e.g., `quest-item-sweep-kitchen`)

## Technical Considerations

### Playwright Configuration

- **Workers**: Increase parallel workers to 4-8 depending on available CPU cores
- **Retries**: Configure retry strategy (1-2 retries for flaky tests)
- **Timeout**: Set reasonable global timeout (30 seconds) with ability to override per test
- **Browsers**: Consider if all tests need to run on all browsers or if some can be Chromium-only

### Supabase Real-time Testing

- Real-time updates are asynchronous and may have slight delays
- Use `page.waitForFunction()` to poll for changes within timeout window
- Consider using Supabase client's event listeners in tests for more reliable real-time assertions
- Ensure tests clean up real-time subscriptions to prevent memory leaks

### Test Isolation

- Each test must be independently runnable
- Use Supabase's RLS (Row Level Security) to ensure data isolation between test workers
- Consider using different family contexts per test to avoid conflicts
- Clean up test data in afterEach hooks to prevent test pollution

### Database Performance

- Test database should be optimized with proper indexes
- Consider using database connection pooling if test parallelization causes connection issues
- Monitor for N+1 query issues that might slow down test data creation

## Success Metrics

### Primary Metrics

1. **Test Suite Runtime**: Total time to run all 97 tests
   - Current: ~20+ minutes
   - Target: <10 minutes
   - Stretch goal: 5-8 minutes

2. **Anti-Pattern Elimination**: Count of bad practices
   - `waitForTimeout` calls: 0
   - `page.reload()` calls: 0
   - Generic selectors without data-testid: <10%

3. **Code Duplication**: Lines of duplicated test code
   - Target: Reduce by 50-70% through helper extraction
   - Measure: Total lines in test files before/after

4. **Test Reliability**: Test pass rate
   - Current: Should be 100% (97/97 passing)
   - Target: Maintain 100% with no flaky tests
   - CI runs should pass consistently without retries

### Secondary Metrics

5. **Helper Function Coverage**: Percentage of tests using shared helpers
   - Target: >80% of tests use at least one helper function

6. **Test Maintainability**: Time to write a new test
   - Target: Reduce by 40-50% using templates and helpers

7. **Documentation Quality**:
   - All helpers have JSDoc comments
   - README exists with usage examples
   - At least 3 test templates documented

## Implementation Phases

### Phase 1: Analysis & Planning (Estimated: 2-4 hours)
1. Audit current test suite to identify duplication patterns
2. Categorize tests by feature area for reorganization
3. Identify most common operations for helper extraction
4. Document current test runtime baseline per file

### Phase 2: Helper & Utility Creation (Estimated: 4-6 hours)
1. Create `e2e/helpers/` directory structure
2. Implement auth helpers (login, signup, family creation)
3. Implement character helpers (creation, stat updates)
4. Implement quest helpers (template/instance creation, workflows)
5. Implement reward helpers (creation, redemption, approval)
6. Implement real-time helpers (waitForRealtimeChange, specialized watchers)
7. Implement custom assertions
8. Create test fixtures for common scenarios

### Phase 3: Test Reorganization (Estimated: 4-6 hours)
1. Create new directory structure
2. Move tests to appropriate feature directories
3. Rename test files for clarity if needed
4. Update imports and references

### Phase 4: Test Refactoring (Estimated: 8-12 hours)
1. Refactor auth tests to use helpers
2. Refactor quest tests to use helpers
3. Refactor reward tests to use helpers
4. Refactor admin tests to use helpers
5. Refactor real-time tests to use new patterns
6. Replace all `waitForTimeout` with proper waits
7. Remove all `page.reload()` calls
8. Add `data-testid` attributes to app code where needed

### Phase 5: Performance Optimization (Estimated: 4-6 hours)
1. Configure Playwright for maximum parallelization
2. Optimize test data creation
3. Optimize selectors for speed
4. Add network interception where beneficial
5. Measure and profile test runtime improvements

### Phase 6: Documentation & Validation (Estimated: 2-4 hours)
1. Create `e2e/README.md` with usage guide
2. Add JSDoc comments to all helpers
3. Create test templates and examples
4. Run full test suite to verify all 97 tests pass
5. Measure final performance metrics
6. Document performance improvements

**Total Estimated Time: 24-38 hours**

## Open Questions

1. **Playwright Configuration**: What's the current Playwright config? How many workers are currently configured?

2. **CI/CD Environment**: How many CPU cores available in CI environment for parallel test execution?

3. **Test Data Strategy**: Should we seed a persistent test database with read-only data, or create fresh data per test run?

4. **Real-time Helper Patterns**: User mentioned creating some real-time helpers already - can we review these to determine if they should be standardized or improved?

5. **Browser Coverage**: Do all tests need to run on all browsers (Chromium, Firefox, WebKit) or can we optimize by running most tests on Chromium only?

6. **Flaky Tests**: Are there any currently flaky tests that fail intermittently? These should be identified and fixed as part of refactoring.

7. **Test Reporting**: What test reporting format is preferred? Do we need HTML reports, JSON output, or integration with specific tools?

8. **Application Changes**: How much flexibility do we have to add `data-testid` attributes to the application code for better testability?

## Acceptance Criteria

This refactoring is complete when:

- ✅ All 97 existing tests still pass consistently
- ✅ Test suite runs in under 10 minutes (target: 5-8 minutes)
- ✅ Zero uses of `waitForTimeout` in any test file
- ✅ Zero uses of `page.reload()` in any test file
- ✅ All common operations extracted to helper functions in `e2e/helpers/`
- ✅ Real-time testing uses standardized `waitForRealtimeChange` patterns
- ✅ Tests organized by feature area in logical directory structure
- ✅ All helpers have JSDoc documentation
- ✅ `e2e/README.md` exists with comprehensive usage guide
- ✅ At least 3 test templates documented with examples
- ✅ Playwright configured for optimal parallel execution
- ✅ No flaky tests - all tests pass consistently across multiple runs
- ✅ Code duplication reduced by at least 50%

## Dependencies

- Playwright testing framework (already installed)
- Supabase client (for real-time testing patterns)
- TypeScript (for type-safe helpers)
- Current application codebase (may need minor data-testid additions)

## Risks & Mitigations

**Risk**: Breaking existing tests during refactoring
- **Mitigation**: Refactor incrementally, run tests frequently, use git branches

**Risk**: Performance improvements not meeting 10-minute target
- **Mitigation**: Profile tests to identify bottlenecks, consider more aggressive optimizations

**Risk**: Real-time tests still flaky after refactoring
- **Mitigation**: Implement retry logic, increase timeouts for real-time waits, investigate Supabase event reliability

**Risk**: Too much time spent on edge cases and diminishing returns
- **Mitigation**: Time-box each phase, focus on high-impact changes first, document remaining improvements for future work
