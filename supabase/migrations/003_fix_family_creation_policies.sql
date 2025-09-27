-- Fix Family Creation RLS Policies
-- Addresses missing INSERT policies that prevent family creation

-- Add INSERT policy for families table
-- Allow any authenticated user to create a family
CREATE POLICY "Authenticated users can create families" ON families
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- The existing user profile INSERT policy is sufficient:
-- "New users can insert their profile" FOR INSERT WITH CHECK (id = auth.uid())
--
-- No changes needed to user_profiles policies