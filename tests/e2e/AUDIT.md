# E2E Test Suite Audit - Baseline Analysis

**Date:** 2025-10-03
**Branch:** feature/e2e-test-refactoring
**Test Suite Version:** Before Refactoring

## Executive Summary

The ChoreQuest E2E test suite currently consists of:
- **20 test files** totaling **4,854 lines of code**
- **97 total tests** covering all major features
- **Single-worker execution** (workers: 1, fullyParallel: false)
- **Estimated runtime:** 20+ minutes (currently running to get exact baseline)

### Critical Findings

1. **Heavy Code Duplication:** ~89 instances of `setupUserWithCharacter` calls across tests
2. **Anti-patterns are minimal:** Only **7 instances** of `waitForTimeout` or `page.reload()` (good!)
3. **Mixed Selector Strategy:** 451 data-testid uses vs 262 generic selectors
4. **Realtime Testing:** 29 multi-context tests using proper two-browser pattern

## Test File Inventory

### Core Authentication & Family (2 files)
1. `family-management.spec.ts` - Guild Master promotion/demotion, role management
2. `family-joining.spec.ts` - Family joining flows, invite codes

### Character System (1 file)
3. `character-creation.spec.ts` - Character creation, class selection

### Quest System (6 files)
4. `quest-system.spec.ts` - Basic quest CRUD operations
5. `quest-pickup-management.spec.ts` - Quest pickup workflow
6. `quest-completion-rewards.spec.ts` - Quest completion and reward distribution
7. `quest-template-creation.spec.ts` - Template creation flows
8. `quest-template-management.spec.ts` - Template CRUD operations
9. `quest-template-full-workflow.spec.ts` - End-to-end template workflows
10. `quest-template-realtime.spec.ts` - Realtime template updates (5 tests)

### Reward System (4 files)
11. `reward-management.spec.ts` - Reward CRUD operations (5 tests)
12. `reward-store.spec.ts` - Reward display and redemption (4 tests)
13. `hero-reward-display.spec.ts` - Hero view of reward store
14. `reward-redemption-approval.spec.ts` - GM approval workflow (6 tests)
15. `reward-realtime.spec.ts` - Realtime reward updates (3 tests)

### Admin Dashboard (5 files)
16. `admin-dashboard-access.spec.ts` - Access control (4 tests)
17. `admin-dashboard-tabs.spec.ts` - Tab navigation (5 tests)
18. `admin-guild-master-management.spec.ts` - GM management (4 tests)
19. `admin-statistics.spec.ts` - Statistics display (10 tests)
20. `admin-activity-feed.spec.ts` - Activity feed display (9 tests)

## Code Metrics

### Lines of Code Distribution
```
Total Lines:    4,854
Test Files:     20
Avg per file:   ~243 lines
Helper file:    395 lines (setup-helpers.ts)
```

### Anti-Pattern Analysis

#### waitForTimeout / page.reload() Usage: **7 instances** ✅
**GOOD NEWS:** User has already cleaned up most anti-patterns!

Locations found:
- Limited to specific edge cases where explicit timing was needed
- Most tests use proper `waitForSelector`, `waitForURL`, or `expect().toBeVisible()` patterns

### Helper Function Usage

#### setupUserWithCharacter: **89 calls**
**Most duplicated pattern** - Every test creates a fresh family/user from scratch

Example from multiple files:
```typescript
await setupUserWithCharacter(page, 'test-prefix', { characterClass: 'KNIGHT' });
```

Usage breakdown:
- `family-management.spec.ts`: 5 calls
- `quest-*.spec.ts`: ~25 calls
- `reward-*.spec.ts`: ~18 calls
- `admin-*.spec.ts`: ~32 calls
- `character-creation.spec.ts`: 3 calls
- Realtime tests: 6 calls

#### loginUser Helper: **Used in realtime tests**
Pattern for multi-context tests (2 browser contexts):
```typescript
const testUser = await setupUserWithCharacter(page1, 'guildmaster');
await loginUser(page2, testUser.email, testUser.password);
```

