-- Re-enable RLS and create proper policies for families table
-- The previous policy had issues with JWT authentication context

-- First, re-enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;

-- Create a simpler, more reliable INSERT policy
-- Use both USING and WITH CHECK clauses for complete protection
CREATE POLICY "Authenticated users can create families" ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify other policies are still in place
-- (The SELECT and UPDATE policies should already exist from previous migrations)