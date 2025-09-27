-- Fix Circular RLS Dependency Issue
-- The current SELECT policy for user_profiles creates a circular dependency
-- because get_user_family_id() needs to SELECT from user_profiles to work

-- Add a direct policy that allows users to view their own profile
-- This breaks the circular dependency and allows get_user_family_id() to work
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- The existing policy "Users can view family members" will continue to work
-- for viewing other family members, but now users can always see their own profile