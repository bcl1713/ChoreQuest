-- Boss quest participant approvals and rewards

ALTER TABLE boss_battle_participants
  ADD COLUMN IF NOT EXISTS participation_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS awarded_gold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS awarded_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS honor_awarded INTEGER NOT NULL DEFAULT 0;

-- Constrain status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_participants_status_chk'
  ) THEN
    ALTER TABLE boss_battle_participants
    ADD CONSTRAINT boss_battle_participants_status_chk
    CHECK (participation_status IN ('PENDING', 'APPROVED', 'PARTIAL', 'DENIED'));
  END IF;
END$$;
