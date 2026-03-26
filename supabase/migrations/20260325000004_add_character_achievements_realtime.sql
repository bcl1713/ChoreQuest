-- Add character_achievements to realtime publication
-- Enables real-time toast notifications when character achievements unlock
-- Related: issue #140 (Family Achievements - Real-time Notifications)

-- character_achievements was created with REPLICA IDENTITY FULL in migration 20260318000001,
-- but was never added to the supabase_realtime publication. This caused character achievement
-- unlock events to not be delivered in real-time to clients, requiring manual page refresh.

ALTER PUBLICATION supabase_realtime ADD TABLE character_achievements;
