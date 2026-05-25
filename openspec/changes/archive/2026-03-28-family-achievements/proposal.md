# Family Achievements

## Why

The achievement system currently tracks only individual
character progress. Families lack shared goals that foster
cooperation and give everyone something to work toward
together. Family achievements create collective milestones
(e.g., "Family completes 50 quests total", "All members
reach level 5") that encourage teamwork and make the family
unit feel meaningful beyond just sharing a household code.

## What Changes

- Add a `family_achievements` table for achievements
  scoped to the family as a whole, with aggregate
  criteria evaluated across all family members
- Add a `family_achievement_progress` table tracking
  aggregate family-level progress toward family
  achievements
- Create a `FamilyAchievementProgressService` that
  aggregates progress across all characters in a family
- Add family achievement evaluators that query across
  all family members (total quests, collective gold,
  all-members-at-level, etc.)
- Add family achievement unlock evaluation with
  family-scoped reward distribution
- Display family achievements in a dedicated section
  on the dashboard, visible to all family members
- Family achievement unlock notifications visible to
  all online family members simultaneously via realtime
- Guild Master can view family achievement progress in
  the admin panel
- Seed example family achievements across multiple
  criteria types

## Capabilities

### New Capabilities

- `family-achievement-progress`: Family-scoped
  achievement progress aggregation, evaluation, unlock,
  notifications, and display. Covers the new database
  tables, aggregation service, family evaluators, family
  unlock engine, family notification broadcasting,
  dashboard display section, and admin panel view.

### Modified Capabilities

- `achievement-schema`: Add `family_achievements` and
  `family_achievement_progress` tables, RLS policies
  scoped to family_id, realtime support, and seed data
  for family achievements
- `achievement-notification`: Extend notification system
  to broadcast family achievement unlocks to all online
  family members simultaneously (not just the triggering
  character)
- `achievement-badge-display`: Add a dedicated "Family
  Achievements" section on the dashboard showing
  family-scoped achievement badges, progress, and
  summary

## Impact

- **Database**: Two new tables (`family_achievements`,
  `family_achievement_progress`), new RLS policies, new
  indexes, new seed data migration
- **Backend services**: New
  `FamilyAchievementProgressService` with family-scoped
  evaluators; existing
  `AchievementProgressService.updateProgress()` needs to
  trigger family progress evaluation after individual
  progress completes
- **Realtime**: Family achievement unlock events need to
  broadcast to all family members, not just the
  triggering user
- **API routes**: New endpoints for fetching family
  achievements and progress; extend admin API for Guild
  Master management
- **Components**: New family achievements dashboard
  section; extend notification manager for family-scoped
  toasts
- **Dependencies**: Builds on #134 (schema), #135
  (progress tracking), #136 (unlock engine) — all merged
