-- Migration: Use precise numeric for streak bonuses
-- Purpose: Avoid floating point drift on small percentage values (max 0.05)

ALTER TABLE quest_instances
  ALTER COLUMN streak_bonus TYPE NUMERIC(3, 2) USING round(streak_bonus::numeric, 2);

ALTER TABLE quest_instances
  ALTER COLUMN streak_bonus SET DEFAULT 0;
