# Tasks: Realtime Dashboard Updates Implementation

## Critical Bug Fix (COMPLETED)

### Critical Issue: Realtime Subscription Dependency Array Bug

**Status**: ✅ COMPLETED (commit: 06d8d92)

The root cause of realtime updates not propagating was incorrect dependency arrays
in all data hooks (useQuests, useRewards, useFamilyMembers, useBossQuests).

**Problem**:

- Hooks included realtime registration functions in dependency arrays
- Functions like `onQuestUpdate`, `onRewardUpdate`, etc. are registration methods
- These functions should NEVER change - they always add to the same listener
  registries
- Including them caused unnecessary re-subscriptions and potential listener
  deduplication
- Effects could be set up and immediately cleaned up, breaking realtime
  subscriptions

**Solution**:

- Removed realtime function references from dependency arrays
- Added `eslint-disable-next-line react-hooks/exhaustive-deps` comments with
  explanations
- Ensured subscriptions remain stable for entire component lifecycle

**Files Fixed**:

- `hooks/useQuests.ts` - Removed `onQuestUpdate` from dependencies
- `hooks/useRewards.ts` - Removed `onRewardUpdate` and
  `onRewardRedemptionUpdate` from dependencies
- `hooks/useFamilyMembers.ts` - Removed `onFamilyMemberUpdate` from
  dependencies
- `hooks/useBossQuests.ts` - Removed `onBossQuestUpdate` and
  `onBossParticipantUpdate` from dependencies

**Impact**: Quest updates, completions, approvals, and other data changes now propagate
immediately via realtime subscriptions without requiring manual refresh.

---

## Task Breakdown

### Task 1: Enhance useCharacter Hook with Realtime Subscription

**Objective**: Add realtime subscription to `useCharacter()` hook to track XP,
gold, level, and class changes.

**Implementation**:

- Add `onCharacterUpdate()` subscription from `useRealtime()` context
- Subscribe to character table changes for current user's character
- Handle UPDATE events optimistically (XP, gold, level changes)
- Ensure cleanup on component unmount

**Acceptance Criteria**:

- Character XP changes visible within 100ms on dashboard
- Character gold balance updates in real-time
- Level-up events trigger immediately
- No memory leaks from subscriptions
- All existing tests still pass

**Files to Modify**:

- `hooks/useCharacter.ts` - Add realtime subscription

**Estimated Effort**: 1 work item

---

### Task 2: Audit All Data-Fetching Components

**Objective**: Identify all React components that fetch database information and
determine which are missing realtime subscriptions.

**Implementation**:

- Search codebase for Supabase `.from().select()` queries
- Map each component to its data dependencies (tables)
- Check if component uses realtime hooks (useQuests, useRewards, etc.)
- Document gaps in realtime subscription coverage
- Prioritize by impact (dashboard/admin components first)

**Acceptance Criteria**:

- Complete inventory of all data-fetching components
- Clear mapping of component → tables → realtime coverage
- Gaps documented with priority levels
- Report ready for Phase 3 component updates

**Files to Reference** (no code changes):

- `components/**/*.tsx` - All components
- `hooks/*.ts` - All data hooks
- `app/**/*.tsx` - Page components

**Estimated Effort**: 1 work item

---

### Task 3: Update DashboardContent to Use All Relevant Hooks

**Objective**: Ensure `DashboardContent` component subscribes to all data it
needs (quests, character, templates).

**Implementation**:

- Verify `useCharacter()` is used and includes realtime subscription (from Task
  1)
- Verify `useQuestTemplates()` uses realtime subscription
- Subscribe to realtime approval events via `useRealtime()` for overlay display
- Remove any direct Supabase queries that should use hooks
- Test that all data updates appear immediately

**Acceptance Criteria**:

- All data displayed on dashboard updates in realtime
- Character stats (XP, gold, level) update immediately
- Approval notifications appear within 100ms
- No stale data visible to user
- All existing dashboard tests pass

**Files to Modify**:

- `components/dashboard/dashboard-content.tsx` - Update hook usage

**Estimated Effort**: 1 work item

---

### Task 4: Update QuestDashboard to Use Realtime Hooks Consistently

**Objective**: Ensure `QuestDashboard` uses all realtime data hooks and
subscriptions.

