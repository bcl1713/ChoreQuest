-- Replace the permissive family_achievement_progress SELECT policy so that
-- progress rows for locked hidden achievements cannot be read directly via the
-- public Supabase client or realtime subscriptions.
--
-- A progress row is visible only when the corresponding achievement is either:
--   (a) not hidden, or
--   (b) hidden but already unlocked (unlocked_at IS NOT NULL on this row).
--
-- This mirrors the guard applied to family_achievements in migration
-- 20260324000001 and closes the remaining path where a client could bypass
-- /api/family-achievements and inspect current/threshold for achievements that
-- should still be secret.

DROP POLICY IF EXISTS "Family members can view family achievement progress" ON family_achievement_progress;

CREATE POLICY "Family members can view family achievement progress"
  ON family_achievement_progress
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
    AND (
      NOT EXISTS (
        SELECT 1 FROM family_achievements fa
        WHERE fa.id        = family_achievement_progress.family_achievement_id
          AND fa.is_hidden = TRUE
      )
      OR unlocked_at IS NOT NULL
    )
  );
