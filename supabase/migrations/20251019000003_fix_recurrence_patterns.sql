-- Migration: Fix Recurrence Patterns for Weekly Quest Templates
-- Fixes inconsistency where WEEKLY category quests had DAILY recurrence_pattern
-- This migration corrects the default templates (IDs 15-20) and updates the trigger function

-- Step 1: Update default quest templates to set recurrence_pattern = 'WEEKLY' for weekly quests
UPDATE quest_templates
SET recurrence_pattern = 'WEEKLY'
WHERE id IN (
  '00000000-0000-0000-0000-000000000015', -- Clean Your Room
  '00000000-0000-0000-0000-000000000016', -- Laundry Duty
  '00000000-0000-0000-0000-000000000017', -- Walk the Dog
  '00000000-0000-0000-0000-000000000018', -- Vacuum the House
  '00000000-0000-0000-0000-000000000019', -- Mow the Lawn
  '00000000-0000-0000-0000-000000000020'  -- Clean the Bathroom
)
AND category = 'WEEKLY';

-- Step 2: Update trigger function to include recurrence_pattern in the copy operation
CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with function owner's permissions to bypass RLS and access default templates
AS $$
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
    is_paused,
    class_bonuses,
    quest_type,
    recurrence_pattern
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
    is_paused,
    class_bonuses,
    quest_type,
    recurrence_pattern
  FROM quest_templates
  WHERE family_id IS NULL
    AND id >= '00000000-0000-0000-0000-000000000011'
    AND id <= '00000000-0000-0000-0000-000000000020';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION copy_default_quest_templates_to_new_family() IS
  'Automatically copies the new diversified default quest templates (IDs 11-20) to newly created families. Includes recurrence_pattern. Uses SECURITY DEFINER to bypass RLS.';
