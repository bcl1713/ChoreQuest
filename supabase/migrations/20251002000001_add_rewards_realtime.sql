-- Add rewards table to realtime publication
-- This enables live updates for reward changes (create, update, delete)

-- Add rewards to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;

-- Verify publication configuration
-- To check if this worked, you can query:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
