-- Rebalance default achievement progression and rewards.
-- Related: issue #165.
--
-- Economy anchors from production chore pricing/screenshots:
-- - 100 gold = $10.
-- - Typical daily chores are about 10 gold.
-- - Hard weekly chores such as mowing can be about 85 gold.
--
-- Design rules:
-- - Early individual achievements should feel attainable and pay less than a
--   typical daily chore bonus.
-- - Sustained milestones can pay more, but seeded individual gold bonuses should
--   never exceed one hard weekly chore.
-- - Achievements whose criterion is already earning gold should not mint more
--   gold just for crossing an earned-gold milestone.
-- - Family achievements should pay useful shared milestone bonuses without
--   creating outsized windfalls.

-- Individual achievement catalog.  Values are keyed by name + criteria_type so
-- the duplicate historical Seasoned Adventurer rows can be separated safely.
WITH balanced(name, criteria_type, xp_reward, gold_reward) AS (
  VALUES
    ('First Quest', 'quest_complete', 50, 5),
    ('Seasoned Adventurer', 'quest_complete', 150, 15),
    ('Veteran Hero', 'quest_complete', 300, 40),
    ('Legendary Quester', 'quest_complete', 600, 75),
    ('Volunteer Spirit', 'quest_volunteer', 50, 5),
    ('Challenge Seeker', 'quest_difficulty', 200, 25),
    ('First Blood', 'boss_defeated', 100, 15),
    ('Boss Slayer', 'boss_defeated', 500, 75),
    ('Battle Ready', 'boss_participated', 150, 15),
    ('First Gold', 'gold_earned', 25, 0),
    ('Treasure Hunter', 'gold_earned', 75, 0),
    ('Gold Hoarder', 'gold_earned', 250, 0),
    ('Big Spender', 'gold_spent', 75, 0),
    ('Rising Star', 'level_reached', 50, 5),
    ('Apprentice', 'level_reached', 100, 15),
    ('Hero', 'level_reached', 250, 40),
    ('Legend', 'level_reached', 500, 75),
    ('XP Hunter', 'xp_earned', 150, 15),
    ('Three Day Streak', 'streak_reached', 50, 5),
    ('Week Warrior', 'streak_reached', 100, 15),
    ('Fortnight Fighter', 'streak_reached', 250, 30),
    ('Monthly Master', 'streak_reached', 500, 60),
    ('Shape Shifter', 'class_change', 100, 10),
    ('Honorable', 'honor_earned', 25, 0),
    ('First Redemption', 'reward_redeemed', 50, 0)
)
UPDATE achievements a
SET
  xp_reward = balanced.xp_reward,
  gold_reward = balanced.gold_reward
FROM balanced
WHERE a.name = balanced.name
  AND a.criteria_type = balanced.criteria_type;

-- Keep the compound catalog balanced too, and resolve the duplicate seeded name
-- so the 5-quest + level-3 compound is not confused with the 10-quest milestone.
WITH balanced_compound(name, criteria_type, xp_reward, gold_reward) AS (
  VALUES
    ('Well-Rounded Adventurer', 'compound', 120, 15)
)
UPDATE achievements a
SET
  name = balanced_compound.name,
  description = 'Complete 5 quests and reach level 3.',
  xp_reward = balanced_compound.xp_reward,
  gold_reward = balanced_compound.gold_reward
FROM balanced_compound
WHERE a.name = 'Seasoned Adventurer'
  AND a.criteria_type = balanced_compound.criteria_type
  AND a.criteria_config ->> 'operator' = 'AND';

WITH balanced_compound(name, criteria_type, xp_reward, gold_reward) AS (
  VALUES
    ('Path of Glory', 'compound', 150, 20)
)
UPDATE achievements a
SET
  xp_reward = balanced_compound.xp_reward,
  gold_reward = balanced_compound.gold_reward
FROM balanced_compound
WHERE a.name = balanced_compound.name
  AND a.criteria_type = balanced_compound.criteria_type;

DO $$
DECLARE
  invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM achievements
  WHERE family_id IS NULL
    AND gold_reward > 85;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Default achievement rebalance left % individual rewards above hard-chore cap (CHECK (gold_reward <= 85))', invalid_count;
  END IF;
END $$;

-- Existing family achievement rows.  Previous seed migrations created these with
-- zero rewards because xp_reward/gold_reward were omitted from the INSERTs.
WITH balanced_family(name, xp_reward, gold_reward) AS (
  VALUES
    ('Family First Steps', 100, 20),
    ('Family Quest Masters', 300, 50),
    ('Family Fortune', 200, 0),
    ('Family Dragon Slayers', 400, 60),
    ('Family XP Champions', 300, 25),
    ('Family of Heroes', 250, 40),
    ('Family Dedication', 200, 30)
)
UPDATE family_achievements fa
SET
  xp_reward = balanced_family.xp_reward,
  gold_reward = balanced_family.gold_reward
FROM balanced_family
WHERE fa.name = balanced_family.name;

DO $$
DECLARE
  invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM family_achievements
  WHERE gold_reward > 60;

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Default family achievement rebalance left % rewards above family milestone cap (CHECK (gold_reward <= 60))', invalid_count;
  END IF;
END $$;

-- Replace the new-family trigger so families created after this migration get the
-- same balanced reward defaults as existing families.
CREATE OR REPLACE FUNCTION seed_default_family_achievements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_achievements (
    name,
    description,
    category_id,
    icon,
    xp_reward,
    gold_reward,
    criteria_type,
    criteria_config,
    family_id
  )
  SELECT
    v.name,
    v.description,
    (SELECT id FROM achievement_categories WHERE name = v.category_name),
    v.icon,
    v.xp_reward,
    v.gold_reward,
    v.criteria_type,
    v.criteria_config::jsonb,
    NEW.id
  FROM (VALUES
    -- Sum-mode: aggregate across all family members
    ('Family Quest Masters', 'Complete 50 quests as a family.', 'Adventurer', 'sword', 300, 50, 'quest_complete', '{"threshold": 50, "family_evaluation_mode": "sum"}'),
    ('Family Fortune', 'Earn 1000 gold collectively as a family.', 'Wealth', 'coins', 200, 0, 'gold_earned', '{"threshold": 1000, "family_evaluation_mode": "sum"}'),
    ('Family First Steps', 'Complete 10 quests as a family.', 'Adventurer', 'sword', 100, 20, 'quest_complete', '{"threshold": 10, "family_evaluation_mode": "sum"}'),
    ('Family Dragon Slayers', 'Defeat 5 bosses as a family.', 'Warrior', 'shield', 400, 60, 'boss_defeated', '{"threshold": 5, "family_evaluation_mode": "sum"}'),
    ('Family XP Champions', 'Earn 5000 XP collectively as a family.', 'Growth', 'star', 300, 25, 'xp_earned', '{"threshold": 5000, "family_evaluation_mode": "sum"}'),
    -- All-mode: every member must individually meet the threshold
    ('Family of Heroes', 'All family members reach level 5.', 'Growth', 'star', 250, 40, 'level_reached', '{"threshold": 5, "family_evaluation_mode": "all"}'),
    ('Family Dedication', 'All family members achieve a 7-day streak.', 'Dedication', 'flame', 200, 30, 'streak_reached', '{"threshold": 7, "family_evaluation_mode": "all"}')
  ) AS v(name, description, category_name, icon, xp_reward, gold_reward, criteria_type, criteria_config);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