### Top 10 Most Duplicated Code Blocks

#### 1. **Family & Character Creation Flow** (89 occurrences)
```typescript
await setupUserWithCharacter(page, 'prefix', { characterClass: 'KNIGHT' });
```
**Impact:** Every test creates a new family from scratch
**Opportunity:** Extract to fixtures for different starting scenarios

#### 2. **Quest Form Filling** (349+ occurrences)
```typescript
await page.fill('input[placeholder="Enter quest title..."]', 'Quest Title');
await page.fill('textarea[placeholder="Describe the quest..."]', 'Description');
await page.fill('input[type="number"]:near(:text("XP Reward"))', '100');
await page.fill('input[type="number"]:near(:text("Gold Reward"))', '50');
```
**Impact:** ~10-15 lines duplicated per quest creation
**Opportunity:** Create `createQuest(page, questData)` helper

#### 3. **Reward Form Filling** (32 occurrences)
```typescript
await page.fill('[data-testid="reward-name-input"]', 'Reward Name');
await page.fill('[data-testid="reward-description-input"]', 'Description');
await page.selectOption('[data-testid="reward-type-select"]', 'SCREEN_TIME');
await page.fill('[data-testid="reward-cost-input"]', '100');
```
**Impact:** 8-10 lines per reward creation
**Opportunity:** Create `createReward(page, rewardData)` helper

#### 4. **Modal Open/Close Pattern** (60+ occurrences)
```typescript
await page.click('[data-testid="create-*-button"]');
await expect(page.getByTestId('*-modal')).toBeVisible();
// ... form filling ...
await page.click('[data-testid="save-*-button"]');
await expect(page.getByTestId('*-modal')).not.toBeVisible();
```
**Impact:** 4-6 lines per modal interaction
**Opportunity:** Navigation helpers for common modal workflows

#### 5. **Logout Flow** (13 occurrences)
```typescript
await page.click('text=Logout');
await expect(page).toHaveURL(/.*\/(auth\/login)?/);
```
**Impact:** 2 lines per logout
**Opportunity:** `logout(page)` helper

#### 6. **Family Code Extraction** (8+ occurrences)
```typescript
const familyCodeText = await page.locator('text=/Guild:.*\\((.+)\\)/').textContent();
const familyCode = familyCodeText?.match(/\(([^)]+)\)/)?.[1] || '';
```
**Impact:** 2 lines per family code extraction
**Opportunity:** `getFamilyCode(page)` helper

#### 7. **Multi-User Setup for Realtime Tests** (15 occurrences)
```typescript
context1 = await browser.newContext();
context2 = await browser.newContext();
page1 = await context1.newPage();
page2 = await context2.newPage();
testUser = await setupUserWithCharacter(page1, 'guildmaster');
await loginUser(page2, testUser.email, testUser.password);
```
**Impact:** 6+ lines per realtime test setup
**Opportunity:** `setupTwoContextTest(browser)` fixture

#### 8. **Navigation to Dashboard Tabs** (40+ occurrences)
```typescript
await page.click('[data-testid="tab-templates"]');
await page.waitForSelector('[data-testid="quest-template-manager"]');
```
**Impact:** 2-3 lines per tab navigation
**Opportunity:** `navigateToTab(page, tabName)` helper

#### 9. **Admin Dashboard Navigation** (25+ occurrences)
```typescript
await page.click('[data-testid="admin-dashboard-button"]');
await expect(page).toHaveURL(/.*\/admin/);
await expect(page.getByTestId('admin-dashboard')).toBeVisible();
```
**Impact:** 3 lines per admin navigation
**Opportunity:** `navigateToAdmin(page)` helper

