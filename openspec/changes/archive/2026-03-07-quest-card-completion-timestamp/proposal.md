# Quest Card Completion Timestamp

## Why

When a Guild Master (parent) reviews pending quest approvals
after a delay of a day or more, there is no indication of
when the hero (child) actually completed the quest. This
makes it hard to contextualize what is being approved,
especially when multiple quests pile up. Adding a completion
timestamp to the approval cards gives the GM immediate
context.

## What Changes

- Display the `completed_at` timestamp on quest cards
  when the quest status is `PENDING_APPROVAL`
- Show a human-friendly relative or absolute time
  (e.g., "Completed 2 days ago" or
  "Completed Mar 5 at 3:42 PM")
- The timestamp appears in the `QuestMeta` component
  metadata row, visible in GM view mode
- No database changes required -- `completed_at` already
  exists on `quest_instances`

## Capabilities

### New Capabilities

None -- this is a small UI enhancement using existing data.

### Modified Capabilities

- `frontend-architecture`: Adding completion timestamp
  display to the `QuestMeta` component for quests in
  `PENDING_APPROVAL` status

## Impact

- **Components affected**: `QuestMeta.tsx` (primary),
  potentially `QuestCard` tests
- **No API changes**: `completed_at` is already fetched
  as part of the `QuestInstance` type
- **No database changes**: `completed_at` column already
  exists and is populated when heroes complete quests
- **Formatting utilities**: May add or reuse a date
  formatting helper in `lib/utils/formatting.ts`
