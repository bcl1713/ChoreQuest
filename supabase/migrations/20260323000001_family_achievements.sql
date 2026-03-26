-- Family Achievements Schema Migration
-- Creates family_achievements and family_achievement_progress tables
-- with indexes, RLS policies, realtime support, and seed data.
-- Related: issue #140 (Family Achievements)

-- ============================================================
-- 1. Create tables
-- ============================================================

-- 1.1 family_achievements
CREATE TABLE family_achievements (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  category_id     UUID        REFERENCES achievement_categories(id),
  icon            TEXT,
  xp_reward       INT         DEFAULT 0,
  gold_reward     INT         DEFAULT 0,
  is_hidden       BOOL        DEFAULT FALSE,
  criteria_type   TEXT        NOT NULL,
  criteria_config JSONB       NOT NULL,
  family_id       UUID        NOT NULL REFERENCES families(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 family_achievement_progress
CREATE TABLE family_achievement_progress (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id              UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_achievement_id  UUID        NOT NULL REFERENCES family_achievements(id) ON DELETE CASCADE,
  unlocked_at            TIMESTAMPTZ,
  progress               JSONB,
  notified               BOOL        DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (family_id, family_achievement_id)
);

-- ============================================================
-- 2. Triggers
-- ============================================================

CREATE TRIGGER set_timestamp_family_achievements
  BEFORE UPDATE ON family_achievements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_family_achievement_progress
  BEFORE UPDATE ON family_achievement_progress
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- 3. Indexes
-- ============================================================

-- 3.1 family_achievements filtering indexes
CREATE INDEX idx_family_achievements_family_id     ON family_achievements(family_id);
CREATE INDEX idx_family_achievements_category_id   ON family_achievements(category_id);
CREATE INDEX idx_family_achievements_criteria_type ON family_achievements(criteria_type);

-- 3.2 family_achievement_progress lookup indexes
CREATE INDEX idx_family_achievement_progress_family_id              ON family_achievement_progress(family_id);
CREATE INDEX idx_family_achievement_progress_family_achievement_id  ON family_achievement_progress(family_achievement_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================

-- 4.1 Enable RLS
ALTER TABLE family_achievements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_achievement_progress  ENABLE ROW LEVEL SECURITY;

-- 4.2 family_achievements SELECT: family members can view their family's achievements
CREATE POLICY "Family members can view family achievements"
  ON family_achievements
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
  );

-- 4.3 family_achievements management: Guild Masters can manage their family's achievements
CREATE POLICY "Guild Masters can manage family achievements"
  ON family_achievements
  FOR ALL
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );

-- 4.4 family_achievement_progress SELECT: family members can view progress
CREATE POLICY "Family members can view family achievement progress"
  ON family_achievement_progress
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
  );

-- 4.5 family_achievement_progress writes: service role only
-- USING (false) blocks all write access for authenticated (non-service) users.
-- The Supabase service role bypasses RLS entirely, so it can still write.
CREATE POLICY "Service role manages family achievement progress"
  ON family_achievement_progress
  FOR ALL
  USING (false);

-- ============================================================
-- 5. Realtime support
-- ============================================================

ALTER TABLE family_achievement_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE family_achievement_progress;

-- ============================================================
-- 6. Seed data
-- ============================================================

-- Seed family achievements for each existing family.
-- Uses sum-mode and all-mode evaluation across multiple criteria types.

-- 6.1 Sum-mode family achievements (aggregate across all family members)
INSERT INTO family_achievements (name, description, category_id, icon, criteria_type, criteria_config, family_id)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = v.category_name),
  v.icon,
  v.criteria_type,
  v.criteria_config::jsonb,
  f.id
FROM families f
CROSS JOIN (VALUES
  ('Family Quest Masters',   'Complete 50 quests as a family.',            'Adventurer', 'sword',  'quest_complete', '{"threshold": 50,   "family_evaluation_mode": "sum"}'),
  ('Family Fortune',         'Earn 1000 gold collectively as a family.',  'Wealth',     'coins',  'gold_earned',    '{"threshold": 1000, "family_evaluation_mode": "sum"}'),
  ('Family First Steps',     'Complete 10 quests as a family.',           'Adventurer', 'sword',  'quest_complete', '{"threshold": 10,   "family_evaluation_mode": "sum"}'),
  ('Family Dragon Slayers',  'Defeat 5 bosses as a family.',             'Warrior',    'shield', 'boss_defeated',  '{"threshold": 5,    "family_evaluation_mode": "sum"}'),
  ('Family XP Champions',    'Earn 5000 XP collectively as a family.',   'Growth',     'star',   'xp_earned',      '{"threshold": 5000, "family_evaluation_mode": "sum"}')
) AS v(name, description, category_name, icon, criteria_type, criteria_config);

-- 6.2 All-mode family achievements (every member must meet the threshold)
INSERT INTO family_achievements (name, description, category_id, icon, criteria_type, criteria_config, family_id)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = v.category_name),
  v.icon,
  v.criteria_type,
  v.criteria_config::jsonb,
  f.id
FROM families f
CROSS JOIN (VALUES
  ('Family of Heroes',    'All family members reach level 5.',           'Growth',     'star',  'level_reached',  '{"threshold": 5, "family_evaluation_mode": "all"}'),
  ('Family Dedication',   'All family members achieve a 7-day streak.', 'Dedication', 'flame', 'streak_reached', '{"threshold": 7, "family_evaluation_mode": "all"}')
) AS v(name, description, category_name, icon, criteria_type, criteria_config);
