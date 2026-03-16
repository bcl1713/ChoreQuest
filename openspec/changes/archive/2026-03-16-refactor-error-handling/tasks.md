# Tasks: Refactor Error Handling

## 1. Foundation — Typed Errors and Helpers

- [x] 1.1 Create `lib/errors.ts` with `AppError` base class carrying
  `statusCode` and `code` properties
- [x] 1.2 Add `AuthError` (401), `ForbiddenError` (403),
  `NotFoundError` (404), `ValidationError` (400),
  `ConflictError` (409) subclasses in `lib/errors.ts`
- [x] 1.3 Write unit tests for each error class (correct statusCode,
  code, message, instanceof checks)
- [x] 1.4 Create `lib/api-error-handler.ts` with `handleRouteError`
  helper that returns `{ error, code }` JSON response
- [x] 1.5 Write unit tests for `handleRouteError` covering AppError
  subclasses and unclassified errors (500 fallback)

## 2. Root Error Boundary

- [x] 2.1 Create `components/ErrorBoundary.tsx` class component with
  recovery UI (message + reload button)
- [x] 2.2 Implement dev-mode re-throw in ErrorBoundary
  (`NODE_ENV !== "production"`)
- [x] 2.3 Wrap `{children}` in `app/layout.tsx` with `ErrorBoundary`
- [x] 2.4 Write tests for ErrorBoundary (renders fallback on throw,
  renders children normally when no error)

## 3. API Routes — Quest Feature

- [x] 3.1 Update `QuestInstanceService` to throw typed `AppError`
  subclasses instead of plain `new Error()`
- [x] 3.2 Migrate `app/api/quests/[id]/claim/route.ts` to use
  `handleRouteError` (removes string-matching status detection)
- [x] 3.3 Migrate `app/api/quest-instances/[id]/approve/route.ts` to
  use `handleRouteError` (removes string-matching status detection)
- [x] 3.4 Migrate `app/api/quest-templates/route.ts` to use
  `handleRouteError`
- [x] 3.5 Update route handler tests to assert `{ error, code }`
  response shape and correct status codes for each error scenario

## 4. API Routes — Reward Feature

- [x] 4.1 Update `RewardService` to throw typed `AppError` subclasses
- [x] 4.2 Migrate all routes under `app/api/rewards/**` to use
  `handleRouteError`
- [x] 4.3 Update reward route tests to assert standardized error shape

## 5. API Routes — User and Admin Feature

- [x] 5.1 Migrate `app/api/users/[userId]/promote/route.ts` to use
  `handleRouteError`
- [x] 5.2 Migrate any other routes under `app/api/users/**` and
  `app/api/admin/**` to use `handleRouteError`
- [x] 5.3 Update user/admin route tests for standardized error shape

## 6. API Routes — Boss Quests and Cron

- [x] 6.1 Migrate `app/api/boss-quests/route.ts` to use
  `handleRouteError` (already uses auth helpers, just needs catch
  block update)
- [x] 6.2 Migrate all routes under `app/api/cron/**` to use
  `handleRouteError`
- [x] 6.3 Update tests for these routes

## 7. UI Consolidation — Migrate Ad-hoc Notification State

- [x] 7.1 Audit all components for manual `notification` state objects
  of shape `{ type, message }` (target: zero remaining after this
  phase)
- [x] 7.2 Migrate `components/family/family-settings.tsx` from manual
  notification state to `useNotification` hook
- [x] 7.3 Migrate profile form components (PasswordChangeForm,
  CharacterNameForm, ClassChangeForm) to use `useNotification` for
  action errors and `ErrorAlert` for load errors
- [x] 7.4 Remove `NotificationToast` usages replaced by
  `useNotification`; delete the component if no longer used
- [x] 7.5 Update component tests to assert `useNotification` is called
  rather than state being set

## 8. Quality Gate

- [x] 8.1 Run `npm run build` — zero TypeScript errors
- [x] 8.2 Run `npm run lint` — zero lint errors or warnings
- [x] 8.3 Run `npm run test` — all tests pass, no skipped tests
- [x] 8.4 Verify no API route catch block contains string-matching
  logic for status code detection (audit with `rg "startsWith\|
  includes" app/api`)
- [x] 8.5 Verify no component contains a `notification` state object
  used as the sole error display mechanism
