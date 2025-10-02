-- Fix quest pickup functionality by allowing users to assign unassigned quests to themselves
-- This updates the RLS policy to allow quest pickup

-- Drop the existing UPDATE policy
DROP POLICY "Quest creators and assigned users can update quests" ON quest_instances;

-- Create new UPDATE policy that allows quest pickup
CREATE POLICY "Quest creators, assigned users, and quest pickup can update quests" ON quest_instances
  FOR UPDATE USING (
    family_id = get_user_family_id()
    AND (
      -- Original conditions: quest creators and Guild Masters
      created_by_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
      )
      -- Current assigned user can update
      OR assigned_to_id = auth.uid()
      -- Allow pickup: any family member can assign unassigned quests to themselves
      OR (assigned_to_id IS NULL AND auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE family_id = get_user_family_id()
      ))
    )
  );