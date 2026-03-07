# Proposal: Realtime Dashboard Updates

**Change ID:** realtime-dashboard-updates

## Problem Statement

After the recent refactor (commit d66cb39), several React components that
display database information lost realtime update functionality. Users are no
longer seeing live updates on the dashboard for:

- User stats (XP, gold, level changes)
- Quest creation
- Quest claiming/completion
- Quest approvals/denials
- Reward system updates
- Family member status changes
- Boss battle participation and updates

This degradation in UX breaks the "real-time collaboration" promise of
ChoreQuest and reduces transparency in family chore management.

## Scope

Enable realtime subscriptions in all React components that display database
information by leveraging the existing `useRealtime()` context and creating
custom data hooks (`useQuests`, `useRewards`, `useFamilyMembers`,
`useBossQuests`) that handle both initial data loading and live subscription
management.

## Current State

- ✅ Realtime infrastructure exists: `useRealtime()` context provides
  subscription methods (`onQuestUpdate`, `onRewardUpdate`,
  `onFamilyMemberUpdate`, `onBossQuestUpdate`, etc.)
- ✅ Custom data hooks already implemented: `useQuests()`, `useRewards()`,
  `useFamilyMembers()`, `useBossQuests()`
- ✅ These hooks integrate with `useRealtime()` and support live updates for
  INSERT/UPDATE/DELETE
- ❌ Many components should use these hooks but either:
  - Use direct Supabase queries without realtime subscriptions
  - Don't use any realtime subscriptions at all
  - Rely on manual refresh workflows instead of pushing updates

## Key Gaps After Recent Refactor

1. Dashboard components (`DashboardContent`, quest displays) may not subscribe
   to all relevant data tables
2. Admin panels (`GuildMasterManager`, `StatisticsPanel`, `QuestManagementTab`)
   may lack realtime subscriptions
3. Character/profile displays may not reflect live XP/gold/level changes
4. Family member stats and activity may not update in real-time
5. Boss battle status may not propagate immediately to participant displays

## Solution Approach

### Phase 1: Audit & Identify Missing Subscriptions

- Inventory all components that fetch database information
- Identify which currently use realtime hooks vs. which need to be added
- Document data entity dependencies (which tables each component needs to
  watch)

### Phase 2: Implement Realtime Subscriptions by Data Domain

Create or enhance hooks for each major data domain:

- **Quest Data**: `useQuests()` (already exists, ensure all dashboard
  components use it)
- **Reward Data**: `useRewards()` (already exists, ensure reward components
  use it)
- **Family Member Data**: `useFamilyMembers()` (already exists, ensure
  admin/roster components use it)
- **Boss Quest Data**: `useBossQuests()` (already exists, ensure boss panels
  use it)
- **Character Stats**: Enhance `useCharacter()` to subscribe to character
  changes for XP/gold/level updates

### Phase 3: Update Components to Use Hooks

- Replace direct Supabase queries with appropriate hooks
- Ensure each dashboard/admin component subscribes to relevant tables
- Add realtime subscription cleanup on unmount

### Phase 4: Test & Validate

- Verify realtime updates across all user flows:
  - Quest creation → immediate display in dashboard
  - Quest claiming → immediate assignment reflection
  - Quest completion → immediate approval notification
  - Approval/denial → immediate status update
  - Reward redemption → immediate gold/inventory change
  - Family member XP gains → immediate leaderboard update
  - Boss battle participation → immediate participant list update

## Success Criteria

- All user-facing dashboards show live updates without manual refresh
- Approvals, denials, completions, claims update within < 100ms across the
  family
- Zero missing realtime subscriptions in components that display database
  information
- All tests pass (build, lint, unit/integration/e2e)

## Estimated Effort

3-5 implementation work items (audit + hook integration + component updates +
testing)

## Risks & Dependencies

- Realtime channel connectivity issues could mask missing subscriptions
- Components may need to handle rapid consecutive updates efficiently
- Character changes (XP/gold/level) might be tied to server-side cron jobs
  with latency
- All user updates must respect RLS family isolation rules

## Clarifications from Product Owner

1. **Character stat updates**: XP, gold, honor, and gem changes SHALL only
   display in the UI after they are confirmed in the database (no optimistic
   updates). This ensures accuracy and prevents misleading temporary values.

2. **Missing realtime components**: All data-fetching components currently lack
   realtime subscriptions and need to be updated. This is a comprehensive
   issue affecting the entire dashboard/admin layer.

3. **Visual indicators for realtime updates**: Yes, add subtle visual indicators
   (e.g., glow/flash effect) when realtime updates occur. This helps users
   notice when data changes without requiring manual refresh and provides
   feedback that the system is syncing live.