**Implementation**:

- Verify `useQuests()` is used for quest_instances realtime
- Verify `useFamilyMembers()` is used for family roster realtime
- Verify `useCharacter()` is used with realtime subscription (from Task 1)
- Verify `useBossQuests()` is used for boss battle realtime
- Remove any direct Supabase queries that should use hooks
- Test all quest operations (create, claim, complete, approve, deny) update
  immediately

**Acceptance Criteria**:

- Quest creation visible immediately across all family members
- Quest claims reflected instantly
- Quest completions trigger approval notifications immediately
- Approvals/denials update quest status within 100ms
- All existing quest dashboard tests pass

**Files to Modify**:

- `components/quests/quest-dashboard/index.tsx` - Update hook usage

**Estimated Effort**: 1 work item

---

### Task 5: Update Admin Panel Components for Realtime Updates

**Objective**: Ensure admin panels (`GuildMasterManager`, `StatisticsPanel`,
`QuestManagementTab`) have full realtime subscriptions.

**Implementation**:

- Update `GuildMasterManager` to use `useFamilyMembers()` hook with realtime
- Verify `StatisticsPanel` subscribes to character stats changes for XP/level
  updates
- Verify `QuestManagementTab` uses `useQuests()` with realtime subscription
- Remove any direct Supabase queries that should use hooks
- Test that admin views reflect all family member activities in real-time

**Acceptance Criteria**:

- Family member roles update immediately when changed
- Character XP/level changes visible in real-time on statistics
- Quest approvals/denials visible immediately in admin queue
- No manual refresh needed for admin operations
- All existing admin panel tests pass

**Files to Modify**:

- `components/admin/guild-master-manager.tsx` - Use realtime hooks
- `components/admin/statistics-panel.tsx` - Subscribe to character updates
- `components/admin/quest-management-tab.tsx` - Use realtime hooks

**Estimated Effort**: 2 work items

---

### Task 6: Update Reward Components for Realtime Updates

**Objective**: Ensure reward store and manager components have full realtime
subscriptions.

**Implementation**:

- Verify `RewardStore` uses `useRewards()` with realtime subscription
- Verify `RewardManager` uses `useRewards()` with realtime subscription
- Ensure redemption history updates immediately when redemptions change
- Test that reward creation, deletion, and redemption all propagate instantly
- Remove any direct Supabase queries that should use hooks

**Acceptance Criteria**:

- Reward creation visible immediately in store
- Redemption requests visible immediately in approval queue
- Gold balance updates after redemption within 100ms
- Reward deletions propagate to all family members immediately
- All existing reward tests pass

**Files to Modify**:

- `components/rewards/reward-store/index.tsx` - Verify realtime usage
- `components/rewards/reward-manager/index.tsx` - Verify realtime usage

**Estimated Effort**: 1 work item

---

### Task 7: Implement Visual Feedback for Realtime Updates

**Objective**: Add subtle visual indicators (glow, flash, pulse effects) to
provide user feedback when realtime updates occur.

**Implementation**:

- Create a reusable Framer Motion animation component for glow/flash effects
- Apply glow effect to quest cards when created or status changes via realtime
- Apply flash effect to character stat displays when XP/gold/level/honor/gems
  update
- Apply pulse effect to family member roster rows when roles/status change
- Ensure effects are subtle (500-800ms duration) and don't distract from content
- Use existing Framer Motion patterns from the codebase

**Acceptance Criteria**:

- Quest updates show glow/flash effect on dashboard
- Character stat updates show flash effect with visual feedback
- Family member role changes show pulse effect in admin panels
- All effects are subtle and non-intrusive (under 1 second duration)
- Effects work across all component types affected by realtime updates
- All existing animations tests still pass

**Files to Create/Modify**:

- Create: `components/animations/RealtimeUpdateEffect.tsx` - Reusable effect
  component
- Modify: Components that display realtime-updated data to use effect component

**Estimated Effort**: 1 work item

---

### Task 8: Update Boss Quest Components for Realtime Updates

**Objective**: Ensure boss quest panels have full realtime subscriptions for
participation tracking.

**Implementation**:

