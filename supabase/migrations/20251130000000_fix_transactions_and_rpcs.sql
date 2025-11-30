-- Fix transactions table usage and add secure reward redemption RPC

-- 1. Add missing transaction type for Class Change
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'CLASS_CHANGE';

-- 2. Fix fn_change_character_class to use correct transactions schema
-- (Dropping first to ensure clean replacement if return type needed change, though usually OR REPLACE is fine)
DROP FUNCTION IF EXISTS fn_change_character_class(UUID, TEXT);

CREATE OR REPLACE FUNCTION fn_change_character_class(
  p_character_id UUID,
  p_new_class TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  class TEXT,
  level INTEGER,
  gold INTEGER,
  experience INTEGER,
  health INTEGER,
  max_health INTEGER,
  last_class_change_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_character RECORD;
  v_cost INTEGER;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := NOW();

  -- Lock and fetch character data to prevent race conditions
  SELECT * INTO v_character FROM characters WHERE id = p_character_id FOR UPDATE;

  IF v_character IS NULL THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  -- Check if class change is on cooldown (7 days)
  IF v_character.last_class_change_at IS NOT NULL
     AND (v_now - v_character.last_class_change_at) < INTERVAL '7 days' THEN
    RAISE EXCEPTION 'Class change is on cooldown. Please try again in 7 days';
  END IF;

  -- Calculate cost based on level
  v_cost := CASE
    WHEN v_character.level <= 5 THEN 100
    WHEN v_character.level <= 10 THEN 250
    WHEN v_character.level <= 15 THEN 500
    WHEN v_character.level <= 20 THEN 1000
    ELSE 2000
  END;

  -- Check if user has sufficient gold
  IF v_character.gold < v_cost THEN
    RAISE EXCEPTION 'Insufficient gold. Need %, have %', v_cost, v_character.gold;
  END IF;

  -- Update character class and gold
  UPDATE characters
  SET
    class = p_new_class,
    gold = gold - v_cost,
    last_class_change_at = v_now,
    updated_at = v_now
  WHERE id = p_character_id;

  -- Record transaction (FIXED SCHEMA USAGE)
  INSERT INTO transactions (
    user_id,
    type,
    gold_change,
    description,
    related_id,
    created_at
  ) VALUES (
    v_character.user_id,
    'CLASS_CHANGE',
    -v_cost,
    FORMAT('Class change from %s to %s', v_character.class, p_new_class),
    p_character_id,
    v_now
  );

  -- Record change history
  INSERT INTO character_change_history (
    character_id,
    change_type,
    old_value,
    new_value,
    gold_cost,
    created_at
  ) VALUES (
    p_character_id,
    'class',
    v_character.class,
    p_new_class,
    v_cost,
    v_now
  );

  -- Return updated character data
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.name,
    c.class,
    c.level,
    c.gold,
    c.experience,
    c.health,
    c.max_health,
    c.last_class_change_at,
    c.created_at,
    c.updated_at
  FROM characters c
  WHERE c.id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) TO authenticated;


-- 3. Create redeem_reward RPC for atomic transaction
CREATE OR REPLACE FUNCTION redeem_reward(
  p_reward_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_reward RECORD;
  v_gold INTEGER;
  v_cost INTEGER;
  v_new_gold INTEGER;
  v_redemption_id UUID;
BEGIN
  -- Fetch reward details
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id;
  IF v_reward IS NULL THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  v_cost := v_reward.cost;

  -- Fetch user gold from characters table
  SELECT gold INTO v_gold FROM characters WHERE user_id = p_user_id;
  
  IF v_gold IS NULL THEN
    RAISE EXCEPTION 'Character not found for user';
  END IF;

  IF v_gold < v_cost THEN
    RAISE EXCEPTION 'Insufficient gold';
  END IF;

  v_new_gold := v_gold - v_cost;

  -- Deduct gold
  UPDATE characters SET gold = v_new_gold, updated_at = NOW() WHERE user_id = p_user_id;

  -- Insert redemption
  INSERT INTO reward_redemptions (
    user_id,
    reward_id,
    cost,
    status,
    requested_at,
    reward_name,
    reward_description,
    reward_type
  ) VALUES (
    p_user_id,
    p_reward_id,
    v_cost,
    'PENDING',
    NOW(),
    v_reward.name,
    v_reward.description,
    v_reward.type::text
  ) RETURNING id INTO v_redemption_id;

  -- Log transaction
  INSERT INTO transactions (
    user_id,
    type,
    gold_change,
    description,
    related_id
  ) VALUES (
    p_user_id,
    'STORE_PURCHASE',
    -v_cost,
    FORMAT('Redeemed reward: %s', v_reward.name),
    v_redemption_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_gold,
    'redemption_id', v_redemption_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION redeem_reward(UUID, UUID) TO authenticated;
