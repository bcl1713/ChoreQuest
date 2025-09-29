-- Fix Hero Reward Display Issue: Allow Guild Masters to update family member characters
-- Problem: Current RLS policy only allows users to update their own character,
-- but when GM approves a Hero's quest, the GM needs to update the Hero's character stats.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own character" ON characters;

-- Create new policies that allow both self-management AND Guild Master management
CREATE POLICY "Users can manage their own character" ON characters
  FOR ALL USING (user_id = auth.uid());

-- NEW POLICY: Guild Masters can update character stats for family members
-- This enables quest reward distribution when GMs approve Hero quests
CREATE POLICY "Guild Masters can update family member characters" ON characters
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = (
        SELECT family_id FROM user_profiles
        WHERE id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

-- Add index for performance on the family character update pattern
CREATE INDEX IF NOT EXISTS idx_characters_family_lookup ON characters(user_id);

-- Test the new policies work correctly:
-- 1. Regular users can still update their own character (unchanged)
-- 2. Guild Masters can now update ANY character in their family (new capability)
-- 3. Guild Masters cannot update characters outside their family (security maintained)
-- 4. Non-Guild Masters cannot update other people's characters (security maintained)

-- Example: When GM (user_id: gm-123) approves Hero's quest (user_id: hero-456):
-- Previous behavior: UPDATE characters SET xp=newXP WHERE user_id='hero-456' → BLOCKED by RLS
-- New behavior: UPDATE characters SET xp=newXP WHERE user_id='hero-456' → ALLOWED if GM is in same family

-- This resolves the core issue where Heroes weren't receiving XP/gold rewards
-- because the character update was silently failing due to RLS policy restrictions.