-- Atomically increment a character's XP and gold in a single operation.
-- Returns the new xp, gold, and current level after the update.
-- Using this function prevents concurrent read-modify-write races when multiple
-- achievements unlock simultaneously for the same character.
CREATE OR REPLACE FUNCTION fn_increment_character_stats(
  p_character_id UUID,
  p_xp INTEGER,
  p_gold INTEGER
)
RETURNS TABLE (xp INTEGER, gold INTEGER, level INTEGER) AS $$
  UPDATE characters
  SET
    xp = xp + p_xp,
    gold = gold + p_gold
  WHERE id = p_character_id
  RETURNING xp, gold, level;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_increment_character_stats(UUID, INTEGER, INTEGER) TO service_role;
