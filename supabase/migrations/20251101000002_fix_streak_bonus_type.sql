-- Migration: Allow fractional streak bonuses
-- Purpose: Store streak bonuses as decimals (e.g., 0.04 = 4%) instead of integers

ALTER TABLE quest_instances
  ALTER COLUMN streak_bonus TYPE FLOAT USING streak_bonus::FLOAT;

-- Keep default at 0 for clarity
ALTER TABLE quest_instances
  ALTER COLUMN streak_bonus SET DEFAULT 0;
