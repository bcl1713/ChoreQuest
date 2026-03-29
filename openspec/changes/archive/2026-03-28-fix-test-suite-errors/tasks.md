# Tasks: Fix Test Suite Errors

## 1. Fix isLoading DOM Prop Warning

- [x] 1.1 Update the `@/components/ui` mock in
      `components/quests/quest-card/index-actions.test.tsx` to
      destructure `isLoading`, `variant`, `size`, `fullWidth`,
      `startIcon`, and `endIcon` before spreading `...props` onto
      the native `<button>`.
- [x] 1.2 Run `npm test -- index-actions` and confirm the
      `isLoading` DOM prop warning is gone.

## 2. Make AchievementProgressService Injectable

- [x] 2.1 Add optional `progressService` field to `ApproveQuestDeps`
      in `lib/quest-instance/approve-quest.ts` (typed as
      `Pick<AchievementProgressService, "updateProgress">`).
- [x] 2.2 Update `approveQuest` to use `deps.progressService` when
      provided, falling back to constructing a new
      `AchievementProgressService` when not.

## 3. Update Integration Test

- [x] 3.1 Add a no-op mock progress service to the integration test
      `beforeAll` in
      `tests/integration/quest-instance-service.approve.test.ts`.
- [x] 3.2 Pass the mock service when constructing `QuestInstanceService`
      (or pass it through however the service accepts deps).
- [x] 3.3 Run the integration test suite and confirm no "Cannot log
      after tests are done" warning appears.

## 4. Quality Gate

- [x] 4.1 Run `npm run build` — zero TypeScript errors.
- [x] 4.2 Run `npm run lint` — zero warnings.
- [x] 4.3 Run `npm run test` — all tests pass, no console warnings.
