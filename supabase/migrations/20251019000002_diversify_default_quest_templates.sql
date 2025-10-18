-- Migration 021: Add Diversified Default Quest Templates
-- Adds new diverse quest templates and updates the trigger to copy these instead of the old ones
-- Fixes issue #45
-- This runs after 20251012000001_add_recurring_quests.sql which adds the quest_type column

-- Insert new default quest templates (family_id = NULL indicates global defaults)
-- IDs 00000000-0000-0000-0000-0000000000XX (using 11-20 to avoid conflicts)

-- DAILY FAMILY QUESTS (4)

-- 11. Unload the Dishwasher - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Unload the Dishwasher',
  'Unload clean dishes from the dishwasher and put them away.',
  50,
  25,
  'EASY',
  'DAILY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- 12. Take Out the Trash - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  'Take Out the Trash',
  'Collect trash from all rooms and take it to the outdoor bins.',
  40,
  20,
  'EASY',
  'DAILY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- 13. Clear & Load Dishwasher After Dinner - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000013',
  'Clear & Load Dishwasher After Dinner',
  'Clear the table and load dirty dishes into the dishwasher after dinner.',
  50,
  25,
  'EASY',
  'DAILY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- 14. Wipe Counters & Sweep Floor - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000014',
  'Wipe Counters & Sweep Floor',
  'Wipe down kitchen counters and sweep the floor after dinner.',
  50,
  25,
  'EASY',
  'DAILY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- WEEKLY INDIVIDUAL QUESTS (3)

-- 15. Clean Your Room - EASY, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000015',
  'Clean Your Room',
  'Tidy up your bedroom: make the bed, put away clothes, and organize your desk.',
  60,
  30,
  'EASY',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'INDIVIDUAL'
);

-- 16. Laundry Duty - MEDIUM, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000016',
  'Laundry Duty',
  'Wash, dry, fold, and put away a full load of laundry.',
  120,
  60,
  'MEDIUM',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'INDIVIDUAL'
);

-- 17. Walk the Dog - EASY, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000017',
  'Walk the Dog',
  'Take the dog for a 20-30 minute walk around the neighborhood.',
  50,
  25,
  'EASY',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'INDIVIDUAL'
);

-- WEEKLY FAMILY QUESTS (3)

-- 18. Vacuum the House - MEDIUM, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000018',
  'Vacuum the House',
  'Vacuum all carpeted areas and floors throughout the entire house.',
  120,
  60,
  'MEDIUM',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- 19. Mow the Lawn - HARD, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000019',
  'Mow the Lawn',
  'Mow the entire lawn, trim edges, and clean up grass clippings.',
  200,
  100,
  'HARD',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- 20. Clean the Bathroom - MEDIUM, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  'Clean the Bathroom',
  'Clean the bathroom: scrub toilet, sink, and tub/shower, wipe mirrors, and mop the floor.',
  120,
  60,
  'MEDIUM',
  'WEEKLY',
  NULL,
  false,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb,
  'FAMILY'
);

-- Update the trigger function to copy the new templates (IDs 11-20) instead of old ones (IDs 1-10)
CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy the new default templates (IDs 11-20) to the new family
  INSERT INTO quest_templates (
    title,
    description,
    xp_reward,
    gold_reward,
    difficulty,
    category,
    family_id,
    is_active,
    class_bonuses,
    quest_type
  )
  SELECT
    title,
    description,
    xp_reward,
    gold_reward,
    difficulty,
    category,
    NEW.id, -- Assign to the new family
    is_active,
    class_bonuses,
    quest_type
  FROM quest_templates
  WHERE family_id IS NULL
    AND id >= '00000000-0000-0000-0000-000000000011'
    AND id <= '00000000-0000-0000-0000-000000000020';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION copy_default_quest_templates_to_new_family() IS
  'Automatically copies the new diversified default quest templates (IDs 11-20) to newly created families';
