# Fix Realtime Channel Stability — Design

## Context

The `RealtimeProvider` in `lib/realtime-context.tsx` manages a
single Supabase Realtime channel per family. The channel subscribes
to `postgres_changes` on eight tables filtered by `family_id`. A
listener registry pattern (Set-based add/emit/clear) decouples the
channel from consumer hooks (`useQuests`, `useRewards`, etc.).

Currently, `setUpChannel` is wrapped in `useCallback` with
dependencies `[waitForReady, user, session, profile?.family_id]`.
Because `session` is a new object reference on every auth event
(`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`), the channel
is destroyed and recreated on each event. The async gap during
recreation (due to `await waitForReady()`) causes lost events.

Similarly, `lib/auth-context.tsx` creates a profile-subscription
channel with `session` in its effect deps, and cleans it up with
`channel.unsubscribe()` instead of `supabase.removeChannel()`,
leaving orphaned channel objects in the Supabase client's internal
channel list.

## Goals / Non-Goals

**Goals:**

- Channel remains connected across auth token refreshes
- Channel only reconnects when `family_id` actually changes
- Listener registration effects are stable (no unnecessary
  re-subscriptions)
- Auth-context profile subscription channel is properly cleaned up

**Non-Goals:**

- Changing the listener registry architecture (it works correctly)
- Adding reconnection logic beyond what Supabase JS provides
- Changing how mutations trigger realtime events (server-side)
- Adding optimistic UI updates for quest claiming

## Decisions

### 1. Remove `session` and `user` from `setUpChannel` deps

**Decision:** Change `setUpChannel` dependencies from
`[waitForReady, user, session, profile?.family_id]` to
`[waitForReady, profile?.family_id]`.

**Rationale:** The Supabase JS client manages auth tokens
internally for WebSocket connections. When `TOKEN_REFRESHED`
fires, the client calls `realtime.setAuth(newToken)` on the
existing connection. Destroying and recreating the channel is
unnecessary and harmful.

**Alternative considered:** Using refs for `user`/`session`
validation — rejected because `profile?.family_id` being truthy
is already a sufficient proxy for "authenticated with a family."

### 2. Simplify `setUpChannel` validation

**Decision:** Replace the multi-field validation check
(`!user || !session || !familyId || !session.access_token`) with
a single `!familyId` guard.

**Rationale:** If `profile?.family_id` is set, the user is
necessarily authenticated and has a valid session. The redundant
checks only served to pull `user` and `session` into the
dependency array.

### 3. Use `supabase.removeChannel()` in auth-context

**Decision:** Replace `channel.unsubscribe()` with
`supabase.removeChannel(channel)` in the auth-context profile
subscription cleanup.

**Rationale:** `unsubscribe()` sends the leave message but does
not remove the channel from the client's internal channel list.
Over time this accumulates orphaned channel objects.
`removeChannel()` does both.

### 4. Remove `session` from auth-context profile subscription deps

**Decision:** Remove `session` from the effect dependency array
at `lib/auth-context.tsx:186`. Use a ref to access the current
session inside the callback if needed.

**Rationale:** Same issue as `setUpChannel` — `session` changes
on every auth event, causing the profile subscription channel to
be torn down and recreated unnecessarily.

### 5. Remove stable callback refs from hook dep arrays

**Decision:** Remove `onQuestUpdate`, `onRewardUpdate`,
`onFamilyMemberUpdate`, `onBossQuestUpdate`, and
`onBossParticipantUpdate` from their respective hook effect
dependency arrays. Add `eslint-disable-next-line` comments with
justification.

**Rationale:** These callbacks are created with
`useCallback(..., [])` — they never change. Including them is
harmless in practice (since they're stable), but removing them
makes the intent clear and prevents future issues if the
callbacks ever gain dependencies.

## Risks / Trade-offs

- **[Risk] Channel stays connected with stale auth:** If the
  Supabase JS client fails to update the realtime auth token, the
  channel could become unauthorized.
  → **Mitigation:** The Supabase JS client handles this
  internally via `onAuthStateChange`. The `isConnected` state and
  `CHANNEL_ERROR` handling in the subscribe callback provide
  visibility if this occurs.

- **[Risk] eslint-disable comments:** Suppressing the
  `react-hooks/exhaustive-deps` rule requires care.
  → **Mitigation:** Each suppression includes a comment explaining
  why the dependency is intentionally omitted. The callbacks are
  provably stable (empty dependency arrays).

- **[Trade-off] Less defensive validation in `setUpChannel`:**
  Removing the `user`/`session` checks means we rely on
  `profile?.family_id` as the sole gate.
  → **Acceptable** because `profile` is only set after successful
  auth and profile load. If auth fails, `profile` is null and
  `family_id` is undefined.