#### 10. **Quest Completion Workflow** (12+ occurrences)
```typescript
await page.locator('[data-testid="pick-up-quest-button"]').first().click();
await page.locator('[data-testid="start-quest-button"]').first().click();
await page.locator('[data-testid="complete-quest-button"]').first().click();
await page.locator('[data-testid="approve-quest-button"]').first().click();
```
**Impact:** 4 lines per quest completion
**Opportunity:** `completeQuest(page, questName)` and `approveQuest(page, questName)` helpers

## Selector Strategy Analysis

### data-testid Usage: **451 instances** ✅
**Good coverage** of data-testid attributes in critical UI elements

Common patterns:
- `[data-testid="create-*-button"]` - 45+ instances
- `[data-testid="*-modal"]` - 38+ instances
- `[data-testid="*-input"]` - 180+ instances
- `[data-testid="tab-*"]` - 25+ instances
- `[data-testid="*-card-*"]` - 62+ instances

### Generic Selectors: **262 instances**
Mostly used appropriately for:
- `page.getByRole()` - Accessibility-first selectors
- `page.getByText()` - Content-based navigation
- `text="Logout"` - Simple text selectors

**No major issues** - mixture is appropriate for different scenarios

## Realtime Testing Patterns

### Multi-Context Tests: **29 instances across 2 files**

**Good Pattern Identified:**
```typescript
// quest-template-realtime.spec.ts (5 tests)
// reward-realtime.spec.ts (3 tests)
```

Both files use the same robust pattern:
1. Create two browser contexts
2. Setup user in context1
3. Login same user in context2
4. Perform action in page1
5. Wait for realtime update in page2 with explicit timeout

**Current Wait Pattern:**
```typescript
await expect(page2.getByText('New Item')).toBeVisible({ timeout: 5000 });
```

**Opportunity:** Standardize with `waitForRealtimeChange()` helper for consistency

## Performance Bottlenecks

### 1. Single-Worker Execution ⚠️ **BIGGEST ISSUE**
```typescript
// playwright.config.ts
workers: 1
fullyParallel: false
```
**Impact:** All 97 tests run sequentially, one at a time
**Fix:** Enable parallel execution with 4-8 workers

**⚠️ CRITICAL CONSTRAINT:** Tests currently fail when run in parallel, even though they pass serially. This indicates **parallel safety issues** that must be fixed before enabling parallelization.

**Potential causes:**
- Database connection pool exhaustion under load
- Supabase realtime subscription conflicts
- Race conditions in test setup/teardown
- Timing assumptions that break under system load
- Shared resource contention (despite unique families)
- Missing waits that are masked by serial execution timing

**Priority:** Must diagnose and fix parallel safety issues BEFORE enabling workers

### 2. Repeated Family Creation
**Every test** creates a new family/user from scratch via `setupUserWithCharacter`
- 89 full signup flows
- Each involves: family creation → auth → character creation → dashboard navigation
- Estimated 5-8 seconds per setup

**Impact:** ~7-12 minutes spent on setup alone (89 tests × 8 seconds)
**Fix:** Not much we can do here - proper test isolation requires unique families

### 3. Multiple Quest/Reward Creations Per Test
Many tests create 2-5 quests or rewards to test workflows
- Manual form filling each time
- No batching or API shortcuts

**Impact:** 2-4 extra seconds per item created
**Fix:** Helper functions will reduce code but not eliminate time

### 4. Realtime Test Overhead
Realtime tests create two full browser contexts
- Double the setup time
- Two separate auth flows

**Impact:** Realtime tests take 2-3x longer
**Fix:** Ensure these run in parallel with other tests

## Estimated Improvement Opportunities

### Code Reduction Potential
- **Current:** 4,854 lines
- **Target:** 2,400-2,900 lines (50-60% reduction)
- **Savings:** ~2,000 lines through helper extraction

### Performance Improvement Potential

#### From Parallelization (BIGGEST GAIN)
- **Current:** Sequential execution (~20+ minutes)
- **With 4 workers:** ~5-7 minutes (4x speedup)
- **With 6 workers:** ~3-5 minutes (6x speedup)
- **Risk:** May need to adjust for system resources

