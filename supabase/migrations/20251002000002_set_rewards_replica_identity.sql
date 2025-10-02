-- Set REPLICA IDENTITY FULL for rewards table
-- This ensures DELETE events include the full row data in old_record,
-- allowing clients to identify which reward was deleted in realtime subscriptions

ALTER TABLE rewards REPLICA IDENTITY FULL;

-- Verify replica identity is set
-- To check if this worked, you can query:
-- SELECT relname, relreplident FROM pg_class WHERE relname = 'rewards';
-- relreplident should be 'f' (FULL)
