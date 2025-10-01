-- Migration 014: Fix Quest Template Trigger Security
-- The trigger function needs SECURITY DEFINER to access default templates (family_id IS NULL)
-- when run by users who don't have direct access to those rows

-- Drop and recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS copy_default_quest_templates_to_new_family() CASCADE;

CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with function owner's permissions, not caller's
AS $$
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

-- Recreate the trigger
CREATE TRIGGER trigger_copy_quest_templates_on_family_insert
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_quest_templates_to_new_family();

COMMENT ON FUNCTION copy_default_quest_templates_to_new_family() IS
  'Automatically copies default quest templates (family_id IS NULL) to newly created families. Uses SECURITY DEFINER to bypass RLS.';
