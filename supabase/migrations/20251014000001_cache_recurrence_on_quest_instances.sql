-- Migration: Cache recurrence pattern on quest instances
-- Purpose: Store recurrence metadata directly on quest instances so application
--          logic (streaks, dashboards) no longer depends on joining quest_templates.

ALTER TABLE quest_instances
  ADD COLUMN IF NOT EXISTS recurrence_pattern recurrence_pattern;

-- Backfill recurrence information from quest templates where available
UPDATE quest_instances qi
SET recurrence_pattern = qt.recurrence_pattern
FROM quest_templates qt
WHERE qi.template_id = qt.id
  AND qi.recurrence_pattern IS NULL
  AND qt.recurrence_pattern IS NOT NULL;

COMMENT ON COLUMN quest_instances.recurrence_pattern IS 'Cached recurrence pattern from the originating template (if any). Used by streak logic without requiring quest_templates join.';
