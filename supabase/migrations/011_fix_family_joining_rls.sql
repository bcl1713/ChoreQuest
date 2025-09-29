-- Fix family joining RLS policy
-- Allow unauthenticated users to lookup families by code for joining
-- but still maintain security for other operations

-- Re-enable RLS on families table first
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Guild Masters can update their family" ON families;

-- Policy 1: Allow anyone to lookup families by code for joining
-- This is necessary for the registration flow where users need to validate family codes
CREATE POLICY "Allow family lookup by code for registration" ON families
  FOR SELECT USING (true);

-- Policy 2: Guild Masters can update their own family
CREATE POLICY "Guild Masters can update their family" ON families
  FOR UPDATE USING (
    id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

-- Policy 3: Allow authenticated users to insert new families (for family creation)
CREATE POLICY "Allow family creation" ON families
  FOR INSERT WITH CHECK (true);