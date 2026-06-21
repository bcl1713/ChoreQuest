-- Canonical gold ledger foundation (#237).
--
-- Policy: honest forward truth. Entries in gold_ledger_entries are canonical
-- for gold mutations after this migration. Pre-ledger state may be represented
-- by explicit OPENING_BALANCE, MIGRATION, or CORRECTION entries; this migration
-- intentionally does not claim full historical reconstruction.

DO $$
BEGIN
  CREATE TYPE gold_ledger_entry_type AS ENUM (
    'QUEST_REWARD',
    'STORE_PURCHASE',
    'REWARD_REFUND',
    'BOSS_REWARD',
    'ACHIEVEMENT_BONUS',
    'ADMIN_ADJUSTMENT',
    'CLASS_CHANGE_COST',
    'OPENING_BALANCE',
    'MIGRATION',
    'CORRECTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS gold_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  gold_delta INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  entry_type gold_ledger_entry_type NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  actor_user_id UUID REFERENCES user_profiles(id),
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (balance_after = balance_before + gold_delta),
  CHECK (source_type <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gold_ledger_source
  -- UNIQUE (source_type, source_id) when source_id is present; NULL source_id entries remain usable for correction/migration batches.
  ON gold_ledger_entries(source_type, source_id)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gold_ledger_character_created
  ON gold_ledger_entries(character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gold_ledger_user_created
  ON gold_ledger_entries(user_id, created_at DESC);

ALTER TABLE gold_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gold ledger entries"
  ON gold_ledger_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guild Masters can view family gold ledger entries"
  ON gold_ledger_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles viewer
      JOIN user_profiles target ON target.family_id = viewer.family_id
      WHERE viewer.id = auth.uid()
        AND viewer.role = 'GUILD_MASTER'
        AND target.id = gold_ledger_entries.user_id
    )
  );

CREATE OR REPLACE FUNCTION fn_insert_gold_ledger_entry(
  p_character_id UUID,
  p_user_id UUID,
  p_gold_delta INTEGER,
  p_entry_type gold_ledger_entry_type,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_balance_after INTEGER;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  SELECT COALESCE(gold, 0)
  INTO v_balance_after
  FROM characters
  WHERE id = p_character_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_balance_after IS NULL THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO gold_ledger_entries (
    character_id,
    user_id,
    gold_delta,
    balance_before,
    balance_after,
    entry_type,
    source_type,
    source_id,
    actor_user_id,
    reason,
    metadata
  ) VALUES (
    p_character_id,
    p_user_id,
    COALESCE(p_gold_delta, 0),
    v_balance_after - COALESCE(p_gold_delta, 0),
    v_balance_after,
    p_entry_type,
    p_source_type,
    p_source_id,
    p_actor_user_id,
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION fn_insert_gold_ledger_entry(UUID, UUID, INTEGER, gold_ledger_entry_type, TEXT, UUID, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_insert_gold_ledger_entry(UUID, UUID, INTEGER, gold_ledger_entry_type, TEXT, UUID, UUID, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION fn_apply_quest_reward(
  p_character_id UUID,
  p_quest_id UUID,
  p_user_id UUID,
  p_xp INTEGER,
  p_gold INTEGER
)
RETURNS TABLE (xp INTEGER, gold INTEGER, level INTEGER) AS $$
DECLARE
  v_updated RECORD;
BEGIN
  UPDATE characters
  SET
    xp = COALESCE(characters.xp, 0) + COALESCE(p_xp, 0),
    gold = COALESCE(characters.gold, 0) + COALESCE(p_gold, 0),
    level = GREATEST(
      COALESCE(characters.level, 1),
      FLOOR(SQRT(GREATEST(COALESCE(characters.xp, 0) + COALESCE(p_xp, 0), 0)::NUMERIC / 50))::INTEGER + 1
    ),
    active_family_quest_id = NULL
  WHERE id = p_character_id
    AND user_id = p_user_id
  RETURNING characters.xp, characters.gold, characters.level
  INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO transactions (user_id, type, xp_change, gold_change, related_id, description)
  VALUES (p_user_id, 'QUEST_REWARD'::transaction_type, COALESCE(p_xp, 0), COALESCE(p_gold, 0), p_quest_id, 'Quest reward approved');

  PERFORM fn_insert_gold_ledger_entry(
    p_character_id, p_user_id, COALESCE(p_gold, 0), 'QUEST_REWARD',
    'quest_instances', p_quest_id, NULL, 'Quest reward approved',
    jsonb_build_object('xp_delta', COALESCE(p_xp, 0))
  );

  RETURN QUERY SELECT v_updated.xp, v_updated.gold, v_updated.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS SETOF reward_redemptions AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_character_id UUID;
  v_redemption reward_redemptions%ROWTYPE;
BEGIN
  SELECT r.* INTO v_reward
  FROM rewards r
  JOIN user_profiles up ON up.family_id = r.family_id
  WHERE r.id = p_reward_id
    AND up.id = p_user_id
    AND r.is_active IS TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REWARD_NOT_FOUND_OR_INACTIVE';
  END IF;

  UPDATE characters
  SET gold = COALESCE(characters.gold, 0) - COALESCE(v_reward.cost, 0)
  WHERE id = (
    SELECT c.id FROM characters c WHERE c.user_id = p_user_id ORDER BY c.created_at ASC LIMIT 1
  )
    AND COALESCE(characters.gold, 0) >= COALESCE(v_reward.cost, 0)
  RETURNING id INTO v_character_id;

  IF v_character_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM characters WHERE user_id = p_user_id) THEN
      RAISE EXCEPTION 'INSUFFICIENT_GOLD';
    END IF;
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO reward_redemptions (user_id, reward_id, cost, reward_name, reward_description, reward_type, status, notes)
  VALUES (p_user_id, p_reward_id, v_reward.cost, v_reward.name, v_reward.description, v_reward.type, 'PENDING', NULL)
  RETURNING * INTO v_redemption;

  INSERT INTO transactions (user_id, type, gold_change, related_id, description)
  VALUES (p_user_id, 'STORE_PURCHASE'::transaction_type, -COALESCE(v_reward.cost, 0), v_redemption.id, 'Reward redeemed: ' || v_reward.name);

  PERFORM fn_insert_gold_ledger_entry(
    v_character_id, p_user_id, -COALESCE(v_reward.cost, 0), 'STORE_PURCHASE',
    'reward_redemptions', v_redemption.id, p_user_id, 'Reward redeemed: ' || v_reward.name,
    jsonb_build_object('reward_id', p_reward_id, 'cost', COALESCE(v_reward.cost, 0))
  );

  RETURN NEXT v_redemption;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_refund_reward_gold(
  p_user_id UUID,
  p_amount INTEGER,
  p_redemption_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_character_id UUID;
BEGIN
  UPDATE characters
  SET gold = COALESCE(gold, 0) + COALESCE(p_amount, 0)
  WHERE id = (
    SELECT c.id FROM characters c WHERE c.user_id = p_user_id ORDER BY c.created_at ASC LIMIT 1
  )
  RETURNING id INTO v_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO transactions (user_id, type, gold_change, related_id, description)
  VALUES (p_user_id, 'REWARD_REFUND'::transaction_type, COALESCE(p_amount, 0), p_redemption_id, 'Reward redemption refunded');

  PERFORM fn_insert_gold_ledger_entry(
    v_character_id, p_user_id, COALESCE(p_amount, 0), 'REWARD_REFUND',
    'reward_redemptions', p_redemption_id, NULL, 'Reward redemption refunded', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_deny_reward_redemption(
  p_redemption_id UUID,
  p_user_id UUID,
  p_amount INTEGER,
  p_denied_by UUID DEFAULT NULL
)
RETURNS SETOF reward_redemptions AS $$
DECLARE
  v_redemption reward_redemptions%ROWTYPE;
BEGIN
  UPDATE reward_redemptions
  SET status = 'DENIED', approved_by = p_denied_by
  WHERE id = p_redemption_id
    AND user_id = p_user_id
    AND status = 'PENDING'
  RETURNING * INTO v_redemption;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REDEMPTION_NOT_PENDING';
  END IF;

  PERFORM fn_refund_reward_gold(p_user_id, p_amount, p_redemption_id);

  RETURN NEXT v_redemption;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_apply_boss_reward(
  p_character_id UUID,
  p_user_id UUID,
  p_boss_battle_id UUID,
  p_participant_id UUID,
  p_gold INTEGER,
  p_xp INTEGER,
  p_honor INTEGER,
  p_status TEXT,
  p_actor_user_id UUID DEFAULT NULL
)
RETURNS TABLE (xp INTEGER, gold INTEGER, honor_points INTEGER, level INTEGER) AS $$
DECLARE
  v_updated RECORD;
BEGIN
  UPDATE characters
  SET
    xp = COALESCE(characters.xp, 0) + COALESCE(p_xp, 0),
    gold = COALESCE(characters.gold, 0) + COALESCE(p_gold, 0),
    honor_points = COALESCE(characters.honor_points, 0) + COALESCE(p_honor, 0),
    level = GREATEST(
      COALESCE(characters.level, 1),
      FLOOR(SQRT(GREATEST(COALESCE(characters.xp, 0) + COALESCE(p_xp, 0), 0)::NUMERIC / 50))::INTEGER + 1
    )
  WHERE id = p_character_id
    AND user_id = p_user_id
  RETURNING characters.xp, characters.gold, characters.honor_points, characters.level
  INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO transactions (user_id, type, xp_change, gold_change, honor_change, related_id, description)
  VALUES (p_user_id, 'BOSS_VICTORY'::transaction_type, COALESCE(p_xp, 0), COALESCE(p_gold, 0), COALESCE(p_honor, 0), p_boss_battle_id, 'Boss quest rewards (' || p_status || ')');

  PERFORM fn_insert_gold_ledger_entry(
    p_character_id, p_user_id, COALESCE(p_gold, 0), 'BOSS_REWARD',
    'boss_battle_participants', p_participant_id, p_actor_user_id, 'Boss quest rewards (' || p_status || ')',
    jsonb_build_object('boss_battle_id', p_boss_battle_id, 'xp_delta', COALESCE(p_xp, 0), 'honor_delta', COALESCE(p_honor, 0), 'status', p_status)
  );

  RETURN QUERY SELECT v_updated.xp, v_updated.gold, v_updated.honor_points, v_updated.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_unlock_achievements_and_grant_rewards(
  p_character_id UUID,
  p_achievement_ids UUID[],
  p_season_id UUID DEFAULT NULL
)
RETURNS TABLE (
  unlocked_achievement_ids UUID[],
  awarded_xp INTEGER,
  awarded_gold INTEGER,
  xp INTEGER,
  gold INTEGER,
  level INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_unlocked_ids UUID[];
  v_awarded_xp INTEGER;
  v_awarded_gold INTEGER;
  v_stats RECORD;
BEGIN
  SELECT user_id INTO v_user_id FROM characters WHERE id = p_character_id FOR UPDATE;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  WITH unlocked AS (
    UPDATE character_achievements
    SET unlocked_at = NOW()
    WHERE character_id = p_character_id
      AND achievement_id = ANY(p_achievement_ids)
      AND unlocked_at IS NULL
      AND season_id IS NOT DISTINCT FROM p_season_id
    RETURNING achievement_id
  )
  SELECT
    COALESCE(array_agg(u.achievement_id ORDER BY u.achievement_id), ARRAY[]::UUID[]),
    COALESCE(SUM(a.xp_reward), 0)::INTEGER,
    COALESCE(SUM(a.gold_reward), 0)::INTEGER
  INTO v_unlocked_ids, v_awarded_xp, v_awarded_gold
  FROM unlocked u
  JOIN achievements a ON a.id = u.achievement_id;

  UPDATE characters
  SET xp = COALESCE(characters.xp, 0) + COALESCE(v_awarded_xp, 0),
      gold = COALESCE(characters.gold, 0) + COALESCE(v_awarded_gold, 0)
  WHERE characters.id = p_character_id
    AND array_length(v_unlocked_ids, 1) IS NOT NULL
  RETURNING characters.xp, characters.gold, characters.level
  INTO v_stats;

  IF array_length(v_unlocked_ids, 1) IS NOT NULL THEN
    PERFORM fn_insert_gold_ledger_entry(
      p_character_id, v_user_id, COALESCE(v_awarded_gold, 0), 'ACHIEVEMENT_BONUS',
      'character_achievements', NULL, NULL, 'Achievement bonus',
      jsonb_build_object('achievement_ids', v_unlocked_ids, 'xp_delta', COALESCE(v_awarded_xp, 0), 'season_id', p_season_id)
    );
  END IF;

  RETURN QUERY SELECT COALESCE(v_unlocked_ids, ARRAY[]::UUID[]), COALESCE(v_awarded_xp, 0), COALESCE(v_awarded_gold, 0), v_stats.xp, v_stats.gold, v_stats.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_change_character_class(
  p_character_id UUID,
  p_new_class TEXT
)
RETURNS SETOF characters AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_updated characters%ROWTYPE;
  v_cost INTEGER;
BEGIN
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  IF v_character.last_class_change_at IS NOT NULL
     AND (NOW() - v_character.last_class_change_at) < INTERVAL '7 days' THEN
    RAISE EXCEPTION 'Class change is on cooldown. Please try again in 7 days';
  END IF;

  v_cost := CASE
    WHEN COALESCE(v_character.level, 1) <= 5 THEN 100
    WHEN COALESCE(v_character.level, 1) <= 10 THEN 250
    WHEN COALESCE(v_character.level, 1) <= 15 THEN 500
    WHEN COALESCE(v_character.level, 1) <= 20 THEN 1000
    ELSE 2000
  END;

  IF COALESCE(v_character.gold, 0) < v_cost THEN
    RAISE EXCEPTION 'Insufficient gold. Need %, have %', v_cost, COALESCE(v_character.gold, 0);
  END IF;

  UPDATE characters
  SET class = p_new_class::character_class,
      gold = COALESCE(gold, 0) - v_cost,
      last_class_change_at = NOW(),
      updated_at = NOW()
  WHERE id = p_character_id
  RETURNING * INTO v_updated;

  INSERT INTO character_change_history (character_id, change_type, old_value, new_value, gold_cost, created_at)
  VALUES (p_character_id, 'class', v_character.class::TEXT, p_new_class, v_cost, NOW());

  PERFORM fn_insert_gold_ledger_entry(
    p_character_id, v_character.user_id, -v_cost, 'CLASS_CHANGE_COST',
    'character_change_history', NULL, v_character.user_id, FORMAT('Class change from %s to %s', v_character.class, p_new_class),
    jsonb_build_object('old_class', v_character.class, 'new_class', p_new_class, 'cost', v_cost)
  );

  RETURN NEXT v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_record_admin_gold_adjustment(
  p_character_id UUID,
  p_new_gold INTEGER,
  p_actor_user_id UUID,
  p_reason TEXT
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_delta INTEGER;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  v_delta := COALESCE(p_new_gold, 0) - COALESCE(v_character.gold, 0);

  UPDATE characters SET gold = COALESCE(p_new_gold, 0), updated_at = NOW() WHERE id = p_character_id;

  INSERT INTO transactions (user_id, type, description, gold_change, xp_change, gems_change, honor_change)
  VALUES (v_character.user_id, 'BONUS_AWARD'::transaction_type, 'Admin Adjustment: ' || COALESCE(p_reason, ''), v_delta, 0, 0, 0);

  SELECT * INTO v_entry FROM fn_insert_gold_ledger_entry(
    p_character_id, v_character.user_id, v_delta, 'ADMIN_ADJUSTMENT',
    'admin_gold_adjustment', NULL, p_actor_user_id, p_reason,
    jsonb_build_object('old_gold', COALESCE(v_character.gold, 0), 'new_gold', COALESCE(p_new_gold, 0))
  );
  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_record_opening_gold_balance(
  p_character_id UUID,
  p_actor_user_id UUID,
  p_reason TEXT DEFAULT 'Opening gold balance'
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CHARACTER_NOT_FOUND'; END IF;
  SELECT * INTO v_entry FROM fn_insert_gold_ledger_entry(
    p_character_id, v_character.user_id, COALESCE(v_character.gold, 0), 'OPENING_BALANCE',
    'opening_balance', p_character_id, p_actor_user_id, p_reason, '{}'::jsonb
  );
  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_record_gold_migration_entry(
  p_character_id UUID,
  p_gold_delta INTEGER,
  p_actor_user_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CHARACTER_NOT_FOUND'; END IF;
  UPDATE characters SET gold = COALESCE(gold, 0) + COALESCE(p_gold_delta, 0), updated_at = NOW() WHERE id = p_character_id;
  SELECT * INTO v_entry FROM fn_insert_gold_ledger_entry(
    p_character_id, v_character.user_id, COALESCE(p_gold_delta, 0), 'MIGRATION',
    'gold_migration', NULL, p_actor_user_id, p_reason, COALESCE(p_metadata, '{}'::jsonb)
  );
  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_record_gold_correction_entry(
  p_character_id UUID,
  p_gold_delta INTEGER,
  p_actor_user_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS gold_ledger_entries AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_entry gold_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CHARACTER_NOT_FOUND'; END IF;
  UPDATE characters SET gold = COALESCE(gold, 0) + COALESCE(p_gold_delta, 0), updated_at = NOW() WHERE id = p_character_id;
  SELECT * INTO v_entry FROM fn_insert_gold_ledger_entry(
    p_character_id, v_character.user_id, COALESCE(p_gold_delta, 0), 'CORRECTION',
    'gold_correction', NULL, p_actor_user_id, p_reason, COALESCE(p_metadata, '{}'::jsonb)
  );
  RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION fn_apply_quest_reward(UUID, UUID, UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION fn_redeem_reward(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_refund_reward_gold(UUID, INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_deny_reward_redemption(UUID, UUID, INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_apply_boss_reward(UUID, UUID, UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_unlock_achievements_and_grant_rewards(UUID, UUID[], UUID) TO service_role;
GRANT EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_record_admin_gold_adjustment(UUID, INTEGER, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION fn_record_opening_gold_balance(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION fn_record_gold_migration_entry(UUID, INTEGER, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION fn_record_gold_correction_entry(UUID, INTEGER, UUID, TEXT, JSONB) TO service_role;
