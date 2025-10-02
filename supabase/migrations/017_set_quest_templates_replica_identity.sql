-- Migration 017: Set REPLICA IDENTITY FULL for quest_templates
-- This enables Supabase Realtime to send complete old_record data on DELETE events
-- Required for DELETE event handlers to properly remove items from UI

-- Set replica identity to FULL so that DELETE events include all column values in old_record
ALTER TABLE quest_templates REPLICA IDENTITY FULL;

-- Verify the change
-- Expected result: replica_identity = 'f' (FULL)
-- SELECT relreplident FROM pg_class WHERE relname = 'quest_templates';
