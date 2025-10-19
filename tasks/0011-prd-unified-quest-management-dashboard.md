# PRD: Unified Quest Management Dashboard for Guild Masters

**Issue:** #86
**Version:** v0.4.0
**Status:** Draft
**Created:** 2025-10-19

## Introduction/Overview

Guild Masters (GMs) currently lack a centralized location to manage all family quest instances. Quest management features are scattered across the quest dashboard, with quest rendering duplicated in ~6 different locations using inconsistent styling. This makes it difficult for GMs to get a comprehensive view of all active, pending, and completed quests across the family, and to efficiently perform common management tasks.

This feature will create a unified quest management dashboard that provides GMs with a single, organized view of all active quest instances, with quick actions for common tasks like assigning quests, approving completions, and managing quest states.

**Problem Statement:** GMs need a better way to see which quests need attention (awaiting approval, unassigned, overdue, etc.) and perform management actions without navigating through multiple views.

## Goals

1. Provide GMs with a single, centralized view of all active family quest instances
2. Eliminate code duplication by creating a reusable quest card component used consistently throughout the app
3. Organize quests by status to highlight what needs GM attention
4. Enable quick GM actions (assign, approve, cancel, pause) directly from quest cards
5. Improve code maintainability by refactoring quest-dashboard.tsx to use the new quest card component
6. Maintain existing functionality while reducing complexity

## User Stories

1. **As a Guild Master**, I want to see all unassigned quests in one place, so that I can quickly assign them to appropriate family members.

2. **As a Guild Master**, I want to see all quests pending my approval, so that I can review and approve completed quests efficiently.

3. **As a Guild Master**, I want to see which quests are in-progress and who they're assigned to, so that I can monitor family activity at a glance.

4. **As a Guild Master**, I want to perform common actions (assign, approve, cancel, pause) directly from each quest card, so that I don't have to navigate away or open modals for simple tasks.

5. **As a Guild Master**, I want paused quests to be visually distinct, so that I can easily identify which quests are temporarily inactive.

6. **As a developer**, I want a single, reusable quest card component, so that quest rendering is consistent across all views and easier to maintain.

## Functional Requirements

### Quest Card Component (quest-card.tsx)

1. The system must provide a reusable `quest-card.tsx` component that displays all relevant quest data:
   - Quest title and description
   - Difficulty level with appropriate color coding
   - XP and gold rewards
   - Recurrence pattern (if recurring)
   - Due date with urgency indicators
   - Assigned hero name (if assigned)
   - Quest status with visual indicators

2. The quest card component must support a "paused" visual state:
   - Grayed out appearance
   - Pause icon indicator
   - Dimmed but still readable

3. The quest card component must conditionally render GM-only action buttons based on quest state:
   - **Assign/Reassign** (inline dropdown): Available for unassigned quests or to reassign
   - **Approve** button: Available for quests in "completed" status awaiting approval
   - **Cancel/Delete** button: Available for all active quests with confirmation
   - **Pause/Resume** button: Toggle between paused and active states

4. The quest card component must support different view modes:
   - Hero view (limited to hero-relevant actions)
   - GM management view (full GM controls)

5. The quest card component must use React.memo for performance optimization

6. The quest card component must maintain consistent styling with existing design system (Tailwind classes, gold/fantasy theme)

### Quest Management Dashboard Tab

7. The system must add a new "Quest Management" tab to the admin dashboard (`admin-dashboard.tsx`)

8. The Quest Management tab must display only active quest instances:
   - Exclude completed quests
   - Exclude missed quests
   - Include paused quests (with visual distinction)
   - **Note:** Completed and missed quests remain in Overview > Recent Activity

9. The Quest Management tab must organize quests by status in separate sections:
   - **Pending Approval** (quests marked complete by heroes, awaiting GM approval)
   - **Unassigned** (active quests not yet assigned to any hero)
   - **In Progress** (quests assigned and actively being worked on)
   - Each section should show a count badge (e.g., "Pending Approval (3)")

10. Each quest in the management dashboard must use the new quest-card component

11. The assign action must use an inline dropdown:
    - Display dropdown of family members directly on the quest card
    - Immediate assignment on selection (no separate confirmation)
    - Optimistic UI update

12. The approve action must:
    - Award XP and gold to the assigned hero
    - Update quest status to "completed"
    - Move quest instance out of management dashboard
    - Show success notification

13. The cancel/delete action must:
    - Show confirmation dialog before deletion
    - Permanently remove the quest instance
    - Show success notification

14. The pause/resume action must:
    - Toggle the quest's paused state
    - Update visual appearance immediately
    - Not affect quest due dates or recurrence

### Quest Dashboard Refactoring

15. The system must refactor `quest-dashboard.tsx` to use the new quest-card component for all quest rendering

16. The refactored quest dashboard must maintain all existing functionality:
    - "My Quests" section for the logged-in hero
    - "Available Quests" section for claimable family quests
    - All existing filters and sorting options

17. The refactored quest dashboard must remove or simplify GM-specific sections that are better suited for the management dashboard

18. The refactored quest dashboard must reduce code duplication (currently ~1,100 LOC with duplicated rendering logic)

### Quest Templates

19. Quest templates must remain on their current admin dashboard tab, separate from quest instance management (no changes to template management in this feature)

## Non-Goals (Out of Scope)

1. **Inline editing of quest details** - Quest cards are view-only with action buttons; editing quest properties (due date, XP, gold, description) requires opening a modal/form (existing functionality)

