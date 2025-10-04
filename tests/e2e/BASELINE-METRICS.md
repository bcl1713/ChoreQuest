# E2E Test Suite - Baseline Metrics Report

**Date:** 2025-10-03
**Branch:** feature/e2e-test-refactoring
**Status:** BEFORE REFACTORING

---

## Executive Summary

This document captures the baseline performance and quality metrics for the ChoreQuest E2E test suite **before** any refactoring work begins. These metrics will be used to measure the success of the refactoring effort.

### Quick Stats

| Metric | Value |
|--------|-------|
| **Total Runtime** | **10.5 minutes** |
| **Total Tests** | 97 |
| **Pass Rate** | 97.9% (95 passed, 2 failed) |
| **Total Test Files** | 20 |
| **Total Lines of Code** | 4,854 lines |
| **Parallel Workers** | 1 (sequential execution) |
| **Parallel Execution** | Disabled (fullyParallel: false) |

---

## Test Execution Results

### Runtime Performance

```
Test Execution: Sequential (1 worker)
Total Duration: 10 minutes 30 seconds (630 seconds)
Average per test: ~6.5 seconds
```

**Note:** This is significantly better than the estimated 20+ minutes, suggesting previous optimizations have already been applied.

### Test Results Breakdown

```
✅ PASSED:  95 tests (97.9%)
❌ FAILED:   2 tests (2.1%)
📊 TOTAL:   97 tests
```

### Failed Tests (Test Code Bugs)

Both failures are due to **undefined variables in test code** (not application bugs):

1. **admin-activity-feed.spec.ts:211**
   - Test: "activity feed auto-scrolls to new events"
   - Error: `ReferenceError: activityFeed is not defined`
   - Type: Test code bug (variable scoping issue)

2. **admin-statistics.spec.ts:41**
   - Test: "updates quest completion statistics in real-time"
   - Error: `ReferenceError: statsPanel is not defined`
   - Type: Test code bug (variable scoping issue)

**Action Required:** Fix these 2 test code bugs as part of refactoring

---

## Code Quality Metrics

### Lines of Code Distribution

```
Total Test Code:     4,854 lines
Test Files:          20 files
Helper Files:        1 file (setup-helpers.ts, 395 lines)
Average per file:    ~243 lines
```

### Code Duplication Analysis

**High Duplication Patterns Identified:**

| Pattern | Occurrences | Est. Lines Duplicated |
|---------|-------------|----------------------|
| `setupUserWithCharacter` calls | 89 | ~890 lines (10 lines each) |
| Quest form filling | 349 | ~1,396 lines (4 lines each) |
| Reward form filling | 32 | ~256 lines (8 lines each) |
| Modal open/close | 60+ | ~300 lines (5 lines each) |
| Logout flows | 13 | ~26 lines (2 lines each) |

**Total Estimated Duplication:** ~2,900 lines (60% of codebase)

### Anti-Pattern Count

```
✅ waitForTimeout:      7 instances (GOOD - mostly cleaned up)
✅ page.reload():       Included in above count
```

**Note:** The low anti-pattern count indicates previous cleanup work was effective.

### Selector Strategy

```
data-testid selectors:    451 uses (63%)
Generic selectors:        262 uses (37%)
  - getByRole():          Significant portion
  - getByText():          Moderate use
  - text=:                Some use
```

**Assessment:** Good balance of data-testid and semantic selectors

---

## Test Organization

### File Distribution by Feature

| Feature Area | Files | Tests | % of Total |
|-------------|-------|-------|------------|
| Admin Dashboard | 5 | 32 | 33% |
| Quest System | 6 | 19 | 20% |
| Reward System | 4 | 18 | 19% |
| Quest Templates | 4 | 19 | 20% |
| Character/Auth | 3 | 9 | 9% |

### Consolidation Opportunities

**Files that can be merged:**
- 5 admin files → 1-2 files
- 4 quest template files → 1 file
- 4 reward files → 2-3 files

**Projected reduction:** 20 files → 11-13 files

---

## Parallel Execution Analysis

### Current Configuration

```typescript
// playwright.config.ts
workers: 1
fullyParallel: false
```

### ⚠️ CRITICAL CONSTRAINT

**Tests fail when run in parallel**, even with unique families per test.

**Symptoms:**
- Tests pass in serial execution (workers: 1) ✅
- Tests fail in parallel execution (workers: 2+) ❌

**Likely Root Causes:**
1. Database connection pool exhaustion
2. Supabase realtime subscription conflicts
3. Race conditions in test setup/teardown
4. Missing waits for async operations
5. Timing assumptions that break under load

**Priority Action:** MUST fix parallel safety issues before enabling parallelization

**Projected Performance Gain (after fixes):**
- With 2 workers: ~5-6 minutes (50% reduction)
- With 4 workers: ~2.5-3 minutes (75% reduction)
- With 6 workers: ~1.75-2 minutes (83% reduction)

---

## Helper Function Analysis

### Current Helpers (setup-helpers.ts)

| Function | Uses | Purpose |
|----------|------|---------|
| `setupUserWithCharacter` | 89 | Full family + character creation |
| `loginUser` | ~15 | Login existing user (mostly realtime tests) |
| `createTestUser` | Called by above | Generate unique test user data |
| `clearBrowserState` | Called by above | Clear cookies/storage |
| `giveCharacterGoldViaQuest` | ~6 | Award gold via quest workflow |
| `setupTestUser` | ~3 | Return user IDs for specific tests |

### Helper Coverage

