-- Migration 018: Remove template_id foreign key constraint from quest_instances
--
-- Purpose: Templates should be blueprints that are copied into quests, not permanent references.
-- This allows templates to be deleted or modified without affecting existing quests.
-- The template_id column remains for tracking/analytics purposes only.

-- Drop the foreign key constraint
ALTER TABLE quest_instances
DROP CONSTRAINT IF EXISTS quest_instances_template_id_fkey;

-- Add comment explaining the column's purpose without FK enforcement
COMMENT ON COLUMN quest_instances.template_id IS 'Optional reference to template used for creation (not enforced by FK). Used for analytics and tracking which template was used to create the quest.';

-- Verify constraint is removed (should return 0 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quest_instances_template_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint still exists';
  END IF;
END $$;
