# Achievement Notification System — Design

## Context

The achievement unlock evaluation engine (#136) writes to
`character_achievements` when progress changes or an
achievement is fully unlocked (sets `unlocked_at`). The
schema already includes a `notified` boolean column
(default `false`) and `REPLICA IDENTITY FULL` on the
table — both anticipating this notification system.

The app has two relevant patterns:

1. **Realtime subscriptions** — one channel per table,
   listener registries that persist across reconnects,
   family-scoped where possible.
2. **Toast notifications** — `useNotification` hook for
   generic toasts, plus the specialized
   `RedeemSuccessToast` pattern for richer, dedicated
   toast components.

## Goals / Non-Goals

**Goals:**

- Deliver real-time in-app toast when a character unlocks
  an achievement
- Display achievement name, description, icon, and
  XP/gold rewards in the toast
- Auto-dismiss after ~5 seconds with manual dismiss
- Queue multiple simultaneous unlocks and show
  sequentially
- Mark `notified: true` to prevent re-showing on refresh
- Follow existing realtime and toast architecture

**Non-Goals:**

- Push notifications (browser/mobile) — future work
- Sound effects — deferred; CSS animation only for now
- Achievement progress toasts (only full unlocks)
- Admin/parent notification of child achievements
- Email or external notification channels

## Decisions

### 1. Dedicated hook + component vs. extending useNotification

**Decision:** Create a dedicated
`useAchievementNotifications` hook and
`AchievementUnlockToast` component, separate from the
generic `useNotification` system.

**Why:** Achievement toasts need richer data (icon,
description, rewards), sequential queuing, and
database writes (`notified` flag). The generic
`useNotification` hook handles simple text messages
with no queue ordering. Extending it would bloat the
generic system. The `RedeemSuccessToast` sets precedent
for dedicated toast components.

**Alternative considered:** Extend `useNotification`
with a new `'achievement'` type. Rejected because it
would require the generic hook to understand
achievement-specific data structures and sequencing.

### 2. Realtime subscription approach

**Decision:** Add a new `achievementUnlock` listener
registry and `character_achievements` channel to the
existing `RealtimeProvider`, following the same pattern
as all other table subscriptions.

**Why:** Consistent with the established one-channel-
per-table architecture. The listener registry pattern
ensures callbacks survive channel reconnects.

**Filter strategy:** `character_achievements` has no
`family_id` column (same situation as
`reward_redemptions`). Subscribe without a filter. The
notification hook will filter client-side by matching
`character_id` against the current character context.

**Alternative considered:** A separate React context
for achievement notifications. Rejected — it would
duplicate the realtime plumbing that `RealtimeProvider`
already manages.

### 3. Detecting new unlocks vs. all changes

**Decision:** Listen for UPDATE events where
`unlocked_at` transitions from null to non-null, and
`notified` is false.

**Why:** The unlock engine first INSERTs a
`character_achievements` row with `unlocked_at = null`
(in-progress), then UPDATEs it when criteria are met.
The meaningful signal is the UPDATE that sets
`unlocked_at`. Checking `notified = false` provides
idempotency.

**Alternative considered:** Listen for INSERT with
`unlocked_at` already set. This could miss achievements
that were inserted as in-progress and later unlocked.
Listening for UPDATE covers both flows.

### 4. Notification queue architecture

**Decision:** A simple array-based queue in the hook.
When realtime delivers unlock events, push to queue.
Display one toast at a time. On dismiss or auto-dismiss,
shift the queue and show the next item.

**Why:** Simultaneous unlocks are uncommon (typically
1-2 at most). A simple queue avoids over-engineering.
No need for a priority system or persistence — if the
user navigates away mid-queue, remaining items will
show via the `notified = false` catch-up fetch.

### 5. Catch-up on mount for missed notifications

**Decision:** On mount, the hook queries
`character_achievements` for rows where
`unlocked_at IS NOT NULL AND notified = false` for the
current character. These are added to the queue ahead
of any realtime events.

**Why:** Covers the case where achievements unlock
while the user is offline or on a different page, or
if the realtime event was missed. The `notified` column
ensures each achievement is shown exactly once.

### 6. Marking notified

**Decision:** Call a Supabase update to set
`notified = true` immediately when a toast is displayed
(not on dismiss).

**Why:** If the user refreshes mid-display, the
achievement won't re-queue. Setting on display rather
than dismiss prevents the edge case where a user
dismisses quickly and refreshes before the write
completes.

**Auth note:** `character_achievements` INSERT/UPDATE
is service-role only per RLS policy. The `notified`
update will need to go through an API route
(`PATCH /api/character-achievements/[id]/notified`)
that uses the service-role client.

### 7. Component placement

**Decision:** Mount `AchievementNotificationManager`
(the component that owns the hook and renders toasts)
inside the `CharacterProvider` in the layout, so it
has access to both realtime context and the selected
character.

**Why:** It needs `useRealtime()` for the subscription
and the current `characterId` to filter events and
query unnotified achievements.

## Risks / Trade-offs

- **No family_id filter on realtime channel** — All
  `character_achievements` events for all families hit
  the client. Client-side filtering by `character_id`
  is cheap, but generates unnecessary network traffic.
  → Mitigation: Same pattern as `reward_redemptions`;
  acceptable at current scale. Can add a DB function or
  view with `family_id` later if needed.

- **Service-role requirement for notified update** —
  Adds an API route for a single-column update.
  → Mitigation: Lightweight route, consistent with
  existing patterns (quest approval, reward redemption).

- **Race between realtime event and catch-up query** —
  On mount, both the catch-up query and a realtime
  event could deliver the same achievement.
  → Mitigation: Deduplicate in the queue by
  `achievement_id`. The `notified` flag provides a
  second layer of protection.

- **Toast stacking if many achievements unlock** —
  Sequential display could feel slow with 5+ unlocks.
  → Mitigation: Unlikely in practice (achievement
  criteria are varied). Could add a "X more unlocked"
  summary toast later if needed.

## Open Questions

- Should the toast include a "View Achievements" link
  that navigates to a future achievements page?
  (Deferred — no achievements page exists yet.)
- Should the CSS animation be configurable per
  achievement rarity/tier? (Deferred — keep simple for
  initial implementation.)
