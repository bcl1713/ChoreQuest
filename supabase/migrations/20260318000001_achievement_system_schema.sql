-- Achievement System Schema Migration
-- Drops legacy placeholder tables and creates the full achievement schema.
-- Related: issue #134 (Achievement Database)

-- ============================================================
-- 1. Drop legacy placeholder tables (FK-dependent order)
-- ============================================================
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;

-- ============================================================
-- 2. Create tables
-- ============================================================

-- 2.1 achievement_categories
CREATE TABLE achievement_categories (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  description  TEXT,
  display_order INT        DEFAULT 0,
  icon         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 achievements
CREATE TABLE achievements (
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
  family_id       UUID        REFERENCES families(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 character_achievements
CREATE TABLE character_achievements (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id   UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ,
  progress       JSONB,
  notified       BOOL        DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (character_id, achievement_id)
);

-- ============================================================
-- 3. Triggers and real-time
-- ============================================================

-- 3.1 updated_at triggers
CREATE TRIGGER set_timestamp_achievement_categories
  BEFORE UPDATE ON achievement_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_achievements
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_character_achievements
  BEFORE UPDATE ON character_achievements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.2 Replica identity for real-time unlock events
ALTER TABLE character_achievements REPLICA IDENTITY FULL;

-- ============================================================
-- 4. Indexes
-- ============================================================

-- 4.1 character_achievements lookup indexes
CREATE INDEX idx_character_achievements_character_id  ON character_achievements(character_id);
CREATE INDEX idx_character_achievements_achievement_id ON character_achievements(achievement_id);

-- 4.2 achievements filtering indexes
CREATE INDEX idx_achievements_category_id   ON achievements(category_id);
CREATE INDEX idx_achievements_family_id     ON achievements(family_id);
CREATE INDEX idx_achievements_criteria_type ON achievements(criteria_type);

-- ============================================================
-- 5. Row Level Security
-- ============================================================

-- 5.1 Enable RLS
ALTER TABLE achievement_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_achievements   ENABLE ROW LEVEL SECURITY;

-- 5.2 achievement_categories policies
CREATE POLICY "Authenticated users can view achievement categories"
  ON achievement_categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role manages achievement categories"
  ON achievement_categories
  FOR ALL
  USING (false);

-- 5.3 achievements SELECT: global rows (family_id IS NULL) or family rows
CREATE POLICY "Authenticated users can view achievements"
  ON achievements
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      family_id IS NULL
      OR family_id = get_user_family_id()
    )
  );

-- 5.4 achievements management: Guild Masters for family-scoped achievements
CREATE POLICY "Guild Masters can manage family achievements"
  ON achievements
  FOR ALL
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );

-- 5.5 character_achievements SELECT: family members (via characters → user_profiles)
CREATE POLICY "Family members can view character achievements"
  ON character_achievements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM characters c
      JOIN user_profiles up ON up.id = c.user_id
      WHERE c.id = character_id
        AND up.family_id = get_user_family_id()
    )
  );

-- 5.6 character_achievements INSERT/UPDATE: service role only
CREATE POLICY "Service role manages character achievements"
  ON character_achievements
  FOR ALL
  USING (false);

-- ============================================================
-- 6. Seed data
-- ============================================================

-- 6.1 Achievement categories
INSERT INTO achievement_categories (name, description, display_order, icon) VALUES
  ('Adventurer', 'Awarded for completing quests and taking on challenges', 1, 'sword'),
  ('Warrior',    'Awarded for boss battle participation and victories',    2, 'shield'),
  ('Wealth',     'Awarded for earning and spending gold',                  3, 'coins'),
  ('Growth',     'Awarded for leveling up and earning XP',                4, 'star'),
  ('Dedication', 'Awarded for maintaining activity streaks',               5, 'flame'),
  ('Secret',     'Hidden achievements discovered through play',            6, 'eye-off');

