-- Fix the families INSERT policy to use public role like the working user_profiles policy
-- The issue was using 'authenticated' role instead of 'public'

-- Drop the current failing policy
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;

-- Create new policy with 'public' role like the working user_profiles policies
CREATE POLICY "Authenticated users can create families" ON families
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);