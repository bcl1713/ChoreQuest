# Tasks: Refactor Admin Dashboard

## 1. Quest Management Tab — Hook Extraction

- [x] 1.1 Create `useQuestManagementActions` hook in
  `components/admin/useQuestManagementActions.ts` with
  all 8 quest action handlers, confirmation modal state,
  `isProcessing` flag, and assignee selection state
- [x] 1.2 Write tests for `useQuestManagementActions`
  covering assign, approve, deny/cancel/release
  confirmation flow, and error handling

## 2. Quest Management Tab — Section Component

- [x] 2.1 Create `QuestManagementSection` component in
  `components/admin/quest-management-section.tsx`
  extracting the `renderSection` function with title,
  count badge, quest grid, and empty state
- [x] 2.2 Write tests for `QuestManagementSection`
  covering non-empty rendering, empty state, and
  `hideAssignment` prop behavior

## 3. Quest Management Tab — Orchestrator Reduction

- [x] 3.1 Refactor `quest-management-tab.tsx` to compose
  `useQuestManagementActions` and
  `QuestManagementSection`, removing inline handlers
  and render logic
- [x] 3.2 Update existing `quest-management-tab` tests
  to work with the new component composition
- [x] 3.3 Verify `quest-management-tab.tsx` is under
  150 lines

## 4. Quest Dashboard — Data Hook Extraction

- [x] 4.1 Create `useQuestDashboardData` hook in
  `components/quests/quest-dashboard/useQuestDashboardData.ts`
  consolidating all 5 data hooks, combined
  loading/error state, `loadData`, and 7 `useMemo`
  filtering operations
- [x] 4.2 Write tests for `useQuestDashboardData`
  covering combined loading, error, reload, and
  memoized filtering

## 5. Quest Dashboard — Section Components

- [x] 5.1 Create `MyQuestsSection` component in
  `components/quests/quest-dashboard/my-quests-section.tsx`
  with active quests rendering and history hint logic
- [x] 5.2 Create `FamilyQuestSection` component in
  `components/quests/quest-dashboard/family-quest-section.tsx`
  wrapping `FamilyQuestClaiming` with conditional
  rendering
- [x] 5.3 Create `QuestHistorySection` component in
  `components/quests/quest-dashboard/quest-history-section.tsx`
  with internal toggle state and collapsible history
  display
- [x] 5.4 Write tests for all three section components

## 6. Quest Dashboard — Orchestrator Reduction

- [x] 6.1 Refactor `quest-dashboard/index.tsx` to compose
  `useQuestDashboardData`, `useQuestHandlers`, realtime
  hooks, and extracted section components
- [x] 6.2 Update existing quest-dashboard tests to work
  with the new component composition
- [x] 6.3 Verify `quest-dashboard/index.tsx` is under
  150 lines

## 7. Quality Gate

- [x] 7.1 Run `npm run build` — zero TypeScript errors
- [x] 7.2 Run `npm run lint` — zero lint warnings
- [x] 7.3 Run `npm run test` — all tests pass
