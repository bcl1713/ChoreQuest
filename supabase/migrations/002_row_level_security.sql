-- Row Level Security Policies for ChoreQuest
-- Ensures family data isolation and proper access control

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's family_id
CREATE OR REPLACE FUNCTION auth.user_family_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT family_id
    FROM user_profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Families policies
CREATE POLICY "Users can view their own family" ON families
  FOR SELECT USING (id = auth.user_family_id());

CREATE POLICY "Guild Masters can update their family" ON families
  FOR UPDATE USING (
    id = auth.user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

-- User profiles policies
CREATE POLICY "Users can view family members" ON user_profiles
  FOR SELECT USING (family_id = auth.user_family_id());

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Guild Masters can update family member roles" ON user_profiles
  FOR UPDATE USING (
    family_id = auth.user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

CREATE POLICY "New users can insert their profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Characters policies
CREATE POLICY "Users can view family member characters" ON characters
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Users can manage their own character" ON characters
  FOR ALL USING (user_id = auth.uid());

-- Quest templates policies
CREATE POLICY "Family members can view quest templates" ON quest_templates
  FOR SELECT USING (family_id = auth.user_family_id());

CREATE POLICY "Guild Masters and Heroes can manage quest templates" ON quest_templates
  FOR ALL USING (
    family_id = auth.user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('GUILD_MASTER', 'HERO')
    )
  );

-- Quest instances policies
CREATE POLICY "Family members can view family quests" ON quest_instances
  FOR SELECT USING (family_id = auth.user_family_id());

CREATE POLICY "Guild Masters and Heroes can create quests" ON quest_instances
  FOR INSERT WITH CHECK (
    family_id = auth.user_family_id()
    AND created_by_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('GUILD_MASTER', 'HERO')
    )
  );

CREATE POLICY "Quest creators and assigned users can update quests" ON quest_instances
  FOR UPDATE USING (
    family_id = auth.user_family_id()
    AND (
      created_by_id = auth.uid()
      OR assigned_to_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
      )
    )
  );

CREATE POLICY "Quest creators can delete quests" ON quest_instances
  FOR DELETE USING (
    family_id = auth.user_family_id()
    AND (
      created_by_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
      )
    )
  );

-- Boss battles policies
CREATE POLICY "Family members can view family boss battles" ON boss_battles
  FOR SELECT USING (family_id = auth.user_family_id());

CREATE POLICY "Guild Masters can manage boss battles" ON boss_battles
  FOR ALL USING (
    family_id = auth.user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

-- Boss battle participants policies
CREATE POLICY "Family members can view boss battle participants" ON boss_battle_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boss_battles bb
      WHERE bb.id = boss_battle_id
      AND bb.family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Users can join boss battles" ON boss_battle_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM boss_battles bb
      WHERE bb.id = boss_battle_id
      AND bb.family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Users can update their participation" ON boss_battle_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Family members can view family transactions" ON transactions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

CREATE POLICY "System can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

-- Rewards policies
CREATE POLICY "Family members can view family rewards" ON rewards
  FOR SELECT USING (family_id = auth.user_family_id());

CREATE POLICY "Guild Masters can manage rewards" ON rewards
  FOR ALL USING (
    family_id = auth.user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'GUILD_MASTER'
    )
  );

-- Reward redemptions policies
CREATE POLICY "Family members can view family redemptions" ON reward_redemptions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Users can create their own redemptions" ON reward_redemptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rewards r
      WHERE r.id = reward_id
      AND r.family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Users can update their own redemptions" ON reward_redemptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Guild Masters can approve redemptions" ON reward_redemptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN rewards r ON r.family_id = up.family_id
      WHERE up.id = auth.uid()
      AND up.role = 'GUILD_MASTER'
      AND r.id = reward_id
    )
  );

-- Achievements policies (global read, no family restriction for base achievements)
CREATE POLICY "Everyone can view achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON achievements
  FOR ALL USING (false); -- Only via service role

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Family members can view family achievements" ON user_achievements
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

CREATE POLICY "System can award achievements" ON user_achievements
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

-- SOS requests policies
CREATE POLICY "Family members can view family SOS requests" ON sos_requests
  FOR SELECT USING (
    requester_id IN (
      SELECT id FROM user_profiles
      WHERE family_id = auth.user_family_id()
    )
  );

CREATE POLICY "Family members can create SOS requests" ON sos_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
  );

CREATE POLICY "Requesters and helpers can update SOS requests" ON sos_requests
  FOR UPDATE USING (
    requester_id = auth.uid()
    OR helper_id = auth.uid()
  );

-- Create indexes for better performance with RLS
CREATE INDEX idx_user_profiles_family_id ON user_profiles(family_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_quest_templates_family_id ON quest_templates(family_id);
CREATE INDEX idx_quest_instances_family_id ON quest_instances(family_id);
CREATE INDEX idx_quest_instances_assigned_to_id ON quest_instances(assigned_to_id);
CREATE INDEX idx_quest_instances_created_by_id ON quest_instances(created_by_id);
CREATE INDEX idx_boss_battles_family_id ON boss_battles(family_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_sos_requests_requester_id ON sos_requests(requester_id);