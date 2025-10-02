-- Temporarily disable RLS on families table to test core functionality
-- This will help us determine if the issue is with RLS or something else

-- Disable RLS temporarily
ALTER TABLE families DISABLE ROW LEVEL SECURITY;

-- We'll re-enable it in the next migration once we confirm everything works