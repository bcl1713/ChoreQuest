-- ============================================================================
-- Compound Achievement Seeds
-- Adds two compound achievements to validate the compound evaluation strategy:
--   1. AND compound: "Complete 5 quests AND reach level 3"
--   2. OR compound:  "Defeat 3 bosses OR earn 500 gold"
-- ============================================================================

-- 10.2 AND compound achievement
INSERT INTO achievements (
  name,
  description,
  category_id,
  xp_reward,
  gold_reward,
  criteria_type,
  criteria_config
)
SELECT
  'Seasoned Adventurer',
  'Complete 5 quests and reach level 3.',
  (SELECT id FROM achievement_categories WHERE name = 'Growth'),
  200,
  75,
  'compound',
  '{
    "evaluation_strategy": "compound",
    "operator": "AND",
    "conditions": [
      { "criteria_type": "quest_complete", "threshold": 5 },
      { "criteria_type": "level_reached",  "threshold": 3 }
    ]
  }'::jsonb;

-- 10.3 OR compound achievement
INSERT INTO achievements (
  name,
  description,
  category_id,
  xp_reward,
  gold_reward,
  criteria_type,
  criteria_config
)
SELECT
  'Path of Glory',
  'Defeat 3 bosses or earn 500 gold.',
  (SELECT id FROM achievement_categories WHERE name = 'Adventurer'),
  150,
  50,
  'compound',
  '{
    "evaluation_strategy": "compound",
    "operator": "OR",
    "conditions": [
      { "criteria_type": "boss_defeated", "threshold": 3 },
      { "criteria_type": "gold_earned",   "threshold": 500 }
    ]
  }'::jsonb;
