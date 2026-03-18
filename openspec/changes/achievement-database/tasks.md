# Achievement Database Tasks

## 1. Migration File Setup

- [ ] 1.1 Create migration file
  `supabase/migrations/20260318000001_achievement_system_schema.sql`
- [ ] 1.2 Add DROP TABLE IF EXISTS for `user_achievements`
  then `achievements` (FK-dependent order)

## 2. Table Creation

- [ ] 2.1 Create `achievement_categories` table with all
  columns (id, name, description, display_order, icon,
  created_at, updated_at)
- [ ] 2.2 Create `achievements` table with all columns (id,
  name, description, category_id FK, icon, xp_reward,
  gold_reward, is_hidden, criteria_type, criteria_config,
  family_id FK nullable, created_at, updated_at)
- [ ] 2.3 Create `character_achievements` table with all
  columns (id, character_id FK CASCADE, achievement_id FK
  CASCADE, unlocked_at, progress JSONB, notified, created_at,
  updated_at) and UNIQUE(character_id, achievement_id)

## 3. Triggers and Real-time

- [ ] 3.1 Add `trigger_set_timestamp()` triggers for
  updated_at on all three tables
- [ ] 3.2 Set REPLICA IDENTITY FULL on
  `character_achievements`

## 4. Indexes

- [ ] 4.1 Create indexes on
  `character_achievements.character_id` and
  `character_achievements.achievement_id`
- [ ] 4.2 Create indexes on `achievements.category_id`,
  `achievements.family_id`, and `achievements.criteria_type`

## 5. RLS Policies

- [ ] 5.1 Enable RLS on all three tables
- [ ] 5.2 Add `achievement_categories` policies: SELECT for
  all authenticated users, management via service role only
- [ ] 5.3 Add `achievements` SELECT policy: visible when
  `family_id IS NULL` OR `family_id = get_user_family_id()`
- [ ] 5.4 Add `achievements` management policy: Guild Masters
  can INSERT/UPDATE/DELETE where family_id matches their
  family
- [ ] 5.5 Add `character_achievements` SELECT policy: visible
  to family members (join through characters.user_id to
  user_profiles.family_id)
- [ ] 5.6 Add `character_achievements` INSERT/UPDATE policy:
  service role only

## 6. Seed Data

- [ ] 6.1 Insert achievement categories: Adventurer, Warrior,
  Wealth, Growth, Dedication, Secret (with display_order and
  icons)
- [ ] 6.2 Insert Adventurer achievements: quest completion
  milestones (quest_complete at 1, 10, 50, 100), volunteer
  spirit (quest_volunteer), challenge seeker
  (quest_difficulty HARD)
- [ ] 6.3 Insert Warrior achievements: boss battle
  milestones (boss_defeated at 1, 10; boss_participated
  at 5)
- [ ] 6.4 Insert Wealth achievements: gold earning
  milestones (gold_earned at 1, 100, 1000), spending
  milestone (gold_spent at 100)
- [ ] 6.5 Insert Growth achievements: level milestones
  (level_reached at 2, 5, 10, 20), XP milestone
  (xp_earned at 1000)
- [ ] 6.6 Insert Dedication achievements: streak milestones
  (streak_reached at 3, 7, 14, 30)
- [ ] 6.7 Insert Secret achievements (is_hidden = TRUE):
  class change (class_change), honor earned (honor_earned),
  first redemption (reward_redeemed)
- [ ] 6.8 Balance review: verify reward values are reasonable
  relative to existing quest/boss rewards (draft values,
  flag for future adjustment)

## 7. Migration Tests

- [ ] 7.1 Create test file
  `tests/unit/migrations/achievement-system-schema.test.ts`
- [ ] 7.2 Test: SQL contains DROP TABLE for
  `user_achievements` and `achievements`
- [ ] 7.3 Test: SQL contains CREATE TABLE for all three new
  tables with required columns
- [ ] 7.4 Test: SQL contains ENABLE ROW LEVEL SECURITY for
  all three tables
- [ ] 7.5 Test: SQL contains CREATE INDEX for all required
  indexes
- [ ] 7.6 Test: SQL contains CREATE POLICY statements for
  achievement RLS
- [ ] 7.7 Test: SQL contains INSERT statements for seed
  categories and achievements
- [ ] 7.8 Test: SQL contains REPLICA IDENTITY FULL for
  character_achievements

## 8. Validation

- [ ] 8.1 Run `supabase db reset` to verify migration
  executes without errors
- [ ] 8.2 Verify in Supabase Studio (or via SQL query): all
  three tables exist, seed categories and achievements are
  present, RLS policies are active on all three tables
- [ ] 8.3 Run `supabase gen types typescript --local` to
  regenerate TypeScript types with new tables
- [ ] 8.4 Run `npm run build` — zero TypeScript errors
- [ ] 8.5 Run `npm run lint` — zero lint errors
- [ ] 8.6 Run `npm run test` — all tests pass including new
  migration tests
