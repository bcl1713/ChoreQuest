# Fix Realtime Channel Stability

## Why

Realtime updates are not propagating across family members'
dashboards. When one user claims a quest, other users still see it
as available until they manually refresh. The root cause is that
the realtime channel in `RealtimeProvider` is torn down and
recreated on every auth state change (login, token refresh, tab
visibility change) due to the `session` object being in the
`setUpChannel` dependency array. This causes connection instability
and event loss during the async channel recreation gap.

## What Changes

- Remove `user` and `session` from `setUpChannel`'s `useCallback`
  dependency array in `lib/realtime-context.tsx` — the channel only
  needs `family_id` to subscribe, and the Supabase JS client
  manages auth tokens internally for existing WebSocket connections
- Replace the `session`/`user` validation check inside
  `setUpChannel` with a `profile?.family_id` guard (already
  present) so the channel lifecycle is driven solely by family
  membership, not auth token changes
- Fix the auth-context profile subscription
  (`lib/auth-context.tsx`) to remove `session` from its effect
  dependency array and use `supabase.removeChannel()` instead of
  `channel.unsubscribe()` to prevent channel leaks
- Remove `onQuestUpdate`, `onRewardUpdate`,
  `onFamilyMemberUpdate`, `onBossQuestUpdate`, and
  `onBossParticipantUpdate` from their respective hook dependency
  arrays (`useQuests.ts`, `useRewards.ts`, `useFamilyMembers.ts`,
  `useBossQuests.ts`) — these are stable refs (empty deps) and
  don't need to be tracked

## Capabilities

### New Capabilities

None — this is a bug fix to existing realtime infrastructure.

### Modified Capabilities

- `realtime-subscriptions`: The channel lifecycle requirements
  change — the channel must remain stable across auth token
  refreshes and only reconnect when the family_id actually
  changes. Listener registration effects must not include stable
  callback refs in their dependency arrays.

## Impact

- **Code**: `lib/realtime-context.tsx`, `lib/auth-context.tsx`,
  `hooks/useQuests.ts`, `hooks/useRewards.ts`,
  `hooks/useFamilyMembers.ts`, `hooks/useBossQuests.ts`
- **Behavior**: Realtime events will now propagate reliably to all
  connected family members without requiring manual page refresh
- **Dependencies**: None — uses existing Supabase JS client
  capabilities for auth token management on WebSocket connections
