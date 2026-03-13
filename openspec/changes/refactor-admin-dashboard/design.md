# Design: Refactor Admin Dashboard

## Context

Both `quest-management-tab.tsx` (299 lines) and
`quest-dashboard/index.tsx` (299 lines) are at the 300-line
frontend-architecture spec limit. Each component mixes data
orchestration, action handlers, and section rendering in a
single file. Prior refactoring (issue #89) already extracted
`useQuestHandlers` and `quest-helpers.ts` for the quest
dashboard, but the components themselves still carry too much
responsibility.

The quest-management-tab has 8 `useCallback` handlers for
quest actions plus confirmation modal state inlined directly.
The quest-dashboard combines 5 data hooks, 7 `useMemo` calls,
realtime subscriptions, and 4 distinct rendered sections.

## Goals / Non-Goals

**Goals:**

- Reduce both components well below 300 lines
- Extract action handler + modal logic from
  quest-management-tab into a reusable hook
- Extract quest dashboard sections into standalone
  presentational components
- Consolidate data orchestration into a dedicated hook
- Maintain identical behavior and visual output
- Keep all extracted pieces independently testable

**Non-Goals:**

- Redesigning the UI or changing visual layout
- Changing data fetching patterns or API calls
- Refactoring other admin tabs (reward-manager,
  family-settings, etc.)
- Performance optimization beyond what decomposition
  naturally provides
- Changing the quest-helpers.ts or useQuestHandlers.ts
  utilities that already exist

## Decisions

### 1. Extract `useQuestManagementActions` hook

**Decision:** Create a custom hook that encapsulates all 8
quest action callbacks, the confirmation modal state, and the
`isProcessing` flag from `quest-management-tab.tsx`.

**Rationale:** The handler logic (assign, approve, deny,
cancel, release, confirm) is pure business logic coupled with
notification side effects. Extracting it leaves the component
as a thin rendering layer. This mirrors the existing
`useQuestHandlers` pattern already used in the quest
dashboard.

**Alternative considered:** Merging with the existing
`useQuestHandlers` hook. Rejected because the two hooks serve
different contexts (quest-management-tab uses
`questInstanceApiService` directly with notifications, while
`useQuestHandlers` uses `onError` callback pattern). Merging
would create an overly complex hook with two calling
conventions.

**File:** `components/admin/useQuestManagementActions.ts`

### 2. Extract section rendering into a `QuestManagementSection` component

**Decision:** Extract the `renderSection` function and the
`QuestSection` interface into a standalone presentational
component.

**Rationale:** The `renderSection` local function at line 211
in quest-management-tab is already a de facto component — it
takes data and renders UI. Making it a proper component
enables direct testing and reuse.

**Alternative considered:** Keeping it as a render function.
Rejected because it receives many props via closure and
cannot be tested in isolation.

**File:** `components/admin/quest-management-section.tsx`

### 3. Extract `useQuestDashboardData` hook

**Decision:** Create a hook that consolidates the 5 data
hooks, combined loading/error state, `loadData`, and all 7
`useMemo` filtering operations from quest-dashboard.

**Rationale:** The quest dashboard's data layer (lines 30-166)
is entirely about fetching and transforming data. The
component itself only needs the derived values. This follows
the container/hook split pattern established in the
frontend-architecture spec.

**Alternative considered:** Splitting into multiple smaller
hooks (e.g., `useQuestFiltering`, `useQuestRealtimeSetup`).
Rejected as over-engineering — the filtering is tightly
coupled to the data fetching, and splitting would just move
complexity rather than reduce it.

**File:** `components/quests/quest-dashboard/useQuestDashboardData.ts`

### 4. Extract quest dashboard sections into components

**Decision:** Extract 3 section components:

- `MyQuestsSection` — active quests list with start/complete
  /release actions
- `FamilyQuestSection` — family quest claiming wrapper
- `QuestHistorySection` — collapsible history with toggle
  state

**Rationale:** Each section has distinct data dependencies and
behavior. Extracting them makes the orchestrator a pure
composition layer. The `BossQuestPanel` and
`PendingApprovalsSection` are already extracted.

**Alternative considered:** A single generic
`QuestDashboardSection` component. Rejected because each
section has different props, behavior (e.g., history has
toggle state), and conditional rendering logic.

**Files:**

- `components/quests/quest-dashboard/my-quests-section.tsx`
- `components/quests/quest-dashboard/family-quest-section.tsx`
- `components/quests/quest-dashboard/quest-history-section.tsx`

### 5. Keep realtime subscription in the orchestrator

**Decision:** The `useRealtime` + `useRealtimeHighlight`
setup stays in `quest-dashboard/index.tsx` rather than moving
into the data hook.

**Rationale:** Realtime subscriptions produce visual side
effects (highlight animations) that cross component
boundaries. Keeping them in the orchestrator makes the data
flow explicit — the highlight state is passed down as a prop
to `MyQuestsSection`.

## Risks / Trade-offs

**More files to navigate** — Adding ~6 new files increases
the surface area of the quest module.
Mitigation: All files stay within their existing feature
directories (`components/admin/`, `components/quests/
quest-dashboard/`), following the established feature-first
organization pattern.

**Prop drilling depth increases slightly** — Extracted
section components receive props that the orchestrator
previously accessed directly.
Mitigation: Props remain shallow (one level). The existing
hook-based architecture already handles deep data access.

**Test migration effort** — Existing tests for both
components will need updates to account for the new
component boundaries.
Mitigation: Extract tests alongside components. The
existing test structure uses render-based testing, so most
assertions transfer directly to the new component tests.
