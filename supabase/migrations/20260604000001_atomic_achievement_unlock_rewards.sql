-- Atomically mark achievements unlocked and grant their rewards.
-- This prevents a partial-failure window where unlocked_at is written but the
-- character never receives the XP/gold payout.
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
  WITH unlocked AS (
    UPDATE character_achievements
    SET unlocked_at = NOW()
    WHERE character_id = p_character_id
      AND achievement_id = ANY(p_achievement_ids)
      AND unlocked_at IS NULL
      AND season_id IS NOT DISTINCT FROM p_season_id
    RETURNING achievement_id
  ),
  reward_totals AS (
    SELECT
      COALESCE(SUM(a.xp_reward), 0)::INTEGER AS awarded_xp,
      COALESCE(SUM(a.gold_reward), 0)::INTEGER AS awarded_gold
    FROM achievements a
    INNER JOIN unlocked u ON u.achievement_id = a.id
  ),
  stats AS (
    UPDATE characters
    SET
      xp = COALESCE(characters.xp, 0) + reward_totals.awarded_xp,
      gold = COALESCE(characters.gold, 0) + reward_totals.awarded_gold
    FROM reward_totals
    WHERE characters.id = p_character_id
      AND EXISTS (SELECT 1 FROM unlocked)
    RETURNING characters.xp, characters.gold, characters.level
  )
  SELECT
    COALESCE(
      (SELECT array_agg(u.achievement_id ORDER BY u.achievement_id) FROM unlocked u),
      ARRAY[]::UUID[]
    ) AS unlocked_achievement_ids,
    COALESCE((SELECT reward_totals.awarded_xp FROM reward_totals), 0) AS awarded_xp,
    COALESCE((SELECT reward_totals.awarded_gold FROM reward_totals), 0) AS awarded_gold,
    (SELECT stats.xp FROM stats) AS xp,
    (SELECT stats.gold FROM stats) AS gold,
    (SELECT stats.level FROM stats) AS level;
$$ LANGUAGE sql SECURITY DEFINER;

REVOKE ALL ON FUNCTION fn_unlock_achievements_and_grant_rewards(UUID, UUID[], UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_unlock_achievements_and_grant_rewards(UUID, UUID[], UUID) TO service_role;
