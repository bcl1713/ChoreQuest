# Design: Fix Redemption Button UI Sync

## Context

Quest reward redemption management has three action buttons — approve, deny,
and fulfill — spread across two components: `PendingRedemptionList` and
`redemption-history`. Both delegate to `useRewardStoreActions`, which calls
`RewardService.updateRedemptionStatus` and tracks per-item loading state
via `updatingId`.

After a successful mutation, `useRewardStoreActions` clears `updatingId` but
**does not update local state**. It relies entirely on the realtime
subscription in `useRewards` to push the update back — if the event doesn't
fire (or fires late), the UI silently shows no change.

A secondary issue: `redemption-history` accepts `onApprove`/`onDeny`/
`onFulfill` callbacks but renders no loading state — buttons remain enabled
throughout the mutation.

## Goals / Non-Goals

**Goals:**

- Buttons always produce a visible outcome: loading state while in-flight,
  updated card immediately after success
- Pending redemption list and history stay in sync across all admin/GM tabs
  within 100ms of any state change
- Visual glow/flash feedback on cards that receive a realtime-driven update,
  consistent with the existing realtime feedback pattern
- `redemption-history` buttons show disabled/loading state during mutations

**Non-Goals:**

- Full data reloads after mutations — state is managed locally in React
- Optimistic updates (pre-emptive state mutation before DB confirmation)
  — confirmed updates only, matching the existing pattern for other tables
- Changes to the underlying `RewardService` API or DB schema
- Fixing any other button type (quests, boss quests)

## Decisions

### Decision 1: In-place state update after confirmed mutation

After `RewardService.updateRedemptionStatus` resolves successfully,
`useRewardStoreActions` shall apply the same in-place state merge that the
realtime handler uses — finding the redemption by ID and updating its fields
in the local `redemptions` array held by `useRewards`.

**Why not reload?** A network round-trip is unnecessary — the app already
knows exactly what changed. React state updated in-place re-renders only the
affected card. This is idiomatic React.

**Why not optimistic?** Other tables in this app apply changes only after DB
confirmation. Staying consistent avoids mixed patterns.

The realtime event from the same client may also arrive shortly after; the
in-place merge is idempotent so a duplicate update is harmless.

### Decision 2: Shared merge function for mutation and realtime paths

Extract a `mergeRedemptionUpdate(redemptions, updatedRecord)` pure function
that both the post-mutation handler and the realtime handler call. This
ensures both paths produce identical state transitions and keeps the logic
DRY.

### Decision 3: Replace full-reload in realtime handler with in-place merge

`useRewards` currently calls `reload()` (full re-fetch) when a
`reward_redemption_updated` event arrives. Replace this with
`mergeRedemptionUpdate`, which is instant and lets the flash animation target
the specific changed card.

### Decision 4: Thread `updatingId` into `redemption-history`

`PendingRedemptionList` already accepts `updatingId` and disables buttons
accordingly. `redemption-history` does not. Wire `updatingId` through
`RewardStore → redemption-history` so both components share the same
loading-state logic.

### Decision 5: Flash animation on realtime-updated cards

When a card's state changes via a realtime event (not from the current user's
own mutation), apply the existing `animate-realtime-glow` CSS class for
500–800ms. This is the same mechanism used by quest cards and character stats.
Distinguish realtime-driven updates from own-mutation updates by checking
whether the `updatingId` is set when the update arrives.

## Risks / Trade-offs

- **Duplicate update:** Post-mutation in-place merge and the realtime event
  from the same client both update the same card. Mitigation: `mergeRedemptionUpdate`
  is idempotent — applying the same record twice produces the same state.
- **Stale user data in merged record:** The realtime payload contains only
  the `reward_redemptions` row; it won't include joined `user` fields.
  Mitigation: preserve the existing `user` sub-object when merging; only
  overwrite scalar redemption fields.

## Migration Plan

1. Extract `mergeRedemptionUpdate` pure function
2. Update `useRewards` — replace full-reload realtime handler with
   `mergeRedemptionUpdate`; expose a `mergeRedemption` setter for the action
   hook to call
3. Update `useRewardStoreActions` — call `mergeRedemption` after each
   successful mutation instead of relying on realtime
4. Update `RewardStore` — pass `updatingId` to `redemption-history`
5. Update `redemption-history` — accept and apply `updatingId` prop
6. Add flash animation to pending + history cards on realtime update

All changes are local to the reward store feature; no other components
are affected. No rollback complexity — reverting is a simple revert commit.

## Open Questions

None — scope is well-defined.
