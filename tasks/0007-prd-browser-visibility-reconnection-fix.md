# PRD: Browser Tab Visibility / Focus Reconnection Issues

## Introduction/Overview

When the browser tab loses visibility (user switches tabs, minimizes browser, or computer sleeps), returning to the application causes severe performance degradation and data loading failures. The dashboard shows a loading spinner for exactly 10 seconds, and quest data never loads, displaying "loading quests..." indefinitely. This issue is blocking development/testing workflows, impacts production user experience, and is suspected to contribute to E2E test flakiness.

### Problem Statement

Modern web applications should gracefully handle browser tab visibility changes without requiring manual page refreshes. Currently, ChoreQuest fails to properly reconnect and reload data when users return to the application after the tab has been put to "sleep" by the browser.

## Goals

1. **Eliminate Loading Delays**: Dashboard and all data should load in < 2 seconds when tab regains visibility, matching initial load performance
2. **Ensure Data Loads Successfully**: All data (user profile, family, character, quests) must load successfully on tab visibility restoration
3. **Improve Test Reliability**: Fix suspected root cause of E2E test flakiness related to visibility/focus handling
4. **Maintain Production Stability**: Ensure fix doesn't introduce regressions in normal flow or first-time page loads

## User Stories

1. **As a user**, when I switch back to the ChoreQuest browser tab after working in other applications, I want the dashboard to load quickly (< 2 seconds) so that I can immediately see my quests and character stats

2. **As a user**, when I return to my computer after it has been asleep and open the ChoreQuest tab, I want all my data to load properly without needing to refresh the page

3. **As a developer**, when I run E2E tests that involve multiple page navigations and element interactions, I want the tests to run reliably without timeouts or flaky failures related to visibility handling

4. **As a Guild Master**, when I switch between tabs to check my email and return to ChoreQuest to approve quests, I want the quest list to load immediately without waiting or showing errors

## Current Behavior Analysis

Based on console logs, the following issues occur on tab visibility restoration:

### 1. Duplicate Data Loading
- `loadUserData` is called **3 times** in quick succession:
  - Call 1: During initial session restoration
  - Call 2: On `INITIAL_SESSION` auth state change event
  - Call 3: On `SIGNED_IN` auth state change event
- This creates unnecessary database load and delays loading

### 2. Realtime Connection Churn
- Realtime connection is cleaned up and immediately re-established
- Connection status: `SUBSCRIBED` → `CLOSED` → `SUBSCRIBED`
- This happens because auth state changes trigger realtime context re-initialization
- Unnecessary reconnection overhead delays data availability

### 3. Character Fetch Timeout
- Character fetch times out after exactly **10 seconds** (character-context.tsx:86)
- Timeout suggests database query is hanging or blocking
- Error: `"Character fetch timeout after 10s"`
- This blocks dashboard rendering and prevents quest data from loading

### 4. Quest Data Never Loads
- After character timeout, quest data shows "loading quests..." indefinitely
- No error is logged, suggesting fetch is stuck in pending state
- User must manually refresh page to recover

## Root Cause Hypothesis

### Hypothesis 1: Auth State Change Cascade (Most Likely)
The `onAuthStateChange` subscription (auth-context.tsx:114-141) fires multiple events during visibility restoration:
1. Browser restores tab → Supabase session refreshes
2. `INITIAL_SESSION` event fires → calls `loadUserData`
3. Session token updates → `SIGNED_IN` event fires → calls `loadUserData` again
4. Multiple `loadUserData` calls race, causing realtime context dependencies to change
5. Realtime context tears down and recreates connection
6. Character context's database query hangs during connection churn

### Hypothesis 2: Realtime Context Dependency Thrashing
The realtime context effect (realtime-context.tsx:84-310) depends on `[user, session, profile?.family_id]`. When auth state changes:
1. `user` object reference changes (even if values are same)
2. `session` object reference changes
3. `profile` object reference changes when `loadUserData` completes
4. Each change triggers realtime cleanup and recreation
5. Cleanup interrupts in-flight database queries from character context

### Hypothesis 3: Character Fetch Guard Race Condition
The character context has a fetch guard (`isFetchingRef`) to prevent concurrent fetches:
1. Initial fetch starts when visibility restores
2. Auth state changes, triggering character context re-render
3. New fetch attempt is blocked by guard (character-context.tsx:62-65)
4. Original fetch never completes (possibly interrupted by context cleanup)
5. Guard remains set, blocking all future fetches until 15s safety valve (character-context.tsx:50-59)

