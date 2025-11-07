-- Add cooldown tracking column to characters table
ALTER TABLE characters
ADD COLUMN last_class_change_at TIMESTAMP WITH TIME ZONE;

-- Create change history table for audit log
CREATE TABLE character_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,  -- 'name', 'class', or 'password'
  old_value TEXT,             -- nullable for password changes
  new_value TEXT,             -- nullable for password changes
  gold_cost INTEGER,          -- nullable (only for class changes)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_change_history_character
  ON character_change_history(character_id);
CREATE INDEX idx_change_history_created
  ON character_change_history(created_at DESC);

-- Enable RLS
ALTER TABLE character_change_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own change history
CREATE POLICY "Users can view own change history"
  ON character_change_history
  FOR SELECT
  USING (
    character_id IN (
      SELECT id FROM characters
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Guild Masters can view family members' change history
CREATE POLICY "GMs can view family member change history"
  ON character_change_history
  FOR SELECT
  USING (
    character_id IN (
      SELECT c.id FROM characters c
      JOIN characters gm_char ON gm_char.user_id = auth.uid()
      JOIN user_profiles gm_profile ON gm_profile.id = gm_char.user_id
      JOIN families f ON f.id = gm_profile.family_id
      JOIN user_profiles family_member ON family_member.family_id = f.id
      WHERE c.user_id = family_member.id
      AND gm_profile.role = 'GUILD_MASTER'
    )
  );

-- RLS Policy: Allow service to insert records
CREATE POLICY "Service can insert changes"
  ON character_change_history
  FOR INSERT
  WITH CHECK (true);
