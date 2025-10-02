# /e2e

Runs end-to-end Playwright tests with intelligent test identification and
component validation.

## Usage

- `/e2e` - Run all test suites sequentially
- `/e2e [description]` - Run specific test suite(s) matching the description
- `/e2e [filename]` - Run specific test file (e.g., "dashboard.spec.ts")

## Behavior

1. Ensure that supabase and a dev server ar running before executing tests
2. If a specific test suite is requested, identify and run only that suite
3. If no arguments provided, run all test suites one at a time sequentially
4. Output is unfiltered to capture full error context
5. Validate components have `data-testid` attributes when tests fail to locate
   elements
6. Add missing `data-testid` attributes as needed and update tests accordingly
7. Final tests should contain no console.log statements

## Quality Standards

- All components must have `data-testid` for test identification
- Tests run with full output (`--reporter=line` for clean output, no `--quiet`)
- Tests run sequentially to avoid conflicts
- No console logging in production tests

## Implementation

```javascript
async function e2e(args) {
  const testArg = args || "";

  if (!testArg) {
    // Run all tests sequentially, one suite at a time
    const testFiles = await glob("tests/**/*.spec.ts");
    for (const file of testFiles) {
      await bash(`npx playwright test ${file} --reporter=line`);
    }
  } else if (testArg.includes(".spec.ts")) {
    // Direct filename
    await bash(`npx playwright test ${testArg} --reporter=line`);
  } else {
    // Search for matching test suite by description
    const testFiles = await findMatchingTests(testArg);
    for (const file of testFiles) {
      await bash(`npx playwright test ${file} --reporter=line`);
    }
  }
}
```

## Example Workflow

When a test fails due to missing element:

1. Identify the component being tested
2. Check if component has `data-testid`
3. If missing, add `data-testid` to component
4. Update test to use `data-testid` selector
5. Remove any debug console.log statements
6. Re-run test to verify
