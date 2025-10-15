-- Migration: Add Recurring Quest System
-- PRD-0009: Recurring Quest System Implementation
-- Created: 2025-10-12

-- Step 1: Create new enums for recurring quest system

-- Quest type: INDIVIDUAL (assigned to specific characters) or FAMILY (claimable by any hero)
CREATE TYPE quest_type AS ENUM ('INDIVIDUAL', 'FAMILY');

-- Recurrence pattern: how often the quest repeats
CREATE TYPE recurrence_pattern AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM');

-- Step 2: Update quest_status enum to add new statuses for family quests
-- AVAILABLE: Family quest available for claiming
-- CLAIMED: Family quest claimed but not yet completed
-- MISSED: Quest expired without completion
ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'AVAILABLE';
ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'CLAIMED';
ALTER TYPE quest_status ADD VALUE IF NOT EXISTS 'MISSED';

-- Step 3: Add new columns to quest_templates table
ALTER TABLE quest_templates
  ADD COLUMN quest_type quest_type DEFAULT 'INDIVIDUAL',
  ADD COLUMN recurrence_pattern recurrence_pattern DEFAULT 'DAILY',
  ADD COLUMN is_paused BOOLEAN DEFAULT false,
  ADD COLUMN assigned_character_ids UUID[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN quest_templates.quest_type IS 'INDIVIDUAL = assigned to specific characters, FAMILY = claimable by any hero';
COMMENT ON COLUMN quest_templates.recurrence_pattern IS 'How often the quest repeats: DAILY, WEEKLY, or CUSTOM';
COMMENT ON COLUMN quest_templates.is_paused IS 'When paused, quests do not generate and streaks freeze';
COMMENT ON COLUMN quest_templates.assigned_character_ids IS 'For INDIVIDUAL quests: array of character IDs to generate quests for';

-- Step 4: Add new columns to quest_instances table
ALTER TABLE quest_instances
  ADD COLUMN quest_type quest_type DEFAULT 'INDIVIDUAL',
  ADD COLUMN volunteered_by UUID REFERENCES characters(id),
  ADD COLUMN volunteer_bonus INTEGER DEFAULT 0,
  ADD COLUMN streak_count INTEGER DEFAULT 0,
  ADD COLUMN streak_bonus INTEGER DEFAULT 0,
  ADD COLUMN cycle_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN cycle_end_date TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN quest_instances.quest_type IS 'Type of quest: INDIVIDUAL or FAMILY';
COMMENT ON COLUMN quest_instances.volunteered_by IS 'Character who volunteered for this family quest (earns volunteer bonus)';
COMMENT ON COLUMN quest_instances.volunteer_bonus IS 'Bonus XP/Gold percentage for volunteering (typically 20%)';
COMMENT ON COLUMN quest_instances.streak_count IS 'Current streak count at completion time';
COMMENT ON COLUMN quest_instances.streak_bonus IS 'Streak bonus percentage (+1% per 5 days, max +5%)';
COMMENT ON COLUMN quest_instances.cycle_start_date IS 'Start of the quest cycle (e.g., Monday 00:00 for weekly)';
COMMENT ON COLUMN quest_instances.cycle_end_date IS 'End of the quest cycle - quest expires if not completed';

-- Step 5: Create character_quest_streaks table for tracking streaks
CREATE TABLE character_quest_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, template_id)
);

COMMENT ON TABLE character_quest_streaks IS 'Tracks consecutive completion streaks for recurring quests';
COMMENT ON COLUMN character_quest_streaks.current_streak IS 'Current consecutive completions (resets on missed quest)';
COMMENT ON COLUMN character_quest_streaks.longest_streak IS 'Highest streak ever achieved for this template';
COMMENT ON COLUMN character_quest_streaks.last_completed_date IS 'Last date quest was completed (used to validate consecutive streaks)';

-- Step 6: Add week_start_day to families table
ALTER TABLE families
  ADD COLUMN week_start_day INTEGER DEFAULT 0;

COMMENT ON COLUMN families.week_start_day IS 'Which day the week starts (0=Sunday, 1=Monday, ..., 6=Saturday)';

-- Step 7: Add active_family_quest_id to characters table (one family quest per hero limit)
ALTER TABLE characters
  ADD COLUMN active_family_quest_id UUID REFERENCES quest_instances(id) ON DELETE SET NULL;

COMMENT ON COLUMN characters.active_family_quest_id IS 'Current active family quest (enforces one-family-quest-per-hero limit)';

-- Step 8: Create indexes for performance
CREATE INDEX idx_quest_instances_cycle_end_date ON quest_instances(cycle_end_date) WHERE cycle_end_date IS NOT NULL;
CREATE INDEX idx_quest_instances_status ON quest_instances(status);
CREATE INDEX idx_quest_instances_template_id ON quest_instances(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_character_quest_streaks_character_template ON character_quest_streaks(character_id, template_id);
CREATE INDEX idx_quest_templates_family_active ON quest_templates(family_id, is_active) WHERE is_active = true;
CREATE INDEX idx_characters_active_family_quest ON characters(active_family_quest_id) WHERE active_family_quest_id IS NOT NULL;

-- Step 9: Add updated_at trigger for character_quest_streaks
CREATE TRIGGER set_timestamp_character_quest_streaks
  BEFORE UPDATE ON character_quest_streaks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Step 10: Add constraint to ensure INDIVIDUAL quests have assigned characters
-- This is a check constraint that will be validated at application level primarily,
-- but we add a comment to document the business rule
COMMENT ON COLUMN quest_templates.quest_type IS 'INDIVIDUAL quests must have at least one assigned_character_id. FAMILY quests should have empty assigned_character_ids array.';

-- Step 11: Add constraint to prevent self-referential family quest claiming
-- (Cannot claim a quest assigned to yourself)
CREATE OR REPLACE FUNCTION check_family_quest_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- For FAMILY quests, volunteered_by should match assigned_to_id when claimed
  IF NEW.quest_type = 'FAMILY' AND NEW.volunteered_by IS NOT NULL THEN
    IF NEW.assigned_to_id IS NOT NULL AND NEW.assigned_to_id != (
      SELECT user_id FROM characters WHERE id = NEW.volunteered_by
    ) THEN
      RAISE EXCEPTION 'Family quest assigned_to_id must match the user_id of volunteered_by character';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_family_quest_claim
  BEFORE INSERT OR UPDATE ON quest_instances
  FOR EACH ROW
  EXECUTE FUNCTION check_family_quest_claim();

-- Migration complete
