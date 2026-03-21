-- SECURITY: fn_increment_character_stats is SECURITY DEFINER with no
-- ownership check. The previous migration revoked from authenticated;
-- this revokes from PUBLIC as well, fully restricting execution to
-- service_role only.
REVOKE EXECUTE ON FUNCTION fn_increment_character_stats(UUID, INTEGER, INTEGER)
  FROM PUBLIC;
