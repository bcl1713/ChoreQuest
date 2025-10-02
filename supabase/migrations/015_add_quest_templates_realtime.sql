-- Add quest_templates table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE quest_templates;

-- Grant select permissions to authenticated users for realtime
GRANT SELECT ON quest_templates TO authenticated;
