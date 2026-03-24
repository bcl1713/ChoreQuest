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

-- The existing "Guild Masters can manage family achievements" FOR ALL policy
-- covers SELECT and has no is_hidden / unlocked_at guard, so Guild Masters
-- could still read locked hidden achievements directly.  Replace it with
-- write-only policies; the family-member SELECT policy above (which does have
-- the hidden filter) now handles SELECT for GMs as well.
DROP POLICY IF EXISTS "Guild Masters can manage family achievements" ON family_achievements;

CREATE POLICY "Guild Masters can insert family achievements"
  ON family_achievements
  FOR INSERT
  WITH CHECK (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );

CREATE POLICY "Guild Masters can update family achievements"
  ON family_achievements
  FOR UPDATE
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  )
  WITH CHECK (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );

CREATE POLICY "Guild Masters can delete family achievements"
  ON family_achievements
  FOR DELETE
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );
