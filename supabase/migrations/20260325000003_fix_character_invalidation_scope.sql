-- Fix P1: invalidate_hidden_achievement_unlocks_on_character_change was clearing
-- unlocked_at for ALL hidden family achievements in the family, including those
-- whose criteria do not depend on character roster membership (e.g. gold_spent,
-- reward_redeemed, sum-mode quest/boss achievements).  Those achievements were
-- being spuriously re-locked until the next recompute, and the corresponding
-- per-user notification rows were deleted — causing duplicate toasts on re-unlock.
--
-- Fix: restrict the invalidation to hidden achievements whose criteria_type is in
-- the character-based set (quest_volunteer, xp_earned, level_reached,
-- streak_reached, class_change, honor_earned).  These are the only types whose
-- evaluators use per-character data; a member gaining their first or losing their
-- last character materially changes their contribution to such achievements.

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

  -- Clear unlocked_at only for hidden achievements whose criteria type depends on
  -- character roster membership.  User-based criteria (gold_spent, reward_redeemed,
  -- quest_complete, boss_defeated, boss_participated, gold_earned, quest_difficulty)
  -- are unaffected by whether a member has a character and must not be invalidated.
  WITH cleared AS (
    UPDATE family_achievement_progress fap
    SET    unlocked_at = NULL
    FROM   family_achievements fa
    WHERE  fap.family_achievement_id = fa.id
      AND  fa.is_hidden              = TRUE
      AND  fa.criteria_type          IN (
             'quest_volunteer', 'xp_earned', 'level_reached',
             'streak_reached',  'class_change', 'honor_earned'
           )
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
