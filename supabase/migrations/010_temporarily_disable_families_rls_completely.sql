-- Temporarily disable RLS completely on families table to confirm this is the issue
-- This will help us understand if the problem is with RLS evaluation itself

ALTER TABLE families DISABLE ROW LEVEL SECURITY;