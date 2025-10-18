-- Migration 013: Create Default Quest Templates and Auto-Copy Trigger
-- Part of Phase 1: Quest Template Implementation
-- Creates 10 default quest templates and trigger to copy them to new families

-- Insert default quest templates (family_id = NULL indicates global defaults)
-- Each template includes class_bonuses for character-specific multipliers

-- 1. Clean Your Room - EASY, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000001',
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

-- 2. Unload the Dishwasher - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000002',
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

-- 3. Take Out the Trash - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000003',
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

-- 4. Clear & Load Dishwasher After Dinner - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000004',
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

-- 5. Wipe Counters & Sweep Floor - EASY, DAILY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000005',
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

-- 6. Laundry Duty - MEDIUM, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000006',
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

-- 7. Walk the Dog - EASY, WEEKLY, INDIVIDUAL
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000007',
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

-- 8. Vacuum the House - MEDIUM, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000008',
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

-- 9. Mow the Lawn - HARD, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000009',
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

-- 10. Clean the Bathroom - MEDIUM, WEEKLY, FAMILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses, quest_type)
VALUES (
  '00000000-0000-0000-0000-000000000010',
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

-- Create function to copy default templates to new families
CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy all default templates (where family_id IS NULL) to the new family
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
  WHERE family_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically copy templates when a new family is created
CREATE TRIGGER trigger_copy_quest_templates_on_family_insert
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_quest_templates_to_new_family();

-- Add comment explaining the system
COMMENT ON FUNCTION copy_default_quest_templates_to_new_family() IS
  'Automatically copies default quest templates (family_id IS NULL) to newly created families';
