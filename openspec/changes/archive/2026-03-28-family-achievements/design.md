# Family Achievements Design

## Context

ChoreQuest's achievement system currently tracks individual
character progress via `character_achievements`. Each
character has their own progress rows evaluated by
`AchievementProgressService`. The system supports global
and family-scoped achievement definitions, but all progress
is per-character — there is no concept of aggregated
family-level progress.

Issue #140 introduces family achievements: shared goals
where progress aggregates across all family members.
Examples include "Family completes 50 quests total" and
"All members reach level 5". These build directly on the
existing achievement infrastructure (#134, #135, #136).

## Goals / Non-Goals

**Goals:**

- Family achievements with aggregate progress across
  all characters in a family
- Reuse existing criteria types and evaluator patterns
  for family-scoped evaluation
- Family achievement notifications broadcast to all
  online family members
- Dedicated UI section for family achievements on the
  dashboard
- Guild Master management of family achievements in
  admin panel
- Seed example family achievements for immediate value

**Non-Goals:**

- Per-member reward distribution (family achievements
  do not grant XP/gold to individual characters in v1;
  they are purely collective milestones)
- Cron-based or scheduled recalculation (event-driven
  only, consistent with individual achievements)
- Cross-family leaderboards or comparisons
- Family-level "levels" or "XP" — families don't have
  stats, only achievements

## Decisions

### 1. Separate tables vs. extending existing tables

**Decision**: Create separate `family_achievements` and
`family_achievement_progress` tables rather than adding a
`scope` column to the existing `achievements` and
`character_achievements` tables.

**Rationale**: The existing `character_achievements` table
has a unique constraint on `(character_id, achievement_id)`
and all evaluators assume per-character context. Family
progress has a fundamentally different key
(`family_id, achievement_id`) and different aggregation
semantics. Separate tables avoid complex conditional logic
in existing queries and RLS policies, and prevent breaking
changes to the well-tested individual achievement flow.

**Alternative considered**: Adding `scope: 'individual' |
'family'` to the `achievements` table. Rejected because it
would require changes to every existing query, evaluator,
and RLS policy, with high regression risk for no benefit.

### 2. Event-driven aggregation triggered by individual progress

**Decision**: Family achievement progress is recalculated
whenever individual `updateProgress()` completes
successfully. After the individual character's progress is
updated, the service resolves the character's family and
triggers `FamilyAchievementProgressService.updateProgress(
familyId, event)`.

**Rationale**: This piggybacks on existing event triggers
(quest approval, boss completion, reward approval) without
requiring new integration points. The individual progress
service already resolves the family context.

**Alternative considered**: Database triggers on
`character_achievements` changes. Rejected because
Supabase triggers can't easily aggregate across multiple
characters with complex criteria evaluation, and it would
split business logic between SQL and TypeScript.

### 3. Family evaluators aggregate across characters

**Decision**: Family evaluators query the same source
tables as individual evaluators but aggregate across all
characters in the family. For example, the family
`quest_complete` evaluator counts approved quests for ALL
users in the family, not just one character.

**Rationale**: Reuses the same data sources and criteria
types. The evaluator signatures match the individual
pattern but accept `familyId` instead of
`characterId/userId`.

**Criteria type semantics for family scope:**

- **SUM types** (quest_complete, gold_earned, etc.):
  Sum values across all family members
- **ALL types** (level_reached, streak_reached): Check
  that ALL family members meet the threshold (e.g.,
  "All members reach level 5")
- **ANY types**: Not needed for v1 (would be redundant
  with individual achievements)

A `family_evaluation_mode` field in `criteria_config`
(`"sum"` or `"all"`, defaulting to `"sum"`) controls
this behavior.

### 4. Notification broadcasting via realtime channel

**Decision**: Family achievement unlocks broadcast via
a family-scoped Supabase Realtime channel. The
`family_achievement_progress` table gets
`REPLICA IDENTITY FULL`, and all family members
subscribe to changes filtered by their `family_id`.

**Rationale**: Consistent with how individual achievement
notifications work (subscribing to
`character_achievements` changes). Family members already
share a `family_id`, making the channel filter
straightforward.

### 5. No per-member rewards in v1

**Decision**: Family achievements are collective
milestones that do not grant XP or gold to individual
characters. The `family_achievements` table has
`xp_reward` and `gold_reward` columns (defaulting to 0)
reserved for future use but not distributed in v1.

**Rationale**: Distributing rewards raises questions
(equal split? each member gets full amount? only
contributing members?) that are better deferred. The
milestone itself is the reward. Individual achievements
already handle personal progression rewards.

### 6. Dashboard display as separate section

**Decision**: Family achievements display in a dedicated
"Family Achievements" section on the dashboard, separate
from individual achievements. This uses a new
`FamilyAchievementsSection` component with its own
data fetching, badge grid, and summary.

**Rationale**: Family achievements have different data
shapes (family progress vs. character progress) and
should be visually distinct. Mixing them into the
existing `AchievementsSection` would complicate the
component hierarchy and data flow.

## Risks / Trade-offs

- **Performance of cross-family aggregation**: Family
  evaluators query across all family members, which
  involves joins across `user_profiles`, `characters`,
  and source tables. → Mitigation: Families are small
  (typically 2-6 members), so aggregate queries remain
  fast. Add indexes on `user_profiles.family_id`.

- **Stale progress on member join/leave**: If a family
  member is added or removed, existing family
  achievement progress may be stale. → Mitigation:
  Progress is recomputed on every event; the next
  qualifying action by any member triggers full
  recalculation. No immediate recalc on membership
  changes in v1.

- **Notification deduplication**: Multiple family
  members acting simultaneously could trigger multiple
  family progress evaluations. → Mitigation: Use
  `unlocked_at IS NULL` guard (same pattern as
  individual achievements) to prevent duplicate unlock.
  Realtime broadcasts naturally deduplicate via the
  single DB update.

- **No rollback for family unlocks**: Unlike individual
  achievements which have rollback guards, family
  achievements in v1 have no rewards to roll back.
  → Acceptable because there's nothing to compensate.