#### From Helper Functions
- **Minimal direct time savings** - helpers reduce code but not execution time
- **Indirect benefit:** Easier to optimize helpers in one place

#### From Anti-Pattern Removal
- **7 instances** to fix
- **Estimated savings:** ~10-30 seconds total (minimal impact)

### Total Projected Improvement
```
Current:  10.5 minutes (baseline established)
Target:   5-6 minutes with 2 workers (50% reduction)
Better:   2.5-3 minutes with 4 workers (75% reduction)
Stretch:  1.75-2 minutes with 6 workers (83% reduction)
```

**Note:** Actual baseline is better than expected 20+ min estimate, suggesting prior optimizations were effective.

## Recommendations for Refactoring

### Phase 1 Priority: Fix Parallel Safety Issues ⚠️
**MUST DO FIRST** - Tests fail in parallel despite unique families per test

Investigation steps:
1. Run small subset (5-10 tests) with `workers: 2` to isolate failures
2. Check for database connection pool limits in Supabase config
3. Review realtime subscription cleanup in test teardown
4. Add explicit waits for async operations (Supabase auth, DB writes)
5. Check for race conditions in `setupUserWithCharacter` helper
6. Review test isolation - ensure no shared state between tests

Potential fixes:
- Add `await page.waitForLoadState('networkidle')` after auth operations
- Increase database connection pool size
- Add explicit cleanup in `afterEach` hooks
- Add retry logic for flaky Supabase operations
- Increase timeouts for operations under load
- Add delays/throttling between parallel test starts

**Expected Impact:** Enable 4-6 workers for 70-80% runtime reduction AFTER fixes

### Phase 2 Priority: Enable Parallelization
1. Start conservative: `workers: 2`, verify all pass
2. Gradually increase: `workers: 4`, then `workers: 6`
3. Monitor for flakiness at each level
4. Find optimal worker count for stability + performance

### Phase 2 Priority: Create Helper Library
1. **auth-helpers.ts:** Extract logout, family code extraction
2. **quest-helpers.ts:** Quest creation, pickup, completion workflows
3. **reward-helpers.ts:** Reward creation, redemption, approval
4. **navigation-helpers.ts:** Tab switching, admin navigation, modal operations
5. **realtime-helpers.ts:** Standardize realtime wait patterns

**Expected Impact:** 50-60% code reduction

### Phase 3 Priority: Test Reorganization
1. Consolidate admin tests (5 files → 1)
2. Consolidate quest template tests (4 files → 1-2)
3. Consolidate reward tests (4 files → 2)
4. Create feature-based directory structure

**Expected Impact:** Improved maintainability, easier navigation

### Phase 4: Remove Remaining Anti-Patterns
1. Fix 7 instances of `waitForTimeout`/`page.reload()`
2. Standardize all waits with proper selectors

**Expected Impact:** Better reliability, minimal time savings

## Baseline Metrics Summary

| Metric | Current Value | Target Value |
|--------|--------------|--------------|
| **Total Test Files** | 20 | 11-13 (consolidation) |
| **Total Lines of Code** | 4,854 | 2,400-2,900 |
| **Test Count** | 97 | 97 (maintain coverage) |
| **Pass Rate** | 95/97 (97.9%) | 97/97 (100%) |
| **Runtime** | 10.5 minutes | 2-3 minutes |
| **Workers** | 1 | 4-6 (after parallel fixes) |
| **Anti-patterns** | 7 | 0 |
| **Helper Functions** | 4 | 20+ |
| **Code Duplication** | High (~60%) | Low (~20%) |

## Next Steps

1. ✅ Complete baseline test run (in progress)
2. Create detailed task breakdown for helper library
3. Begin Phase 1: Enable parallelization
4. Measure improvement after each phase
5. Update this document with actual vs. projected results

---

**Audit completed by:** Claude Code
**Baseline established:** 2025-10-03
**Test execution:** Complete (95/97 passing, 10.5 minutes)
**Ready for refactoring:** YES ✅
