# Proposal: Fix Redemption Button UI Sync

## Why

The quest reward management buttons (approve, deny, fulfill) execute backend
mutations successfully but provide no visual feedback and don't update the
pending redemptions list in real time — admins and GMs must manually refresh
to see state changes. This is the same class of realtime-sync regression that
affected other dashboard components and is tracked in GitHub issue #127.

## What Changes

- Approve/deny/fulfill buttons show a loading/disabled state while the
  mutation is in-flight
- On success, the button action triggers a confirmed state update so the card
  reflects the new status immediately
- Pending redemptions list subscribes to realtime Supabase events so all
  admins/GMs see state changes within 100ms without refreshing
- Visual feedback (glow/flash) is shown on cards that update via realtime
  events, consistent with the existing realtime feedback pattern

## Capabilities

### New Capabilities

None — this fix extends existing capabilities.

### Modified Capabilities

- `pending-redemption-display`: Redemption cards must reflect button action
  outcomes (loading state, status change) immediately; real-time sync
  requirement added for the admin view.
- `realtime-subscriptions`: The Reward Realtime Updates requirement must be
  extended to cover redemption *status* changes (approve, deny, fulfill)
  propagating to all open admin/GM sessions in ≤100ms.

## Impact

- Components related to reward redemption management (approve/deny/fulfill
  button handlers and the pending redemptions list container)
- Realtime subscription hook (`useRealtime` / reward-related listeners) —
  needs to handle `redemption` table UPDATE events if not already covered
- No API changes; no new database tables; no breaking changes
- Closes GitHub issue #127
