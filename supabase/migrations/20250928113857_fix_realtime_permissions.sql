-- Enable realtime for all tables that need real-time updates

-- Grant the necessary permissions for realtime to work
-- The realtime system needs to be able to read from tables to broadcast changes

-- Enable realtime on specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE quest_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_redemptions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE families;

-- Grant select permissions to authenticated users for realtime
-- These are needed for realtime to function properly
GRANT SELECT ON quest_instances TO authenticated;
GRANT SELECT ON characters TO authenticated;
GRANT SELECT ON reward_redemptions TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON families TO authenticated;

-- Ensure anon role has basic select permissions for realtime
GRANT SELECT ON quest_instances TO anon;
GRANT SELECT ON characters TO anon;
GRANT SELECT ON reward_redemptions TO anon;
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON families TO anon;