## Functional Requirements

### FR1: Prevent Duplicate `loadUserData` Calls
The system must ensure `loadUserData` is called only once per user session, regardless of how many auth state change events fire. Subsequent calls for the same user should be debounced or skipped.

**Acceptance Criteria:**
- ✅ Console logs show `loadUserData` called only once when tab regains visibility
- ✅ No duplicate database queries to `user_profiles` or `families` tables
- ✅ Auth context maintains correct state after visibility restoration

### FR2: Stabilize Realtime Connection During Auth Updates
The system must prevent realtime connection cleanup/recreation when auth state changes do not materially affect connection requirements (same user, same family).

**Acceptance Criteria:**
- ✅ Realtime connection remains `SUBSCRIBED` when tab visibility changes
- ✅ Console logs do not show "Cleaning up realtime connection" followed immediately by "Setting up realtime connection"
- ✅ Realtime events continue to be received without interruption during visibility changes

### FR3: Character Data Loads Successfully Within 2 Seconds
The system must fetch character data successfully within 2 seconds when tab regains visibility.

**Acceptance Criteria:**
- ✅ No character fetch timeout errors in console
- ✅ Character data loads and displays within 2 seconds
- ✅ Character context's `isLoading` state transitions to `false` within 2 seconds

### FR4: Quest Data Loads Successfully
The system must fetch and display quest data after character data loads, without hanging indefinitely.

**Acceptance Criteria:**
- ✅ Quest list displays within 3 seconds of tab regaining visibility
- ✅ No "loading quests..." shown for more than 3 seconds
- ✅ All active quests are displayed correctly

### FR5: Maintain Proper Loading States
The system must show appropriate loading indicators during data fetching but must not show loading spinners longer than actual data fetch time.

**Acceptance Criteria:**
- ✅ Dashboard loading spinner disappears once auth/character data is loaded
- ✅ Loading states accurately reflect actual data fetching operations
- ✅ No loading states remain "stuck" indefinitely

## Technical Requirements

### TR1: Implement Proper Auth State Deduplication
- Use refs or state tracking to prevent duplicate `loadUserData` calls for the same user
- Consider checking if data is already loaded/loading before initiating fetch
- Example: `const prevUserIdRef = useRef<string | null>(null)`

### TR2: Optimize Realtime Context Dependencies
- Use deep equality checks or stable references for realtime effect dependencies
- Consider using `user.id` instead of entire `user` object in dependency array
- Consider using `session.access_token` instead of entire `session` object
- Prevent reconnection when user identity hasn't actually changed

### TR3: Fix Character Fetch Guard Logic
- Review fetch guard implementation (character-context.tsx:62-65)
- Ensure guard is properly cleared on visibility change
- Consider adding visibility change event listener to reset fetch state
- Reduce safety valve timeout from 15s to 5s for faster recovery

### TR4: Add Browser Visibility API Integration
- Listen to `document.visibilityState` changes
- Implement smart reconnection strategy when tab becomes visible
- Optionally refresh data explicitly on visibility change with proper debouncing
- Reference: [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)

### TR5: Add Comprehensive Logging
- Add visibility change event logging
- Log all auth state transitions with timestamps
- Log realtime connection state changes with reasons
- Help diagnose future visibility-related issues

## Non-Goals (Out of Scope)

1. **Offline Data Caching**: This PRD focuses on reconnection, not offline-first architecture
2. **Service Worker Implementation**: Not implementing service workers or background sync
3. **Optimistic UI Updates**: Not implementing optimistic updates during reconnection
4. **WebSocket Fallback**: Not implementing alternative realtime transport protocols
5. **Complete Realtime Rewrite**: Focus on fixing current implementation, not major refactoring
6. **Quest Loading Performance**: Focus is on visibility handling, not general quest query optimization

## Design Considerations

### Auth Context Changes (auth-context.tsx)
- Add `prevUserIdRef` to track last loaded user and skip redundant calls
- Remove `isCreatingFamily` from effect dependency array if possible
- Consider extracting `onAuthStateChange` handler to separate memoized function

### Realtime Context Changes (realtime-context.tsx)
- Change dependency array from `[user, session, profile?.family_id]` to `[user?.id, profile?.family_id]`
- Add comparison logic to skip reconnection if family_id hasn't changed
- Consider adding `reconnect()` method for explicit visibility-triggered reconnection

