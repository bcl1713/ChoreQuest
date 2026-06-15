-- Atomic gold/stat mutation helpers for quest payouts and reward redemptions.
-- These functions keep balance changes and audit rows in the same database
-- transaction so stale client or application state cannot overwrite gold.

CREATE OR REPLACE FUNCTION fn_apply_quest_reward(
  p_character_id UUID,
  p_quest_id UUID,
  p_user_id UUID,
  p_xp INTEGER,
  p_gold INTEGER
)
RETURNS TABLE (xp INTEGER, gold INTEGER, level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH updated AS (
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
  ), audit AS (
    INSERT INTO transactions (
      user_id,
      type,
      xp_change,
      gold_change,
      related_id,
      description
    )
    SELECT
      p_user_id,
      'QUEST_REWARD'::transaction_type,
      COALESCE(p_xp, 0),
      COALESCE(p_gold, 0),
      p_quest_id,
      'Quest reward approved'
    WHERE EXISTS (SELECT 1 FROM updated)
    RETURNING id
  )
  SELECT updated.xp, updated.gold, updated.level
  FROM updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION fn_apply_quest_reward(UUID, UUID, UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_apply_quest_reward(UUID, UUID, UUID, INTEGER, INTEGER) TO service_role;

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
  SELECT r.*
  INTO v_reward
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
    SELECT c.id
    FROM characters c
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at ASC
    LIMIT 1
  )
    AND COALESCE(characters.gold, 0) >= COALESCE(v_reward.cost, 0)
  RETURNING id INTO v_character_id;

  IF v_character_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM characters WHERE user_id = p_user_id) THEN
      RAISE EXCEPTION 'INSUFFICIENT_GOLD';
    END IF;
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO reward_redemptions (
    user_id,
    reward_id,
    cost,
    reward_name,
    reward_description,
    reward_type,
    status,
    notes
  )
  VALUES (
    p_user_id,
    p_reward_id,
    v_reward.cost,
    v_reward.name,
    v_reward.description,
    v_reward.type,
    'PENDING',
    NULL
  )
  RETURNING * INTO v_redemption;

  INSERT INTO transactions (
    user_id,
    type,
    gold_change,
    related_id,
    description
  )
  VALUES (
    p_user_id,
    'STORE_PURCHASE'::transaction_type,
    -COALESCE(v_reward.cost, 0),
    v_redemption.id,
    'Reward redeemed: ' || v_reward.name
  );

  RETURN NEXT v_redemption;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION fn_redeem_reward(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_redeem_reward(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION fn_refund_reward_gold(
  p_user_id UUID,
  p_amount INTEGER,
  p_redemption_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE characters
  SET gold = COALESCE(gold, 0) + COALESCE(p_amount, 0)
  WHERE id = (
    SELECT c.id
    FROM characters c
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at ASC
    LIMIT 1
  );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHARACTER_NOT_FOUND';
  END IF;

  INSERT INTO transactions (
    user_id,
    type,
    gold_change,
    related_id,
    description
  )
  VALUES (
    p_user_id,
    'REWARD_REFUND'::transaction_type,
    COALESCE(p_amount, 0),
    p_redemption_id,
    'Reward redemption refunded'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION fn_refund_reward_gold(UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_refund_reward_gold(UUID, INTEGER, UUID) TO service_role;

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
  SET
    status = 'DENIED',
    approved_by = p_denied_by
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

REVOKE ALL ON FUNCTION fn_deny_reward_redemption(UUID, UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_deny_reward_redemption(UUID, UUID, INTEGER, UUID) TO service_role;
