# Tasks: Unified Quest Management Dashboard for Guild Masters

**PRD:** `tasks/0011-prd-unified-quest-management-dashboard.md`
**Issue:** #86
**Version:** v0.4.0

## Relevant Files

### New Files to Create
- `components/quests/quest-card/index.tsx` - Main reusable quest card component ✅
- `components/quests/quest-card/__tests__/index.test.tsx` - Unit tests for quest card component (75 tests) ✅
- `components/quests/quest-card/quest-card-helpers.ts` - Helper functions for quest card logic ✅
- `components/quests/quest-card/__tests__/quest-card-helpers.test.ts` - Unit tests for helpers (26 tests) ✅
- `components/admin/quest-management-tab.tsx` - New Quest Management tab component ✅
- `components/admin/__tests__/quest-management-tab.test.tsx` - Unit tests for Quest Management tab (16 tests) ✅
- `components/quests/quest-dashboard/__tests__/quest-helpers.test.ts` - Unit tests for filter helpers (23 tests) ✅

### Files to Modify
- `components/admin/admin-dashboard.tsx` - Add new Quest Management tab to tab list and panels ✅
- `components/quests/quest-dashboard/quest-helpers.ts` - Add helper functions for quest grouping ✅
- `components/quests/quest-dashboard/index.tsx` - Refactor to use new QuestCard component
- `components/quests/quest-dashboard/quest-list.tsx` - Update to use new QuestCard component
- `components/quests/quest-dashboard/__tests__/quest-list.test.tsx` - Update tests for refactored component

### Files to Reference (Existing)
- `components/quests/quest-dashboard/quest-item.tsx` - Current quest item implementation (will be largely replaced)
- `components/quests/quest-dashboard/__tests__/quest-item.test.tsx` - Existing tests to use as reference
- `hooks/useQuests.ts` - Quest data fetching hook
- `hooks/useFamilyMembers.ts` - Family members data fetching hook
- `lib/utils/colors.ts` - Color utility functions (getDifficultyColor, getStatusColor)
- `lib/utils/formatting.ts` - Formatting utilities (formatDueDate, formatXP, etc.)
- `lib/quest-instance-api-service.ts` - API service for quest operations
- `lib/types/database.ts` - Quest type definitions
- `components/ui/FantasyButton.tsx` - Reusable button component
- `components/ui/FantasyCard.tsx` - Reusable card component

### Notes

- Unit tests should be placed alongside the code files they are testing in a `__tests__` directory
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration
- The existing `quest-item.tsx` has many features we can leverage, but we'll create a fresh `quest-card` component with cleaner separation of concerns

## Tasks

- [x] 1.0 Create reusable QuestCard component with GM action controls
  - [x] 1.1 Create `components/quests/quest-card/` directory and `index.tsx` file
  - [x] 1.2 Define TypeScript interface for QuestCard props (quest, viewMode, action callbacks)
  - [x] 1.3 Implement core quest data display (title, description, difficulty, XP, gold, recurrence, due date)
  - [x] 1.4 Add difficulty color coding using `getDifficultyColor()` utility
  - [x] 1.5 Add status indicator with appropriate color using `getStatusColor()` utility
  - [x] 1.6 Display assigned hero name when quest is assigned
  - [x] 1.7 Implement paused visual state (grayed out with pause icon)
  - [x] 1.8 Add conditional rendering for viewMode ("hero" vs "gm")
  - [x] 1.9 Implement GM action buttons section (assign, approve, cancel, pause/resume)
  - [x] 1.10 Create inline dropdown for hero assignment (dropdown of family members)
  - [x] 1.11 Add Approve button (visible only when status is "COMPLETED")
  - [x] 1.12 Add Cancel/Delete button with appropriate styling
  - [x] 1.13 Add Pause/Resume toggle button
  - [x] 1.14 Wrap component with React.memo for performance optimization
  - [x] 1.15 Apply responsive Tailwind styling consistent with existing fantasy theme
  - [x] 1.16 Add framer-motion animation variants for smooth entrance
  - [x] 1.17 Create `quest-card-helpers.ts` with helper functions (e.g., button visibility logic)
  - [x] 1.18 Write comprehensive unit tests in `__tests__/index.test.tsx`
  - [x] 1.19 Test different quest states (pending, in-progress, completed, paused)
  - [x] 1.20 Test GM vs hero view modes
  - [x] 1.21 Test conditional button visibility based on quest status
  - [x] 1.22 Test action button callbacks fire correctly
  - [x] 1.23 Run tests with `npx jest components/quests/quest-card` and ensure all pass