### Character Context Changes (character-context.tsx)
- Add visibility change listener to clear fetch guard on tab visibility
- Reduce timeout from 10s to 5s
- Add more detailed error logging
- Consider retry logic with exponential backoff

## Testing Requirements

### Unit Tests
- Test that `loadUserData` is only called once per unique user ID
- Test that realtime connection is not recreated when auth state changes but user/family remains same
- Test that character fetch guard is properly cleared after timeout or visibility change
- Test visibility change event handling

### E2E Tests
- **Test 1**: User switches tabs and returns → dashboard loads within 2 seconds
- **Test 2**: User minimizes browser and restores → all data loads successfully
- **Test 3**: Multiple rapid tab switches → no timeouts or stuck loading states
- **Test 4**: Quest list updates properly after visibility restoration

### Manual Testing
- Leave tab inactive for 1 minute, return → verify fast load
- Leave tab inactive for 10 minutes, return → verify fast load
- Computer sleep/wake cycle → verify reconnection
- Network reconnection after offline → verify proper recovery

## Success Metrics

1. **Loading Time**: Dashboard loads in < 2 seconds on visibility restoration (currently 10s+)
2. **Success Rate**: 100% of visibility restorations result in successful data load (currently ~0%)
3. **Test Stability**: E2E tests pass 100% of the time (currently experiencing flakiness)
4. **Database Queries**: No duplicate queries on visibility restoration (currently 3x `loadUserData` calls)
5. **User Complaints**: Zero production bug reports related to "stuck loading" or "need to refresh"

## Implementation Plan (Suggested Approach)

### Phase 1: Diagnosis and Instrumentation
1. Add comprehensive console logging to all context files
2. Add visibility change event listeners with logging
3. Reproduce issue reliably in dev environment
4. Confirm root cause hypothesis with detailed logs

### Phase 2: Auth Context Fixes
1. Implement `prevUserIdRef` to deduplicate `loadUserData` calls
2. Add guard to skip loading if already loading for same user
3. Test that auth flow still works correctly for login/logout/signup

### Phase 3: Realtime Context Fixes
1. Optimize dependency array to use primitive values (user.id) instead of objects
2. Add comparison logic to skip reconnection for same family
3. Test realtime events still fire correctly after changes

### Phase 4: Character Context Fixes
1. Add visibility change listener to reset fetch state
2. Reduce timeout to 5 seconds
3. Add retry logic for failed fetches
4. Test character loading in various scenarios

### Phase 5: Integration Testing
1. Run full E2E test suite to verify no regressions
2. Manual testing of all visibility change scenarios
3. Load testing to ensure no performance degradation
4. Monitor production after deployment for any issues

## Open Questions

1. **Should we implement explicit "reconnect" logic on visibility change, or just fix the existing flow to not break?**
   - Recommendation: Fix existing flow first, add explicit reconnect as optimization if needed

2. **Should realtime connection be kept alive when tab is hidden, or intentionally disconnected to save resources?**
   - Recommendation: Keep alive for now, optimize later if resource usage becomes concern

3. **What is the acceptable timeout for character fetch? Currently 10s, too long for good UX**
   - Recommendation: Reduce to 3-5 seconds based on typical query performance

4. **Should we add retry logic with exponential backoff for all data fetches?**
   - Recommendation: Yes, implement simple retry (1-2 retries) for robustness

5. **Are there other contexts (quest context, reward context) experiencing similar issues?**
   - Recommendation: Investigate during implementation, apply same patterns across all contexts

6. **Should we batch data fetches on visibility restoration instead of loading sequentially?**
   - Recommendation: Good optimization for Phase 2, not critical for initial fix

## Dependencies

- No external library changes required
- Uses existing Supabase client and realtime functionality
- Uses standard Web APIs (Page Visibility API)
- Requires understanding of React hooks and context patterns

## Timeline Estimate

- **Investigation & Diagnosis**: 2-4 hours
- **Implementation**: 4-6 hours
- **Testing**: 2-4 hours
- **Total**: 8-14 hours (1-2 days)

## Priority

**HIGH** - This issue affects:
- Developer productivity (need to refresh frequently)
- Test reliability (suspected cause of flakiness)
- Production user experience (major UX degradation)
- Overall application quality perception
