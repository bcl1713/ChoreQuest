-- RPC function to atomically change character class with all related updates
-- This ensures data integrity by wrapping all operations in a single transaction
CREATE OR REPLACE FUNCTION fn_change_character_class(
  p_character_id UUID,
  p_new_class TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  class character_class,
  level INTEGER,
  gold INTEGER,
  xp INTEGER,
  gems INTEGER,
  honor_points INTEGER,
  last_class_change_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_character characters%ROWTYPE;
  v_cost INTEGER;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := NOW();

  -- Lock and fetch character data to prevent race conditions
  SELECT * INTO v_character FROM characters WHERE characters.id = p_character_id FOR UPDATE;

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
    class = p_new_class::character_class,
    gold = characters.gold - v_cost,
    last_class_change_at = v_now,
    updated_at = v_now
  WHERE characters.id = p_character_id;

  -- Record transaction
  INSERT INTO transactions (
    user_id,
    type,
    gold_change,
    description,
    related_id,
    created_at
  ) VALUES (
    v_character.user_id,
    'STORE_PURCHASE'::transaction_type,
    -v_cost,
    FORMAT('Class change from %s to %s', v_character.class, p_new_class::text),
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
    v_character.class::text,
    p_new_class,
    v_cost,
    v_now
  );

  -- Return updated character data by re-fetching from database
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.name,
    c.class,
    c.level,
    c.gold,
    c.xp,
    c.gems,
    c.honor_points,
    c.last_class_change_at,
    c.created_at,
    c.updated_at
  FROM characters c
  WHERE c.id = p_character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fn_change_character_class(UUID, TEXT) TO authenticated;
