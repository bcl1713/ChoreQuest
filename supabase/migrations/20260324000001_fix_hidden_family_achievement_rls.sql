-- Replace the permissive family_achievements SELECT policy so that hidden
-- locked achievements cannot be read directly via the public Supabase client.
-- Hidden achievements are only visible once they have been unlocked (i.e., a
-- progress row exists with a non-NULL unlocked_at).  This mirrors the
-- redaction logic applied in /api/family-achievements and closes the path
-- where a client could bypass that API layer with a direct table query.

DROP POLICY IF EXISTS "Family members can view family achievements" ON family_achievements;

CREATE POLICY "Family members can view family achievements"
  ON family_achievements
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
    AND (
      NOT is_hidden
      OR EXISTS (
        SELECT 1 FROM family_achievement_progress fap
        WHERE fap.family_achievement_id = family_achievements.id
          AND fap.family_id             = family_achievements.family_id
          AND fap.unlocked_at IS NOT NULL
      )
    )
  );
