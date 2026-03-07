# Tasks: Quest Card Completion Timestamp

## 1. Formatting Utility

- [x] 1.1 Add `formatCompletedTime` function to
  `lib/utils/formatting.ts` that returns relative time
  for recent dates and absolute time for older dates
- [x] 1.2 Write unit tests for `formatCompletedTime`
  covering: null/invalid input, minutes ago, hours ago,
  yesterday, and older dates

## 2. QuestMeta Component

- [x] 2.1 Add completion timestamp display to `QuestMeta`
  component, shown only when status is `PENDING_APPROVAL`
  and `completed_at` is non-null
- [x] 2.2 Write unit tests for QuestMeta verifying
  timestamp appears for pending approval quests and is
  hidden for other statuses

## 3. Verification

- [x] 3.1 Run full quality gate (build, lint, test) and
  fix any issues
