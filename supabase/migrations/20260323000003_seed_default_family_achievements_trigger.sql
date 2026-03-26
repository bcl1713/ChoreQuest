-- Trigger to seed default family achievements for every newly created family.
-- The one-time seed in 20260323000001 only backfills families that existed at
-- migration time; this trigger ensures any family created after deployment also
-- gets the default catalog immediately.

-- ============================================================
-- 1. Trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION seed_default_family_achievements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_achievements (name, description, category_id, icon, criteria_type, criteria_config, family_id)
  SELECT
    v.name,
    v.description,
    (SELECT id FROM achievement_categories WHERE name = v.category_name),
    v.icon,
    v.criteria_type,
    v.criteria_config::jsonb,
    NEW.id
  FROM (VALUES
    -- Sum-mode: aggregate across all family members
    ('Family Quest Masters',   'Complete 50 quests as a family.',            'Adventurer', 'sword',  'quest_complete', '{"threshold": 50,   "family_evaluation_mode": "sum"}'),
    ('Family Fortune',         'Earn 1000 gold collectively as a family.',  'Wealth',     'coins',  'gold_earned',    '{"threshold": 1000, "family_evaluation_mode": "sum"}'),
    ('Family First Steps',     'Complete 10 quests as a family.',           'Adventurer', 'sword',  'quest_complete', '{"threshold": 10,   "family_evaluation_mode": "sum"}'),
    ('Family Dragon Slayers',  'Defeat 5 bosses as a family.',             'Warrior',    'shield', 'boss_defeated',  '{"threshold": 5,    "family_evaluation_mode": "sum"}'),
    ('Family XP Champions',    'Earn 5000 XP collectively as a family.',   'Growth',     'star',   'xp_earned',      '{"threshold": 5000, "family_evaluation_mode": "sum"}'),
    -- All-mode: every member must individually meet the threshold
    ('Family of Heroes',       'All family members reach level 5.',          'Growth',     'star',   'level_reached',  '{"threshold": 5,    "family_evaluation_mode": "all"}'),
    ('Family Dedication',      'All family members achieve a 7-day streak.', 'Dedication', 'flame',  'streak_reached', '{"threshold": 7,    "family_evaluation_mode": "all"}')
  ) AS v(name, description, category_name, icon, criteria_type, criteria_config);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Trigger
-- ============================================================

CREATE TRIGGER trigger_seed_default_family_achievements
  AFTER INSERT ON families
  FOR EACH ROW EXECUTE FUNCTION seed_default_family_achievements();