- [x] 2.0 Add Quest Management tab to Admin Dashboard
  - [x] 2.1 Create `components/admin/quest-management-tab.tsx` file
  - [x] 2.2 Import necessary hooks (useQuests, useFamilyMembers, useAuth)
  - [x] 2.3 Set up component structure with loading and error states
  - [x] 2.4 Create empty state messages for each section (when no quests in that category)
  - [x] 2.5 Create three section headers: "Pending Approval", "Unassigned", "In Progress"
  - [x] 2.6 Add count badges to each section header (e.g., "Pending Approval (3)")
  - [x] 2.7 Implement responsive layout (stack sections vertically, or use grid on larger screens)
  - [x] 2.8 Import and map QuestCard components for each section
  - [x] 2.9 Pass appropriate props to QuestCard (quest data, viewMode="gm", callbacks)
  - [x] 2.10 Open `components/admin/admin-dashboard.tsx` for editing
  - [x] 2.11 Add "Quest Management" to the tabs array with icon and label (e.g., icon: '⚔️', label: 'Quest Management')
  - [x] 2.12 Import QuestManagementTab component
  - [x] 2.13 Add new TabPanel for Quest Management after existing tabs
  - [x] 2.14 Verify tab navigation works and new tab appears in UI
  - [x] 2.15 Write unit tests for quest-management-tab in `__tests__/quest-management-tab.test.tsx`
  - [x] 2.16 Test rendering with mock quest data
  - [x] 2.17 Test empty states for each section
  - [x] 2.18 Test count badges display correct numbers
  - [x] 2.19 Run tests with `npx jest components/admin/quest-management-tab` and ensure all pass

- [x] 3.0 Implement quest grouping and filtering logic
  - [x] 3.1 Open `components/quests/quest-dashboard/quest-helpers.ts`
  - [x] 3.2 Create `filterPendingApprovalQuests()` function (status === "COMPLETED")
  - [x] 3.3 Create `filterUnassignedActiveQuests()` function (no assigned_to_id, active statuses, exclude completed/missed)
  - [x] 3.4 Create `filterInProgressQuests()` function (assigned_to_id exists, status IN_PROGRESS or CLAIMED)
  - [x] 3.5 Create `filterActiveQuestsExcludingCompleted()` helper (exclude COMPLETED, APPROVED, EXPIRED, MISSED)
  - [x] 3.6 Add unit tests for new filter functions in `quest-helpers.test.ts`
  - [x] 3.7 Import and use these filter functions in `quest-management-tab.tsx`
  - [x] 3.8 Use `useMemo` to memoize filtered quest lists for performance
  - [x] 3.9 Ensure paused quests (is_paused: true) are included in filtered lists
  - [x] 3.10 Verify quests are grouped correctly in each section
  - [x] 3.11 Run tests with `npx jest quest-helpers` and ensure all pass

- [ ] 4.0 Wire up GM action handlers (assign, approve, cancel, pause)
  - [ ] 4.1 In `quest-management-tab.tsx`, import questInstanceApiService
  - [ ] 4.2 Create `handleAssignQuest` callback with optimistic UI update
  - [ ] 4.3 Implement assignment logic: update quest.assigned_to_id and set status to PENDING
  - [ ] 4.4 Add error handling and user notification for assignment action
  - [ ] 4.5 Create `handleApproveQuest` callback using `questInstanceApiService.approveQuest()`
  - [ ] 4.6 Implement approval logic: award XP/gold, update status to APPROVED
  - [ ] 4.7 Add success notification on approval
  - [ ] 4.8 Add error handling for approval failures
  - [ ] 4.9 Create `handleCancelQuest` callback with confirmation dialog
  - [ ] 4.10 Implement cancel logic: show confirmation, then delete quest instance
  - [ ] 4.11 Add success notification on cancellation
  - [ ] 4.12 Add error handling for cancellation failures
  - [ ] 4.13 Create `handleTogglePause` callback for pause/resume action
  - [ ] 4.14 Implement pause toggle: update `is_paused` field, keep status unchanged
  - [ ] 4.15 Add visual feedback (optimistic update) when pause state changes
  - [ ] 4.16 Add error handling for pause toggle failures
  - [ ] 4.17 Use `useCallback` to memoize all handler functions
  - [ ] 4.18 Pass handler functions as props to QuestCard components
  - [ ] 4.19 Ensure real-time updates work (quests refresh after actions via useQuests hook)
  - [ ] 4.20 Test all actions manually in development environment
  - [ ] 4.21 Add unit tests for action handlers (mock API calls)
  - [ ] 4.22 Run tests with `npx jest quest-management-tab` and ensure all pass

