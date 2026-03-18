# Tasks: Dashboard Load Performance

## 1. Tests (Red Phase)

- [x] 1.1 Add a test to `useQuestTemplates` verifying the hook
  fetches when `user` and `family_id` are set but `character` is null
- [x] 1.2 Add a test verifying the hook does NOT fetch when
  `family_id` is missing (even if character is set)

## 2. Implementation

- [x] 2.1 In `dashboard-content.tsx`, change the `enabled` prop
  passed to `useQuestTemplates` from
  `Boolean(user && profile && character)` to
  `Boolean(user && profile?.family_id)`

## 3. Verification

- [x] 3.1 Run `npm run test` — all tests pass
- [x] 3.2 Run `npm run build` — zero TypeScript errors
- [x] 3.3 Run `npm run lint` — zero lint warnings or errors