```
Tests using helpers:        ~89/97 (92%)
Tests with manual setup:    ~8/97 (8%)
```

**Assessment:** Good helper adoption, but helpers could be more specialized

---

## Realtime Testing Patterns

### Multi-Context Tests

```
Total realtime tests:     8 tests (2 files)
Pattern used:             Two browser contexts (correct approach)
Setup overhead:           2x normal test (two auth flows)
```

**Files:**
- `quest-template-realtime.spec.ts` (5 tests)
- `reward-realtime.spec.ts` (3 tests)

**Current Pattern (Good):**
```typescript
context1 = await browser.newContext();
context2 = await browser.newContext();
page1 = await context1.newPage();
page2 = await context2.newPage();
testUser = await setupUserWithCharacter(page1, 'guildmaster');
await loginUser(page2, testUser.email, testUser.password);
```

**Opportunity:** Standardize with `setupTwoContextTest()` helper

---

## Performance Bottlenecks (Ranked by Impact)

### 1. ⚠️ Parallel Safety Issues (HIGHEST IMPACT)

**Blocker:** Can't enable parallelization until fixed
**Estimated Fix Effort:** Medium-High (investigation + fixes)
**Potential Speedup:** 75-83% reduction in runtime

### 2. Sequential Execution (BLOCKED by #1)

**Current:** All 97 tests run one at a time
**Impact:** 10.5 minute baseline could be 2-3 minutes with 4-6 workers
**Dependency:** Fix #1 first

### 3. Code Duplication (Medium Impact)

**Impact:** Maintenance burden, not performance
**Lines duplicated:** ~2,900 lines (60% of codebase)
**Fix:** Helper library refactoring

### 4. Realtime Test Overhead (Low Impact)

**Impact:** 8 tests take 2x time due to dual contexts
**Assessment:** Acceptable overhead for proper testing
**Optimization:** Ensure these run in parallel with others

---

## Comparison to Expectations

| Metric | Expected | Actual | Variance |
|--------|----------|--------|----------|
| Runtime | 20+ min | 10.5 min | ✅ 47% better |
| Anti-patterns | "mostly cleaned" | 7 instances | ✅ Confirmed |
| Pass rate | ~100% | 97.9% | ⚠️ 2 test bugs |
| Code duplication | High | 60% | ✅ Confirmed |

**Analysis:** Previous work has already improved runtime significantly. Current bottleneck is parallel safety, not serial performance.

---

## Refactoring Goals & Success Criteria

### Primary Goals

1. **Fix Parallel Safety Issues** ✨ CRITICAL
   - Target: All tests pass with workers: 2
   - Measure: 100% pass rate in parallel
   - Stretch: Enable workers: 4-6

2. **Reduce Runtime**
   - Baseline: 10.5 minutes
   - Target: 5-6 minutes (with workers: 2)
   - Stretch: 2-3 minutes (with workers: 4-6)

3. **Reduce Code Duplication**
   - Baseline: 4,854 lines (60% duplication)
   - Target: 2,400-2,900 lines (50-60% reduction)
   - Measure: Total LOC in test files

4. **Fix Test Code Bugs**
   - Current: 2 failed tests
   - Target: 0 failed tests (100% pass rate)

### Secondary Goals

5. **Eliminate All Anti-Patterns**
   - Current: 7 instances
   - Target: 0 instances

6. **Consolidate Test Files**
   - Current: 20 files
   - Target: 11-13 files

7. **Standardize Realtime Testing**
   - Create `setupTwoContextTest()` helper
   - Create `waitForRealtimeChange()` helper

### Success Criteria

**Minimum Success:**
- ✅ Fix 2 test code bugs (100% pass rate)
- ✅ Fix parallel safety for workers: 2
- ✅ Reduce runtime to ~5 minutes
- ✅ Create helper library reducing duplication by 40%+

**Full Success:**
- ✅ All Minimum Success criteria
- ✅ Enable workers: 4-6 for 2-3 minute runtime
- ✅ Reduce code by 50-60% (2,400-2,900 lines)
- ✅ Consolidate to 11-13 test files
- ✅ Zero anti-patterns

---

## Next Steps (Refactoring Phase Plan)

### Phase 1: Investigation & Fixes (PRIORITY)
1. Fix 2 test code bugs (quick wins)
2. Run small subset with workers: 2 to isolate parallel issues
3. Investigate and fix parallel safety issues
4. Verify all tests pass with workers: 2

### Phase 2: Helper Library
1. Create specialized helper modules
2. Extract common patterns
3. Update tests to use new helpers
4. Measure code reduction

### Phase 3: Test Reorganization
1. Consolidate test files by feature
2. Update imports and references
3. Verify all tests still pass

### Phase 4: Performance Validation
1. Gradually increase workers (2 → 4 → 6)
2. Measure runtime at each level
3. Find optimal worker count for stability + speed

### Phase 5: Documentation
1. Create E2E testing guide (README.md)
2. Document helper usage
3. Provide test templates

---

## Baseline Snapshot Saved

The following files capture the complete baseline:
- ✅ `test-results-baseline.txt` - Full test execution log
- ✅ `AUDIT.md` - Detailed analysis and patterns
- ✅ `BASELINE-METRICS.md` - This document
- 📊 `test-results-baseline.json` - (generation attempted, may be incomplete)

**Baseline Established:** 2025-10-03
**Ready for Refactoring:** YES ✅

---

*Generated by: Claude Code*
*ChoreQuest E2E Test Refactoring Project*