- [ ] 5.0 Refactor existing quest-dashboard to use new QuestCard component
  - [ ] 5.1 Open `components/quests/quest-dashboard/quest-list.tsx`
  - [ ] 5.2 Import the new QuestCard component
  - [ ] 5.3 Replace rendering logic that uses quest-item with QuestCard
  - [ ] 5.4 Update props passed to QuestCard (set viewMode="hero" for hero dashboard)
  - [ ] 5.5 Ensure existing action handlers (onStart, onComplete, onPickup) are passed correctly
  - [ ] 5.6 Remove or simplify GM-specific sections from hero quest dashboard
  - [ ] 5.7 Open `components/quests/quest-dashboard/index.tsx`
  - [ ] 5.8 Review quest rendering sections and identify areas still using quest-item
  - [ ] 5.9 Replace remaining quest-item usage with QuestCard component
  - [ ] 5.10 Verify "My Quests" section works with new QuestCard
  - [ ] 5.11 Verify "Available Quests" section works with new QuestCard
  - [ ] 5.12 Verify historical quests view works with new QuestCard
  - [ ] 5.13 Update unit tests in `quest-list.test.tsx` for new QuestCard usage
  - [ ] 5.14 Run tests with `npx jest components/quests/quest-dashboard/quest-list` and ensure all pass
  - [ ] 5.15 Measure LOC reduction (target: reduce quest-dashboard/index.tsx from ~1,100 LOC to <600 LOC)
  - [ ] 5.16 Verify all existing quest dashboard functionality still works (manual testing)
  - [ ] 5.17 Consider deprecating quest-item.tsx (can keep for reference or remove if fully replaced)

- [ ] 6.0 Quality gate - tests, build, and final verification
  - [ ] 6.1 Run full test suite with `npm run test` and ensure all tests pass
  - [ ] 6.2 Run build with `npm run build` and ensure zero compilation errors
  - [ ] 6.3 Run lint with `npm run lint` and ensure zero warnings
  - [ ] 6.4 Manually test GM workflow in browser:
    - [ ] 6.4.1 Navigate to Admin Dashboard → Quest Management tab
    - [ ] 6.4.2 Verify quests are grouped correctly (Pending Approval, Unassigned, In Progress)
    - [ ] 6.4.3 Test assigning an unassigned quest to a family member
    - [ ] 6.4.4 Test approving a completed quest
    - [ ] 6.4.5 Test canceling a quest (with confirmation)
    - [ ] 6.4.6 Test pausing and resuming a quest
    - [ ] 6.4.7 Verify paused quests appear grayed out with pause icon
  - [ ] 6.5 Manually test hero quest dashboard:
    - [ ] 6.5.1 Navigate to hero Quest Dashboard
    - [ ] 6.5.2 Verify "My Quests" section displays correctly with QuestCard
    - [ ] 6.5.3 Verify "Available Quests" section displays correctly
    - [ ] 6.5.4 Test starting, completing, and picking up quests
    - [ ] 6.5.5 Verify quest history view works
  - [ ] 6.6 Test responsive design on mobile and tablet screen sizes
  - [ ] 6.7 Verify real-time updates work (open two browser windows, make changes in one, see updates in the other)
  - [ ] 6.8 Check for any console errors or warnings
  - [ ] 6.9 Verify LOC reduction goal achieved (quest-dashboard reduced by ~40-50%)
  - [ ] 6.10 Update TASKS.md with completed status
