-- Migration 020: Update week_start_day default to Monday
-- Change default week start from Sunday (0) to Monday (1)
-- This gives families the full weekend to complete weekly chores before reset

-- Update the default for new families
ALTER TABLE families
  ALTER COLUMN week_start_day SET DEFAULT 1;

-- Update existing families that still have the old default (Sunday)
-- Only update families that have week_start_day = 0 (assuming they never changed it from default)
UPDATE families
SET week_start_day = 1
WHERE week_start_day = 0;

-- Update the comment to reflect the new default
COMMENT ON COLUMN families.week_start_day IS 'Which day the week starts (0=Sunday, 1=Monday, ..., 6=Saturday). Default is Monday to give kids the full weekend for weekly chores.';
