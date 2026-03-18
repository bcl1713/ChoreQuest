# Tasks: Fix Redemption Button UI Sync

## 1. Tests (Red Phase)

- [x] 1.1 Write tests for `mergeRedemptionUpdate` pure function — merges
  scalar fields, preserves existing `user` sub-object, is idempotent
- [x] 1.2 Write tests for `useRewards` — realtime handler calls
  `mergeRedemptionUpdate` instead of full reload
- [x] 1.3 Write tests for `useRewardStoreActions` — `updateRedemptionStatus`
  calls `mergeRedemption` after successful approve, deny, and fulfill
- [x] 1.4 Write tests for `redemption-history` — buttons are disabled when
  `updatingId` matches the card's redemption ID

## 2. mergeRedemptionUpdate Utility

- [x] 2.1 Extract `mergeRedemptionUpdate(redemptions, updatedRecord)` as a
  pure function — finds redemption by ID, merges scalar fields, preserves
  joined `user` data

## 3. useRewards Hook

- [x] 3.1 Replace the full-reload realtime handler for
  `reward_redemption_updated` with `mergeRedemptionUpdate`
- [x] 3.2 Expose a stable `mergeRedemption` callback so `useRewardStoreActions`
  can call it directly after a confirmed mutation

## 4. useRewardStoreActions

- [x] 4.1 Accept `mergeRedemption` from `useRewards` (passed in or sourced
  via the hook)
- [x] 4.2 Call `mergeRedemption` with the updated record after each
  successful mutation in `updateRedemptionStatus` (approve, deny, fulfill)

## 5. redemption-history Component

- [x] 5.1 Add `updatingId: string | null` prop to the component's props
  interface
- [x] 5.2 Disable and show loading state on approve/deny/fulfill buttons
  when `updatingId` matches the current card's redemption ID

## 6. RewardStore (Main Orchestrator)

- [x] 6.1 Pass `updatingId` from `useRewardStoreActions` down to
  `redemption-history`

## 7. Realtime Flash Animation

- [x] 7.1 Track which redemption IDs were updated via realtime events
  (not own mutations) in `useRewards` or a local state flag
- [x] 7.2 Apply `animate-realtime-glow` to pending redemption cards that
  received a remote realtime update
- [x] 7.3 Apply `animate-realtime-glow` to history cards that received a
  remote realtime update

## 8. Quality Gate

- [x] 8.1 `npm run build` — zero TypeScript errors
- [x] 8.2 `npm run lint` — zero lint errors or warnings
- [x] 8.3 `npm run test` — all tests pass
