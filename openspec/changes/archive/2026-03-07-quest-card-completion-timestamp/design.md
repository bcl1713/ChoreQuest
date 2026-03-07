# Design: Quest Card Completion Timestamp

## Context

Quest cards in GM view show title, description, difficulty,
rewards, and status -- but no indication of when the hero
completed the quest. The `completed_at` field already exists
on `quest_instances` and is populated when a hero marks a
quest complete. The `QuestMeta` component renders the
metadata row for all quest cards.

## Goals / Non-Goals

**Goals:**

- Show when a quest was completed on cards with
  `PENDING_APPROVAL` status
- Use a relative time format for recent completions
  (e.g., "2 hours ago") and absolute format for older ones
- Keep the display consistent with existing metadata style

**Non-Goals:**

- Showing completion time on non-pending-approval cards
- Adding any new database columns or API changes
- Changing the approval workflow itself

## Decisions

### 1. Display location: QuestMeta metadata row

Add the completion timestamp as a new metadata item in the
existing flex-wrap row in `QuestMeta.tsx`, alongside
difficulty, XP, gold, etc. This keeps it visually consistent
and requires minimal component changes.

Alternative: A separate banner above the approve/deny
buttons. Rejected because it adds visual weight and breaks
the card's existing layout pattern.

### 2. Formatting: New `formatCompletedTime` utility

Create a `formatCompletedTime` function in
`lib/utils/formatting.ts` that returns:

- "X minutes ago" for < 1 hour
- "X hours ago" for < 24 hours
- "Yesterday at HH:MM AM/PM" for 1 day ago
- "Mon DD at HH:MM AM/PM" for older (e.g., "Mar 5 at
  3:42 PM")

Alternative: Use the existing `formatDateTime` which returns
"Jan 15, 2025, 02:30 PM". Rejected because relative times
are more immediately useful for the approval context
(knowing it was "2 days ago" is more actionable than a raw
date).

Alternative: Pull in a library like `date-fns` or
`timeago.js`. Rejected because the logic is simple enough
to implement inline and avoids a new dependency.

### 3. Conditional display: Only for PENDING_APPROVAL

The timestamp only renders when `quest.status` is
`PENDING_APPROVAL` and `quest.completed_at` is non-null.
This keeps other card views uncluttered.

## Risks / Trade-offs

- **Stale relative times**: If a user leaves the page open,
  "5 minutes ago" won't update. This is acceptable since
  the approval page is typically used for quick actions,
  not long sessions.
- **Timezone handling**: `completed_at` is stored as UTC.
  Using `Date` constructor and `toLocaleTimeString` will
  display in the user's local timezone automatically.
