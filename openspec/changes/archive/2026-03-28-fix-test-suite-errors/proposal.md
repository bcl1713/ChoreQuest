# Fix Test Suite Errors

## Why

Two test suite warnings surface real bugs: a test mock that leaks
non-HTML props to DOM elements, and a fire-and-forget side effect
that escapes the test boundary — causing race conditions in CI and
masking potential runtime failures.

## What Changes

- Fix the `@/components/ui` Button mock in `index-actions.test.tsx`
  to destructure non-HTML props (`isLoading`, `variant`, `size`,
  `fullWidth`, `startIcon`, `endIcon`) before spreading to the
  native `<button>`, eliminating the React DOM prop warning.
- Make `AchievementProgressService` injectable in `ApproveQuestDeps`
  so the integration test can supply a mock, preventing the
  fire-and-forget from escaping the test boundary and racing against
  `afterAll` teardown.
- Update the integration test to inject a no-op mock progress
  service.

## Capabilities

### New Capabilities

None — this is a bugfix only.

### Modified Capabilities

None — no spec-level requirement changes.

## Impact

- `components/quests/quest-card/index-actions.test.tsx` — fix Button
  mock
- `lib/quest-instance/approve-quest.ts` — add optional
  `progressService` to `ApproveQuestDeps`
- `tests/integration/quest-instance-service.approve.test.ts` —
  inject mock progress service
