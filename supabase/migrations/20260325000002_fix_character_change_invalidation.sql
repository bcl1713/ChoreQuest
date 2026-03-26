-- Fix P2: invalidate_hidden_achievement_unlocks_on_character_change fired on
-- every character INSERT or DELETE, even when the affected user already had
-- (or still has) other characters.  For families with multi-character users,
-- adding an extra character or removing a non-last character is irrelevant
-- to all-mode character-based achievements — the user's membership status
-- hasn't changed.  The unnecessary invalidations re-locked hidden
-- achievements, purged notification rows, then re-unlocked them on the next
-- recompute, producing duplicate toasts and incorrect transient state.
--
-- Fix: only invalidate when the insert is the user's first character (0 → 1)
-- or when the delete is the user's last character (1 → 0).
-- Since the trigger fires AFTER, the row is already present on INSERT and
-- already gone on DELETE, so the membership transition is detectable by a
-- simple COUNT.

CREATE OR REPLACE FUNCTION invalidate_hidden_achievement_unlocks_on_character_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_family_id UUID;
  v_char_count BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Row already exists; count = 1 means this is the user's first character.
    SELECT COUNT(*) INTO v_char_count FROM characters WHERE user_id = NEW.user_id;
    IF v_char_count <> 1 THEN
      RETURN NULL;  -- User already had characters; no membership change.
    END IF;
    SELECT family_id INTO v_family_id FROM user_profiles WHERE id = NEW.user_id;
  ELSE -- DELETE
    -- Row already gone; count = 0 means this was the user's last character.
    SELECT COUNT(*) INTO v_char_count FROM characters WHERE user_id = OLD.user_id;
    IF v_char_count <> 0 THEN
      RETURN NULL;  -- User still has other characters; no membership change.
    END IF;
    SELECT family_id INTO v_family_id FROM user_profiles WHERE id = OLD.user_id;
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
