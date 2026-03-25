-- Fix cross-policy recursion in family_achievement_progress SELECT policy.
--
-- The previous policy (20260324000002) checked whether a progress row's parent
-- achievement was hidden via a subquery against family_achievements:
--
--   NOT EXISTS (
--     SELECT 1 FROM family_achievements fa
--     WHERE fa.id = ... AND fa.is_hidden = TRUE
--   )
--
-- Because the family_achievements SELECT policy (20260324000001) is itself
-- applied to that subquery, hidden locked achievements are invisible in the
-- subquery result.  NOT EXISTS therefore returns TRUE for every hidden locked
-- achievement, which re-exposes the progress row — the exact leak the policy
-- was trying to close.
--
-- Fix: introduce a SECURITY DEFINER helper that reads is_hidden from
-- family_achievements bypassing RLS, then rewrite the progress policy to use
-- it.  The helper is intentionally minimal and returns NULL-safe FALSE when the
-- achievement doesn't exist, so the policy stays fail-closed.

CREATE OR REPLACE FUNCTION is_family_achievement_hidden(p_achievement_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_hidden FROM family_achievements WHERE id = p_achievement_id),
    false
  );
$$;

DROP POLICY IF EXISTS "Family members can view family achievement progress" ON family_achievement_progress;

CREATE POLICY "Family members can view family achievement progress"
  ON family_achievement_progress
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
    AND (
      NOT is_family_achievement_hidden(family_achievement_progress.family_achievement_id)
      OR unlocked_at IS NOT NULL
    )
  );