- Verify `BossQuestPanel` uses `useBossQuests()` with realtime subscription
- Verify `BossQuestActiveCard` displays realtime participant updates
- Ensure boss quest creation visible immediately to all family members
- Ensure participation changes (join/leave) reflected within 100ms
- Test that boss quest completion triggers immediately across family

**Acceptance Criteria**:

- Boss quest creation appears immediately to all family members
- Participant joins/leaves visible within 100ms
- Boss quest status changes propagate instantly
- Boss quest deletion visible immediately
- All existing boss quest tests pass

**Files to Modify**:

- `components/boss/boss-quest-panel.tsx` - Verify realtime hooks
- `components/boss/boss-quest-active-card.tsx` - Update realtime display

**Estimated Effort**: 1 work item

---

### Task 9: Comprehensive Testing & Validation

**Objective**: Verify all realtime subscriptions work end-to-end across all
components.

**Implementation**:

**Unit Tests**:

- Test each hook's realtime event handlers (INSERT/UPDATE/DELETE)
- Test state updates are correct and optimistic
- Test subscription cleanup on unmount
- Mock Supabase realtime events and verify hook behavior

**Integration Tests**:

- Test complete data flow: API change → Supabase realtime event → hook update
  → component re-render
- Test multiple components subscribed to same data update correctly
- Test error handling when realtime subscription fails
- Test fallback behavior when realtime disconnects

**E2E Tests**:

- Multi-user quest approval workflow with realtime sync
- Family member creating quest → all others see immediately
- User claiming quest → assigner sees status change immediately
- User completing quest → approver receives notification immediately
- Reward redemption → gold balance updates immediately
- Character XP gain → leaderboard updates immediately
- Boss quest creation → all family members see immediately
- Boss quest participation → participant list updates immediately

**Acceptance Criteria**:

- All unit tests pass (0 failures, 0 skips)
- All integration tests pass (0 failures, 0 skips)
- All E2E tests pass (0 failures, 0 skips)
- Build passes: `npm run build`
- Lint passes: `npm run lint`
- Tests pass: `npm run test`
- No console warnings or errors related to realtime subscriptions

**Files to Create/Modify**:

- `hooks/*.test.ts` - Realtime event handling tests
- E2E test files for multi-user workflows

**Estimated Effort**: 2 work items

---

### Task 10: Code Review & Documentation

**Objective**: Review all changes, ensure code quality, and document
implementation decisions.

**Implementation**:

- Code review of all component and hook changes
- Verify consistency with project conventions
- Update component documentation if realtime behavior changed
- Document any breaking changes or migration paths
- Ensure all TypeScript types are correct

**Acceptance Criteria**:

- All code follows project style and conventions
- No `eslint-disable` comments without justification
- All types are properly inferred (no `any`)
- Documentation updated for changed components
- No TODOs or FIXMEs left in code

**Files to Review**:

- All modified components and hooks from Tasks 1-7
- Tests from Task 8

**Estimated Effort**: 1 work item

---

## Work Item Summary

| Task | Description | Effort | Dependencies |
| --- | --- | --- | --- |
| 1 | Enhance useCharacter with realtime | 1 | None |
| 2 | Audit all data-fetching components | 1 | None |
| 3 | Update DashboardContent | 1 | Task 1, 2 |
| 4 | Update QuestDashboard | 1 | Task 1, 2 |
| 5 | Update admin panels | 2 | Task 1, 2 |
| 6 | Update reward components | 1 | Task 2 |
| 7 | Implement visual feedback effects | 1 | None (can run in parallel) |
| 8 | Update boss quest components | 1 | Task 2 |
| 9 | Testing & validation | 2 | Tasks 1-8 |
| 10 | Code review & documentation | 1 | Tasks 1-9 |

**Total Estimated Effort**: 12 work items

**Suggested Execution Order**:

1. Run Tasks 1-2 in parallel
2. Run Tasks 3-7 and 8 in parallel (Tasks 3-6, 8 depend on 1-2; Task 7 is
   independent)
3. Run Task 9 (all components must be updated first)
4. Run Task 10 (final review after all tests pass)

**Critical Path**: 1 + 2 + 3-8 (max) + 9 + 10 ≈ 4-6 days for experienced
developer (added 1 day for visual feedback animation implementation)
