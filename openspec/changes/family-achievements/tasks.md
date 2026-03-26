# Family Achievements — Tasks

## 1. Database Schema

- [x] 1.1 Create migration for `family_achievements`
  table with all columns, FK constraints, and
  `trigger_set_timestamp()` trigger
- [x] 1.2 Create migration for
  `family_achievement_progress` table with all columns,
  FK constraints, unique constraint on
  `(family_id, family_achievement_id)`, and trigger
- [x] 1.3 Add indexes on `family_achievements`
  (`family_id`, `category_id`, `criteria_type`) and
  `family_achievement_progress` (`family_id`,
  `family_achievement_id`)
- [x] 1.4 Enable RLS on both tables and create policies:
  family members can read, Guild Masters can manage
  `family_achievements`, service role writes progress
- [x] 1.5 Set `REPLICA IDENTITY FULL` on
  `family_achievement_progress` for realtime support
- [x] 1.6 Seed example family achievements (sum-mode:
  quest_complete 50, gold_earned 1000; all-mode:
  level_reached 5) for existing families
- [x] 1.7 Write migration structure tests validating
  DDL, RLS, indexes, and seed data

## 2. Family Achievement Progress Service

- [x] 2.1 Create `FamilyAchievementProgressService`
  class in
  `lib/family-achievement-progress-service.ts` with
  constructor injection pattern
- [x] 2.2 Implement `updateProgress(familyId, event)`
  method: fetch family achievements, resolve family
  characters, run evaluators, upsert progress
- [x] 2.3 Implement `getProgress(familyId)` method
  returning progress joined with achievement metadata
- [x] 2.4 Create family evaluator registry with entries
  for all 13 criteria types
- [x] 2.5 Implement sum-mode family evaluators
  (aggregate values across all family members)
- [x] 2.6 Implement all-mode family evaluators (return
  minimum value across family members for threshold
  comparison)
- [x] 2.7 Implement `family_evaluation_mode` dispatch
  (`"sum"` default, `"all"` for level/streak checks)
- [x] 2.8 Implement family unlock evaluation (detect
  newly met criteria, set `unlocked_at`, use
  `IS NULL` guard)
- [x] 2.9 Write unit tests for sum-mode evaluators
- [x] 2.10 Write unit tests for all-mode evaluators
- [x] 2.11 Write unit tests for unlock evaluation
- [x] 2.12 Write unit tests for idempotent progress

## 3. Integration with Individual Progress

- [x] 3.1 Modify
  `AchievementProgressService.updateProgress()` to
  trigger `FamilyAchievementProgressService
  .updateProgress()` after individual progress
  completes
- [x] 3.2 Add try/catch around family progress call
  so failures are non-blocking
- [x] 3.3 Write integration tests verifying family
  progress triggers on quest approval, boss completion,
  reward approval, and class change events

## 4. API Routes

- [x] 4.1 Create GET `/api/family-achievements` route
  returning family achievements with progress for
  authenticated user's family
- [x] 4.2 Create POST `/api/admin/family-achievements`
  route for Guild Master creation of family
  achievements
- [x] 4.3 Create GET/PUT/DELETE
  `/api/admin/family-achievements/[id]` routes for
  Guild Master management
- [x] 4.4 Create PATCH
  `/api/family-achievement-progress/[id]/notified`
  route for notification state updates
- [x] 4.5 Write API route tests for all new endpoints

## 5. Notification System

- [x] 5.1 Add realtime subscription to
  `family_achievement_progress` UPDATE events filtered
  by `family_id` in notification hook
- [x] 5.2 Add catch-up query for unnotified family
  achievement unlocks on mount
- [x] 5.3 Integrate family notifications into existing
  notification queue with deduplication
- [x] 5.4 Add "Family Achievement!" label to toast when
  displaying family achievement unlocks
- [x] 5.5 Write tests for family notification
  subscription, catch-up, and queue integration

## 6. Dashboard Display

- [x] 6.1 Create `useFamilyAchievements` hook for
  fetching family achievement data
- [x] 6.2 Create `FamilyAchievementBadge` component
  with unlocked, locked-progress, and locked states
  plus family indicator styling
- [x] 6.3 Create `FamilyAchievementGrid` component
  with responsive layout and category filtering
- [x] 6.4 Create `FamilyAchievementSummary` component
  showing unlock count and progress bar
- [x] 6.5 Create `FamilyAchievementDetailModal`
  component for viewing full achievement details
- [x] 6.6 Create `FamilyAchievementsSection` component
  orchestrating load/error/retry and integrating grid,
  summary, and modal
- [x] 6.7 Add `FamilyAchievementsSection` to dashboard
  page alongside individual achievements
- [x] 6.8 Write component tests for all new components

## 7. Admin Panel

- [x] 7.1 Add "Family Achievements" section to admin
  panel showing all family achievements with progress
- [x] 7.2 Add CRUD interface for Guild Master to
  create/edit/delete family achievements
- [x] 7.3 Write admin component tests
