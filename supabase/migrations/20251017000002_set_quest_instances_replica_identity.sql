-- Set REPLICA IDENTITY FULL for quest_instances table
-- This enables real-time DELETE events to include the full old row data
-- Required for client-side filtering in real-time subscriptions

-- When REPLICA IDENTITY is set to FULL, PostgreSQL includes the entire
-- old row in the replication stream when a row is deleted or updated.
-- This is necessary for Supabase Realtime to:
-- 1. Evaluate Row Level Security (RLS) policies on DELETE events
-- 2. Check subscription filters (e.g., family_id=eq.xyz)
-- 3. Broadcast the DELETE event to subscribed clients with full old_record data

-- Without REPLICA IDENTITY FULL, only the primary key is included in DELETE events,
-- which prevents Supabase from evaluating RLS policies that depend on other columns
-- (like family_id), causing DELETE events to be silently dropped.

ALTER TABLE quest_instances REPLICA IDENTITY FULL;

-- Verify the change
-- Expected result: relreplident = 'f' (FULL)
-- Query to check: SELECT relreplident FROM pg_class WHERE relname = 'quest_instances';
