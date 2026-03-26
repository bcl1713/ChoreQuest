-- Two correctness fixes for hidden-achievement invalidation on roster changes.
--
-- Fix 1 (P2): Delete per-user notification rows when roster-triggered re-locks occur.
--   The previous trigger only cleared unlocked_at but left stale rows in
--   family_achievement_user_notifications.  If the family later re-earns the
--   achievement, fetchUnnotifiedFamilyAchievements() would suppress the toast
--   because the old notification row (for the same progress id) still exists.
--   Solution: use a CTE to collect the re-locked progress ids and delete them
--   from family_achievement_user_notifications in the same statement.
--
-- Fix 2 (P1): Invalidate hidden unlocks when a member gains or loses their only
--   character.  All-mode character-based achievements are stale whenever the
--   character roster changes, not just when the user_profiles.family_id changes.
--   Solution: a new trigger on the characters table that performs the same
--   invalidation (+ notification purge) for the affected user's family.

-- ============================================================
-- 1. Replace roster-change trigger function to also purge notification rows
-- ============================================================

CREATE OR REPLACE FUNCTION invalidate_hidden_achievement_unlocks_on_roster_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.family_id IS NOT NULL THEN
    WITH cleared AS (
      UPDATE family_achievement_progress fap
      SET    unlocked_at = NULL
      FROM   family_achievements fa
      WHERE  fap.family_achievement_id = fa.id
        AND  fa.is_hidden              = TRUE
        AND  fap.family_id             = NEW.family_id
        AND  fap.unlocked_at IS NOT NULL
      RETURNING fap.id
    )
    DELETE FROM family_achievement_user_notifications faun
    USING cleared
    WHERE faun.family_achievement_progress_id = cleared.id;

  ELSIF TG_OP = 'UPDATE' AND (OLD.family_id IS DISTINCT FROM NEW.family_id) THEN
    IF OLD.family_id IS NOT NULL THEN
      WITH cleared AS (
        UPDATE family_achievement_progress fap
        SET    unlocked_at = NULL
        FROM   family_achievements fa
        WHERE  fap.family_achievement_id = fa.id
          AND  fa.is_hidden              = TRUE
          AND  fap.family_id             = OLD.family_id
          AND  fap.unlocked_at IS NOT NULL
        RETURNING fap.id
      )
      DELETE FROM family_achievement_user_notifications faun
      USING cleared
      WHERE faun.family_achievement_progress_id = cleared.id;
    END IF;
    IF NEW.family_id IS NOT NULL THEN
      WITH cleared AS (
        UPDATE family_achievement_progress fap
        SET    unlocked_at = NULL
        FROM   family_achievements fa
        WHERE  fap.family_achievement_id = fa.id
          AND  fa.is_hidden              = TRUE
          AND  fap.family_id             = NEW.family_id
          AND  fap.unlocked_at IS NOT NULL
        RETURNING fap.id
      )
      DELETE FROM family_achievement_user_notifications faun
      USING cleared
      WHERE faun.family_achievement_progress_id = cleared.id;
    END IF;

  ELSIF TG_OP = 'DELETE' AND OLD.family_id IS NOT NULL THEN
    WITH cleared AS (
      UPDATE family_achievement_progress fap
      SET    unlocked_at = NULL
      FROM   family_achievements fa
      WHERE  fap.family_achievement_id = fa.id
        AND  fa.is_hidden              = TRUE
        AND  fap.family_id             = OLD.family_id
        AND  fap.unlocked_at IS NOT NULL
      RETURNING fap.id
    )
    DELETE FROM family_achievement_user_notifications faun
    USING cleared
    WHERE faun.family_achievement_progress_id = cleared.id;
  END IF;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

-- ============================================================
-- 2. New trigger: invalidate hidden unlocks when a character is
--    created or deleted (character membership change)
-- ============================================================

-- A character INSERT or DELETE changes which users have characters in the
-- family, which affects all-mode character-based hidden achievements.
-- We look up the character owner's family via user_profiles and run the
-- same invalidation + notification purge as the roster-change trigger.

CREATE OR REPLACE FUNCTION invalidate_hidden_achievement_unlocks_on_character_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_family_id UUID;
BEGIN
  -- Determine the owner's family.
  IF TG_OP = 'DELETE' THEN
    SELECT family_id INTO v_family_id
    FROM   user_profiles
    WHERE  id = OLD.user_id;
  ELSE
    SELECT family_id INTO v_family_id
    FROM   user_profiles
    WHERE  id = NEW.user_id;
  END IF;

  IF v_family_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Clear unlocked_at on all hidden achievements for this family and
  -- simultaneously purge the corresponding per-user notification rows.
  WITH cleared AS (
    UPDATE family_achievement_progress fap
    SET    unlocked_at = NULL
    FROM   family_achievements fa
    WHERE  fap.family_achievement_id = fa.id
      AND  fa.is_hidden              = TRUE
      AND  fap.family_id             = v_family_id
      AND  fap.unlocked_at IS NOT NULL
    RETURNING fap.id
  )
  DELETE FROM family_achievement_user_notifications faun
  USING cleared
  WHERE faun.family_achievement_progress_id = cleared.id;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

CREATE TRIGGER trg_invalidate_hidden_unlocks_on_character_change
  AFTER INSERT OR DELETE
  ON characters
  FOR EACH ROW EXECUTE FUNCTION invalidate_hidden_achievement_unlocks_on_character_change();
