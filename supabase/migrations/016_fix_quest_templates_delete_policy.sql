-- Ensure Guild Masters can delete quest templates
-- The ALL policy should cover this, but let's be explicit
DROP POLICY IF EXISTS "Guild Masters can delete quest templates" ON quest_templates;

CREATE POLICY "Guild Masters can delete quest templates"
  ON quest_templates
  FOR DELETE
  TO authenticated
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('GUILD_MASTER', 'HERO')
    )
  );