2. **Historical quest view** - Completed and missed quests will NOT appear in the Quest Management dashboard; they remain in Overview > Recent Activity

3. **Quest template management** - Templates are managed on their existing admin tab, not integrated into this new dashboard

4. **Drag-and-drop assignment** - Assignment uses inline dropdowns, not drag-and-drop UI

5. **Quest creation** - Creating new quests remains in the existing quest creation flow; this feature focuses only on managing existing quest instances

6. **Mobile-specific optimizations** - Follow existing responsive design patterns, but no special mobile-only features for this dashboard

## Design Considerations

### Quest Card Visual Design

- Use existing design system components and Tailwind classes
- Maintain gold/fantasy theme consistent with app
- Difficulty colors: Use existing `getDifficultyColor()` utility
- Status indicators: Use appropriate color coding (green for completed, yellow for pending, etc.)
- Paused state: Gray filter/overlay with pause icon
- Hover states: Subtle glow effect on interactive elements

### Layout

- Admin dashboard tab layout follows existing tab pattern
- Status sections use card grid or list layout (responsive)
- Quest cards should have consistent max-width for readability
- Action buttons positioned consistently on each card (likely bottom-right or as overlay)

### Dropdown for Assignment

- Use existing dropdown/select component if available
- Show family member name and class icon
- Sort alphabetically or by level
- Include "Unassign" option for reassignment scenarios

## Technical Considerations

### Component Architecture

- Location: `components/quests/quest-card.tsx` (following new component organization from #91)
- Use TypeScript with proper Quest type from `lib/types/database.ts`
- Props interface should include:
  - `quest`: Quest instance object
  - `viewMode`: "hero" | "gm"
  - `onAssign?`: Callback for assignment
  - `onApprove?`: Callback for approval
  - `onCancel?`: Callback for cancellation
  - `onPause?`: Callback for pause/resume

### State Management

- Quest data fetching: Use existing `useQuests` hook (created in #91)
- Family members data: Use existing `useFamilyMembers` hook (created in #91)
- Real-time updates: Leverage existing Supabase subscriptions
- Optimistic updates for better UX on actions

### Performance

- Use React.memo on quest-card component
- Use useMemo for filtered/grouped quest lists
- Use useCallback for action handlers to prevent re-renders
- Limit initial render count if quest list is very long (pagination or virtual scrolling as future enhancement)

### Testing

- Comprehensive unit tests for quest-card component:
  - Rendering different quest states
  - Conditional button visibility
  - Paused state styling
  - GM vs hero view modes
- Tests for Quest Management tab:
  - Quest grouping by status
  - Action button callbacks
  - Empty states for each section
- Update existing quest-dashboard tests for refactored component

### Dependencies

- Existing hooks: `useQuests`, `useFamilyMembers` (from #91 refactor)
- Existing utilities: `getDifficultyColor`, formatting utilities
- Supabase client for real-time subscriptions
- Admin dashboard component structure

## Success Metrics

1. **Code Reduction**: `quest-dashboard.tsx` reduced from ~1,100 LOC to <600 LOC through component reuse
2. **DRY Principle**: Quest rendering logic exists in exactly one place (quest-card component)
3. **Consistency**: All quest displays across the app use the same quest-card component
4. **Test Coverage**: Maintain or improve overall test coverage (currently ~48%)
5. **Build Quality**: Zero compilation errors, zero lint warnings, all tests passing
6. **GM Efficiency**: GMs can view and manage all active quests from a single dashboard tab

## Open Questions

1. Should the Quest Management dashboard remember the last-viewed section (Pending Approval vs Unassigned vs In Progress) in local storage?

2. Should there be a search/filter bar at the top of the Quest Management tab to search by quest name or hero name?

3. For quests with no due date, what should the urgency indicator show? (Currently some logic may assume due dates exist)

4. Should recurring quests show their next scheduled instance in the management view, or only the current active instance?

5. When approving a quest, should there be a quick-approve button (one-click) vs a review modal showing what XP/gold will be awarded?

6. Should the approval action allow GM to modify XP/gold rewards before approving, or use the quest's defined rewards exactly?

## Implementation Phases

### Phase 1: Quest Card Component
- Create `quest-card.tsx` component
- Implement core rendering logic
- Add GM action buttons (assign, approve, cancel, pause)
- Write comprehensive tests
- Verify component works in isolation

### Phase 2: Quest Management Dashboard Tab
- Add new tab to admin dashboard
- Implement quest grouping by status
- Connect quest-card components
- Wire up action handlers
- Add empty states

### Phase 3: Quest Dashboard Refactoring
- Replace quest rendering in quest-dashboard.tsx with quest-card
- Remove duplicated code
- Update tests
- Verify all existing functionality works

### Phase 4: Testing & Refinement
- End-to-end GM workflow testing
- Performance testing with large quest counts
- Responsive design verification
- Code review and cleanup

---

## Related Issues

- Parent: #89 - Refactor: Component Architecture Best Practices (v0.4.0)
- Related: #48 - Refactor: Large admin-dashboard.tsx Component
- Builds on: #91 - Component Architecture Refactor Complete (hooks and utilities)

## References

- Quest Dashboard: `components/quests/quest-dashboard.tsx` (post-refactor location)
- Admin Dashboard: `components/admin/admin-dashboard.tsx`
- Quest Types: `lib/types/database.ts`
- Existing Hooks: `hooks/useQuests.ts`, `hooks/useFamilyMembers.ts`
