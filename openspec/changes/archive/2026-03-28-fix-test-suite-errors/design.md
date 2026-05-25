# Design: Fix Test Suite Errors

## Context

Two warnings appear in the test suite:

1. **React DOM prop warning** — `index-actions.test.tsx` mocks
   `@/components/ui` with a `Button` that spreads all remaining
   props onto a native `<button>`. Non-HTML props like `isLoading`,
   `variant`, and `size` reach the DOM, triggering React's unknown
   prop warning.

2. **Async log after test teardown** — `approve-quest.ts` constructs
   `AchievementProgressService` internally and fires
   `updateProgress` as a `void` side effect. The service is not
   injectable, so the integration test cannot mock it. The
   fire-and-forget races against `afterAll` cleanup: by the time
   evaluators (e.g. `evaluateXpEarned`) call `.single()` on the
   `characters` table, the test's teardown may have already deleted
   the character, causing PGRST116.

## Goals / Non-Goals

**Goals:**

- Silence the React DOM prop warning by fixing the Button mock.
- Prevent the fire-and-forget from escaping the integration test
  boundary by making `AchievementProgressService` injectable.
- No changes to production behavior.

**Non-Goals:**

- Changing how `AchievementProgressService` works at runtime.
- Fixing evaluators to use `.maybeSingle()` (unrelated defensive
  hardening; separate concern).

## Decisions

### Decision 1 — Fix the Button mock, not the component

The real `Button.tsx` already destructures `isLoading` correctly.
The bug is exclusively in the test mock. Updating the mock to
destructure `isLoading`, `variant`, `size`, `fullWidth`,
`startIcon`, and `endIcon` before spreading is the minimal,
targeted fix.

**Alternatives considered:**

- Add `isLoading` to `SUPPRESSED_ERRORS` in `jest.setup.js` — would
  hide a real bug signal; rejected.
- Use `jest-environment-jsdom` filtering — unnecessary complexity.

### Decision 2 — Inject progress service via ApproveQuestDeps

Add an optional `progressService` field to `ApproveQuestDeps`.
When present, use it; when absent, fall back to constructing one
with `createServiceSupabaseClient()` (existing production behavior
unchanged).

```ts
type ApproveQuestDeps = {
  client: SupabaseClient<Database>;
  streakService: StreakService;
  progressService?: Pick<AchievementProgressService, "updateProgress">;
};
```

The integration test passes a no-op mock:

```ts
const progressService = {
  updateProgress: jest.fn().mockResolvedValue(undefined),
};
```

**Alternatives considered:**

- Mock the entire `AchievementProgressService` module with
  `jest.mock(...)` — works, but module-level mocks are broader than
  needed and harder to scope per-test.
- Await the fire-and-forget in the test — not possible without
  exposing the promise.

## Risks / Trade-offs

- [Scope creep] Changing `ApproveQuestDeps` touches the public
  signature of `approveQuest`. All callers must be checked to
  ensure they compile. Mitigation: the field is optional, so no
  callers break.

## Migration Plan

No data migrations. No deployment steps. Changes are test-local
and a backwards-compatible signature extension.

## Open Questions

None.
