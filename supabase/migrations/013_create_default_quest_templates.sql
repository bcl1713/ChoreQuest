-- Migration 013: Create Default Quest Templates and Auto-Copy Trigger
-- Part of Phase 1: Quest Template Implementation
-- Creates 10 default quest templates and trigger to copy them to new families

-- Insert default quest templates (family_id = NULL indicates global defaults)
-- Each template includes class_bonuses for character-specific multipliers

-- 1. Clean Your Room - EASY, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clean Your Room',
  'Tidy up your bedroom: make the bed, put away clothes, and organize your desk.',
  50,
  25,
  'EASY',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 2. Do the Dishes - EASY, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Do the Dishes',
  'Wash, dry, and put away all dishes, utensils, and cookware.',
  50,
  25,
  'EASY',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 3. Take Out the Trash - EASY, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Take Out the Trash',
  'Collect trash from all rooms and take it to the outdoor bins.',
  40,
  20,
  'EASY',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 4. Vacuum the House - MEDIUM, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Vacuum the House',
  'Vacuum all carpeted areas and floors throughout the entire house.',
  100,
  50,
  'MEDIUM',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 5. Laundry Duty - MEDIUM, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'Laundry Duty',
  'Wash, dry, fold, and put away a full load of laundry.',
  100,
  50,
  'MEDIUM',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 6. Mow the Lawn - HARD, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'Mow the Lawn',
  'Mow the entire lawn, trim edges, and clean up grass clippings.',
  150,
  75,
  'HARD',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 7. Weekly Room Deep Clean - HARD, WEEKLY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  'Weekly Room Deep Clean',
  'Deep clean your room: dust all surfaces, organize closet, clean windows, and vacuum under furniture.',
  200,
  100,
  'HARD',
  'WEEKLY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 8. Organize the Garage - HARD, WEEKLY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  'Organize the Garage',
  'Sort items in the garage, sweep the floor, and arrange tools and equipment neatly.',
  200,
  100,
  'HARD',
  'WEEKLY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 9. Help with Grocery Shopping - MEDIUM, WEEKLY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  'Help with Grocery Shopping',
  'Assist with grocery shopping: help make the list, carry bags, and put groceries away.',
  120,
  60,
  'MEDIUM',
  'WEEKLY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
);

-- 10. Walk the Dog - EASY, DAILY
INSERT INTO quest_templates (id, title, description, xp_reward, gold_reward, difficulty, category, family_id, is_active, class_bonuses)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Walk the Dog',
  'Take the dog for a 20-30 minute walk around the neighborhood.',
  40,
  20,
  'EASY',
  'DAILY',
  NULL,
  true,
  '{"KNIGHT": {"xp": 1.05, "gold": 1.05}, "MAGE": {"xp": 1.2, "gold": 1.0}, "ROGUE": {"xp": 1.0, "gold": 1.15}, "HEALER": {"xp": 1.1, "gold": 1.0, "honor": 1.25}, "RANGER": {"xp": 1.0, "gold": 1.0, "gems": 1.3}}'::jsonb
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
    class_bonuses
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
    class_bonuses
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
