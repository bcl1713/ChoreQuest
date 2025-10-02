-- Re-enable RLS on families table with proper public access for family code validation
-- This allows anonymous users to lookup families by code during registration
-- while maintaining security for other operations

-- Enable RLS on families table
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow family lookup by code for registration" ON families;
DROP POLICY IF EXISTS "Guild Masters can update their family" ON families;
DROP POLICY IF EXISTS "Allow family creation" ON families;

-- Policy 1: Allow anyone (including anonymous users) to SELECT from families table
-- This is safe because families table only contains non-sensitive data (name, code)
CREATE POLICY "Allow public family lookup" ON families
  FOR SELECT USING (true);

-- Policy 2: Allow authenticated users to insert new families (for family creation)
CREATE POLICY "Allow family creation" ON families
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Guild Masters can update their own family
CREATE POLICY "Guild Masters can update their family" ON families
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND family_id = families.id
      AND role = 'GUILD_MASTER'
    )
  );

-- Add a comment explaining the security model
COMMENT ON TABLE families IS 'RLS enabled with public SELECT access for family code validation during registration. Family data is non-sensitive (name, code only).';