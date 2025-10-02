# Known Bugs and Issues

## Flaky E2E Tests

### BUG-001: Flaky test - "Quest Template Management › Guild Master edits an existing quest template"

**Severity:** Low (Flaky test, not a functional bug)
**Status:** Open
**First Observed:** 2025-10-02
**Test File:** `tests/e2e/quest-template-management.spec.ts:87`

#### Description
The test "Guild Master edits an existing quest template" occasionally fails with a timeout when attempting to click the save button in the edit modal. The error indicates the button element becomes unstable or detached from the DOM during the click action.

#### Error Details
```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="save-template-button"]')
    - locator resolved to <button type="submit" data-testid="save-template-button" ...>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying
```

**Failure Rate:** ~2-5% (intermittent)
**Last Seen:** Full test suite run on 2025-10-02, test #30/50

#### Reproduction Steps
1. Run full E2E test suite: `npx playwright test`
2. Test occasionally fails at line where it clicks save button after editing template
3. Re-running the specific test usually passes: `npx playwright test tests/e2e/quest-template-management.spec.ts:87`

#### Root Cause Analysis
The modal save button is being clicked while React is re-rendering the component, causing:
1. The button to be in an "unstable" state (mid-render)
2. The button to be temporarily detached from DOM during render
3. The click action to timeout after 10 seconds of retries

This is likely due to:
- Form validation causing re-renders when input values change
- State updates triggering component updates during the click action
- No explicit wait for form stability before clicking

#### Potential Solutions

**Option 1: Add explicit wait for stability**
```typescript
// Before clicking save, wait for form to be stable
await page.waitForTimeout(100); // Brief pause for React to finish rendering
await page.click('[data-testid="save-template-button"]');
```

**Option 2: Use force click to bypass stability checks**
```typescript
await page.click('[data-testid="save-template-button"]', { force: true });
```

**Option 3: Wait for no pending network requests**
```typescript
await page.waitForLoadState('networkidle');
await page.click('[data-testid="save-template-button"]');
```

**Option 4: Use Playwright's more robust interaction**
```typescript
// Wait for button to be actionable (visible, enabled, stable)
const saveButton = page.getByTestId('save-template-button');
await saveButton.waitFor({ state: 'visible' });
await saveButton.click();
```

#### Recommended Fix
Implement **Option 4** - use more robust Playwright selectors that have built-in stability checks. Additionally, consider adding a `data-testid` to the modal container and waiting for it to be fully rendered before interacting with form elements.

#### Workaround
Re-run the specific test when it fails. It typically passes on retry.

---

### BUG-002: Flaky test - "Reward Management › Guild Master deactivates and reactivates a reward"

**Severity:** Low (Flaky test, not a functional bug)
**Status:** Open
**First Observed:** 2025-10-02
**Test File:** `tests/e2e/reward-management.spec.ts:95`

#### Description
The test "Guild Master deactivates and reactivates a reward" occasionally fails with a timeout when attempting to click the save button in the create reward modal. The error is identical to BUG-001, indicating the same root cause affects both quest template and reward management modals.

#### Error Details
```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="save-reward-button"]')
    - locator resolved to <button type="submit" data-testid="save-reward-button" ...>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

At: tests/e2e/reward-management.spec.ts:109:16
```

**Failure Rate:** ~2-5% (intermittent)
**Last Seen:** Full test suite run on 2025-10-02, test #41/50

#### Reproduction Steps
1. Run full E2E test suite: `npx playwright test`
2. Test occasionally fails at line 109 where it clicks save button after filling reward form
3. Re-running the specific test usually passes: `npx playwright test tests/e2e/reward-management.spec.ts:95`

#### Test Code Context
```typescript
// Test is creating a reward before testing deactivate/reactivate
await page.click('[data-testid="create-reward-button"]');
await page.fill('[data-testid="reward-name-input"]', 'Toggle Test');
await page.fill('[data-testid="reward-description-input"]', 'Test deactivation');
await page.selectOption('[data-testid="reward-type-select"]', 'PURCHASE');
await page.fill('[data-testid="reward-cost-input"]', '300');
await page.click('[data-testid="save-reward-button"]'); // <-- FAILS HERE
```

#### Root Cause Analysis
Same as BUG-001. The RewardManager component's create modal has the same issue:
1. Form validation state changes cause React re-renders
2. Save button becomes unstable during re-render cycle
3. Playwright's click action times out waiting for stability

#### Affected Components
- `components/reward-manager.tsx` - RewardManager create modal
- `components/quest-template-manager.tsx` - QuestTemplateManager edit modal (BUG-001)

Both components use similar modal patterns with form validation that triggers re-renders.

#### Potential Solutions
Same options as BUG-001. Additionally, consider:

**Option 5: Debounce form validation**
Modify the components to debounce validation state updates to reduce mid-render clicks:
```typescript
const [formData, setFormData] = useState({...});
const debouncedFormData = useDebounce(formData, 100);
// Use debouncedFormData for validation
```

**Option 6: Refactor modal state management**
Use a form library like `react-hook-form` that handles validation without causing excessive re-renders.

#### Recommended Fix
1. **Immediate:** Update affected tests to use Playwright's more robust interaction pattern (Option 4 from BUG-001)
2. **Long-term:** Refactor modal components to reduce unnecessary re-renders during form input

#### Workaround
Re-run the specific test when it fails. It typically passes on retry.

---

## Common Patterns

Both flaky tests share:
- **Modal form interactions** with save buttons
- **Form validation** triggering React re-renders
- **Element instability** during click actions
- **Low failure rate** (~2-5%, intermittent)
- **Pass on retry** indicating race condition, not logic bug

## Priority
Low - These are test stability issues, not application bugs. The functionality works correctly; the tests just need more robust interaction patterns.

## Next Steps
1. Update test files to use `page.getByTestId(...).click()` instead of `page.click('[data-testid="..."]')`
2. Add explicit waits before clicking save buttons in modals
3. Consider refactoring modal components to use react-hook-form for better performance
4. Monitor failure rates after fixes
