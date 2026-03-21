-- SECURITY: fn_increment_character_stats is SECURITY DEFINER with no ownership check.
-- It must only be callable by the service role.
REVOKE EXECUTE ON FUNCTION fn_increment_character_stats(UUID, INTEGER, INTEGER)
  FROM authenticated;
