-- Boss Quest join window and rewards

ALTER TABLE boss_battles
  ADD COLUMN join_window_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN join_window_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
  ADD COLUMN reward_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reward_gold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN honor_reward INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN rewards_distributed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN defeated_at TIMESTAMPTZ;

-- Backfill join window expiry for existing rows
UPDATE boss_battles
SET join_window_expires_at = COALESCE(start_date, NOW()) + (join_window_minutes || ' minutes')::interval
WHERE join_window_expires_at IS NULL;

CREATE INDEX idx_boss_battles_join_window_expires ON boss_battles(join_window_expires_at);

-- Enforce join window and active status in participation policy
DROP POLICY IF EXISTS "Users can join boss battles" ON boss_battle_participants;
CREATE POLICY "Users can join boss battles" ON boss_battle_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM boss_battles bb
      WHERE bb.id = boss_battle_id
        AND bb.family_id = get_user_family_id()
        AND bb.status = 'ACTIVE'
        AND bb.join_window_expires_at >= NOW()
    )
  );
