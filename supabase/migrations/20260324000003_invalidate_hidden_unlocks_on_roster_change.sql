-- Synchronously invalidate cached unlock state for hidden family achievements
-- whenever a user joins or leaves a family.
--
-- The RLS policies on family_achievements and family_achievement_progress decide
-- visibility from family_achievement_progress.unlocked_at.  That column is
-- written by the lazy backfill in /api/family-achievements and is therefore
-- stale after any roster change — a newly joined member could read hidden
-- achievements directly through the public Supabase client if a stale
-- unlocked_at row is still present.
--
-- This trigger fires synchronously on INSERT / UPDATE (family_id change) /
-- DELETE of user_profiles rows and clears unlocked_at for every hidden
-- achievement belonging to the affected family.  The next API call will run
-- backfillIfStale(), re-evaluate criteria against the current roster, and
-- restore unlocked_at where the achievement is still legitimately earned.
--
-- Only hidden achievements are touched; non-hidden achievements are always
-- visible regardless of unlocked_at so there is no reason to disturb them.

CREATE OR REPLACE FUNCTION invalidate_hidden_achievement_unlocks_on_roster_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.family_id IS NOT NULL THEN
    UPDATE family_achievement_progress fap
    SET    unlocked_at = NULL
    FROM   family_achievements fa
    WHERE  fap.family_achievement_id = fa.id
      AND  fa.is_hidden              = TRUE
      AND  fap.family_id             = NEW.family_id
      AND  fap.unlocked_at IS NOT NULL;

  ELSIF TG_OP = 'UPDATE' AND (OLD.family_id IS DISTINCT FROM NEW.family_id) THEN
    -- Member left their previous family.
    IF OLD.family_id IS NOT NULL THEN
      UPDATE family_achievement_progress fap
      SET    unlocked_at = NULL
      FROM   family_achievements fa
      WHERE  fap.family_achievement_id = fa.id
        AND  fa.is_hidden              = TRUE
        AND  fap.family_id             = OLD.family_id
        AND  fap.unlocked_at IS NOT NULL;
    END IF;
    -- Member joined a new family.
    IF NEW.family_id IS NOT NULL THEN
      UPDATE family_achievement_progress fap
      SET    unlocked_at = NULL
      FROM   family_achievements fa
      WHERE  fap.family_achievement_id = fa.id
        AND  fa.is_hidden              = TRUE
        AND  fap.family_id             = NEW.family_id
        AND  fap.unlocked_at IS NOT NULL;
    END IF;

  ELSIF TG_OP = 'DELETE' AND OLD.family_id IS NOT NULL THEN
    UPDATE family_achievement_progress fap
    SET    unlocked_at = NULL
    FROM   family_achievements fa
    WHERE  fap.family_achievement_id = fa.id
      AND  fa.is_hidden              = TRUE
      AND  fap.family_id             = OLD.family_id
      AND  fap.unlocked_at IS NOT NULL;
  END IF;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

CREATE TRIGGER trg_invalidate_hidden_unlocks_on_roster_change
  AFTER INSERT OR UPDATE OF family_id OR DELETE
  ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION invalidate_hidden_achievement_unlocks_on_roster_change();
