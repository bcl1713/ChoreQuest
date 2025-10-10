# Task List: Browser Tab Visibility / Focus Reconnection Issues

Based on PRD: `0007-prd-browser-visibility-reconnection-fix.md`

## Relevant Files

- `lib/auth-context.tsx` - Main auth context with duplicate `loadUserData` calls issue (will be modified)
- `lib/realtime-context.tsx` - Realtime connection management with dependency thrashing (will be modified)
- `lib/character-context.tsx` - Character fetch with timeout and guard race condition (will be modified)
- `lib/hooks/useVisibilityChange.ts` - New custom hook for browser visibility API integration (will be created)
- `lib/hooks/useVisibilityChange.test.ts` - Unit tests for visibility hook (will be created)
- `tests/unit/lib/auth-context.test.tsx` - Unit tests for auth context deduplication (will be created)
- `tests/unit/lib/realtime-context.test.tsx` - Unit tests for realtime context optimization (will be created)
- `tests/unit/lib/character-context.test.tsx` - Unit tests for character context fixes (will be created)
- `components/quest-dashboard.tsx` - Quest loading component affected by visibility issues (may need updates)
- `app/dashboard/page.tsx` - Main dashboard page that coordinates all contexts (reference only)

### Notes

- All context files use React hooks and need careful management of dependencies
- The issue manifests when browser tab visibility changes (sleep/wake cycle)
- Root cause is cascading re-renders and reconnections across dependent contexts
- No new external dependencies needed - uses standard Web APIs (Page Visibility API)
- Unit tests should be placed in `tests/unit/` directory following existing patterns
- Use `npx jest [optional/path/to/test/file]` to run tests
- E2E tests run with `npx playwright test` (requires dev server running)

## Tasks

- [x] 1.0 Fix Auth Context Duplicate Loading
  - [x] 1.1 Add `prevUserIdRef` to track the last user ID for which data was loaded (line ~36)
  - [x] 1.2 Add `isLoadingUserDataRef` to track if data loading is currently in progress
  - [x] 1.3 Modify `loadUserData` function to check `prevUserIdRef` and skip if userId hasn't changed and data already loaded
  - [x] 1.4 Modify `loadUserData` function to check `isLoadingUserDataRef` and skip if already loading for the same user
  - [x] 1.5 Update `prevUserIdRef.current` after successful data load
  - [x] 1.6 Add detailed console logging with timestamps to track when `loadUserData` is called and why
  - [x] 1.7 Test that login, logout, and signup flows still work correctly
  - [x] 1.8 Verify in console logs that `loadUserData` is only called once on tab visibility restoration

- [x] 2.0 Optimize Realtime Context Dependencies
  - [x] 2.1 Change the realtime effect dependency array from `[user, session, profile?.family_id]` to `[user?.id, session?.access_token, profile?.family_id]` (line ~310)
  - [x] 2.2 Add `prevFamilyIdRef` to track the previous family ID
  - [x] 2.3 Add comparison logic at the start of the effect to compare current family_id with `prevFamilyIdRef.current`
  - [x] 2.4 Skip channel cleanup and recreation if family_id hasn't actually changed
  - [x] 2.5 Add console logging for "Skipping realtime reconnection - family unchanged" when reconnection is skipped
  - [x] 2.6 Add timestamp logging for all realtime connection lifecycle events (setup, subscribed, closed, error)
  - [x] 2.7 Update `prevFamilyIdRef.current` when family_id changes
  - [x] 2.8 Test that realtime events (quest updates, character updates) still fire correctly after changes

- [x] 3.0 Fix Character Context Fetch Guard and Timeout
  - [x] 3.1 Reduce character fetch timeout from 10 seconds to 5 seconds (line ~86)
  - [x] 3.2 Reduce safety valve timeout from 15 seconds to 5 seconds (line ~55)
  - [x] 3.3 Add visibility change event listener in CharacterProvider to detect when tab becomes visible
  - [x] 3.4 When tab becomes visible, force clear `isFetchingRef.current` if it's been set for more than 2 seconds
  - [x] 3.5 Add more detailed error logging including timestamp, user ID, and fetch duration
  - [x] 3.6 Add retry logic: on fetch failure, wait 1 second and retry once before showing error
  - [x] 3.7 Add console log when fetch guard blocks a fetch attempt (include reason and elapsed time)
  - [x] 3.8 Test character loading works correctly after tab visibility changes

- [ ] 4.0 Add Browser Visibility API Integration
  - [ ] 4.1 Create a new custom hook `useVisibilityChange` in `lib/hooks/useVisibilityChange.ts`
  - [ ] 4.2 In the hook, add event listener for `visibilitychange` event on document
  - [ ] 4.3 In the hook, return `isVisible` state and `wasHidden` flag to track visibility changes
  - [ ] 4.4 Add console logging when visibility changes (include timestamp and new visibility state)
  - [ ] 4.5 Integrate `useVisibilityChange` hook into auth-context.tsx
  - [ ] 4.6 Integrate `useVisibilityChange` hook into character-context.tsx
  - [ ] 4.7 Integrate `useVisibilityChange` hook into realtime-context.tsx
  - [ ] 4.8 Add debouncing (500ms) to prevent rapid visibility changes from triggering multiple refreshes
  - [ ] 4.9 Test that visibility changes are properly detected and logged

- [ ] 5.0 Testing and Validation
  - [ ] 5.1 Create unit test for auth-context deduplication logic in `tests/unit/lib/auth-context.test.tsx`
  - [ ] 5.2 Create unit test for realtime-context dependency optimization in `tests/unit/lib/realtime-context.test.tsx`
  - [ ] 5.3 Create unit test for character-context timeout and retry logic in `tests/unit/lib/character-context.test.tsx`
  - [ ] 5.4 Create unit test for visibility hook in `tests/unit/lib/hooks/useVisibilityChange.test.ts`
  - [ ] 5.5 Run all existing E2E tests to ensure no regressions: `npx playwright test`
  - [ ] 5.6 Manual test: Switch browser tabs, wait 30 seconds, return → verify dashboard loads in < 2 seconds
  - [ ] 5.7 Manual test: Minimize browser for 1 minute, restore → verify all data loads successfully
  - [ ] 5.8 Manual test: Check browser console for duplicate `loadUserData` calls → should see only 1 call
  - [ ] 5.9 Manual test: Check browser console for realtime reconnections → should see no unnecessary reconnections
  - [ ] 5.10 Manual test: Verify character data loads without timeout errors
  - [ ] 5.11 Manual test: Verify quest list loads and displays properly (no "loading quests..." stuck state)
  - [ ] 5.12 Performance validation: Measure dashboard load time on visibility restoration (target < 2 seconds)
  - [ ] 5.13 Run quality gate checks: `npm run build && npm run lint && npm run test`