-- 6.2 Adventurer achievements (quest completion milestones + volunteer + challenge)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Adventurer'),
  v.xp_reward,
  v.gold_reward,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('First Quest',        'Complete your very first quest.',        50,   10,  'quest_complete',  '{"threshold": 1}'),
  ('Seasoned Adventurer','Complete 10 quests.',                    200,  50,  'quest_complete',  '{"threshold": 10}'),
  ('Veteran Hero',       'Complete 50 quests.',                    500,  150, 'quest_complete',  '{"threshold": 50}'),
  ('Legendary Quester',  'Complete 100 quests.',                   1000, 300, 'quest_complete',  '{"threshold": 100}'),
  ('Volunteer Spirit',   'Volunteer to help with a quest.',        100,  25,  'quest_volunteer', '{"threshold": 1}'),
  ('Challenge Seeker',   'Complete 5 HARD difficulty quests.',     300,  75,  'quest_difficulty','{"difficulty": "HARD", "threshold": 5}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.3 Warrior achievements (boss battles)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Warrior'),
  v.xp_reward,
  v.gold_reward,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('First Blood',  'Defeat your first boss.',        150,  50,  'boss_defeated',    '{"threshold": 1}'),
  ('Boss Slayer',  'Defeat 10 bosses.',               1000, 250, 'boss_defeated',    '{"threshold": 10}'),
  ('Battle Ready', 'Participate in 5 boss battles.',  200,  50,  'boss_participated','{"threshold": 5}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.4 Wealth achievements (gold earning and spending)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Wealth'),
  v.xp_reward,
  v.gold_reward,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('First Gold',      'Earn your first gold coin.',          25,  0, 'gold_earned', '{"threshold": 1}'),
  ('Treasure Hunter', 'Earn 100 gold total.',                100, 0, 'gold_earned', '{"threshold": 100}'),
  ('Gold Hoarder',    'Earn 1000 gold total.',               500, 0, 'gold_earned', '{"threshold": 1000}'),
  ('Big Spender',     'Spend 100 gold at the reward shop.',  75,  0, 'gold_spent',  '{"threshold": 100}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.5 Growth achievements (level milestones and XP)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Growth'),
  v.xp_reward,
  v.gold_reward,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('Rising Star', 'Reach level 2.',     50,   25,  'level_reached', '{"threshold": 2}'),
  ('Apprentice',  'Reach level 5.',     150,  50,  'level_reached', '{"threshold": 5}'),
  ('Hero',        'Reach level 10.',    400,  100, 'level_reached', '{"threshold": 10}'),
  ('Legend',      'Reach level 20.',    1000, 250, 'level_reached', '{"threshold": 20}'),
  ('XP Hunter',   'Earn 1000 XP total.',200, 50,  'xp_earned',     '{"threshold": 1000}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.6 Dedication achievements (streak milestones)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Dedication'),
  v.xp_reward,
  v.gold_reward,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('Three Day Streak', 'Maintain a 3-day activity streak.',  75,  20,  'streak_reached', '{"threshold": 3}'),
  ('Week Warrior',     'Maintain a 7-day activity streak.',  200, 50,  'streak_reached', '{"threshold": 7}'),
  ('Fortnight Fighter','Maintain a 14-day activity streak.', 400, 100, 'streak_reached', '{"threshold": 14}'),
  ('Monthly Master',   'Maintain a 30-day activity streak.', 800, 200, 'streak_reached', '{"threshold": 30}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.7 Secret achievements (is_hidden = TRUE)
INSERT INTO achievements (name, description, category_id, xp_reward, gold_reward, is_hidden, criteria_type, criteria_config)
SELECT
  v.name,
  v.description,
  (SELECT id FROM achievement_categories WHERE name = 'Secret'),
  v.xp_reward,
  v.gold_reward,
  TRUE,
  v.criteria_type,
  v.criteria_config::jsonb
FROM (VALUES
  ('Shape Shifter',    'Change your character class.',   200, 50, 'class_change',   '{"threshold": 1}'),
  ('Honorable',        'Earn your first honor point.',   100, 0,  'honor_earned',   '{"threshold": 1}'),
  ('First Redemption', 'Redeem your first reward.',      50,  0,  'reward_redeemed','{"threshold": 1}')
) AS v(name, description, xp_reward, gold_reward, criteria_type, criteria_config);

-- 6.8 Balance note: reward values above are draft and subject to balancing.
-- Quest rewards in this project range from ~10–150 XP per quest.
-- Achievement XP rewards are set at 1–20x single-quest values to reflect
-- milestone significance. Gold rewards are proportionally lower.
-- A follow-up migration can UPDATE rewards after playtesting.
