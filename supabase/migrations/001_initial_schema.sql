-- ChoreQuest Initial Schema Migration for Supabase
-- Converted from Prisma schema with Supabase Auth integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('GUILD_MASTER', 'HERO', 'YOUNG_HERO');
CREATE TYPE character_class AS ENUM ('KNIGHT', 'MAGE', 'RANGER', 'ROGUE', 'HEALER');
CREATE TYPE quest_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE quest_category AS ENUM ('DAILY', 'WEEKLY', 'BOSS_BATTLE');
CREATE TYPE quest_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'EXPIRED');
CREATE TYPE boss_battle_status AS ENUM ('ACTIVE', 'DEFEATED', 'EXPIRED');
CREATE TYPE transaction_type AS ENUM ('QUEST_REWARD', 'BOSS_VICTORY', 'STORE_PURCHASE', 'REWARD_REFUND', 'BONUS_AWARD', 'SOS_HELP');
CREATE TYPE reward_type AS ENUM ('SCREEN_TIME', 'PRIVILEGE', 'PURCHASE', 'EXPERIENCE');

-- Core Tables

-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'YOUNG_HERO',
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class character_class DEFAULT 'KNIGHT',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  honor_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest Templates
CREATE TABLE quest_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  difficulty quest_difficulty NOT NULL,
  category quest_category NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  class_bonuses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest Instances
CREATE TABLE quest_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  difficulty quest_difficulty NOT NULL,
  category quest_category NOT NULL,
  status quest_status DEFAULT 'PENDING',
  assigned_to_id UUID REFERENCES user_profiles(id),
  created_by_id UUID REFERENCES user_profiles(id) NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES quest_templates(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boss Battles
CREATE TABLE boss_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  total_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  status boss_battle_status DEFAULT 'ACTIVE',
  gem_reward INTEGER DEFAULT 50,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boss Battle Participants
CREATE TABLE boss_battle_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boss_battle_id UUID REFERENCES boss_battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  damage_dealt INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(boss_battle_id, user_id)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  xp_change INTEGER DEFAULT 0,
  gold_change INTEGER DEFAULT 0,
  gems_change INTEGER DEFAULT 0,
  honor_change INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type reward_type NOT NULL,
  cost INTEGER NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES user_profiles(id),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  condition JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  gold_reward INTEGER DEFAULT 0,
  gem_reward INTEGER DEFAULT 0,
  badge_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- SOS Requests
CREATE TABLE sos_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  honor_reward INTEGER DEFAULT 5,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated At Triggers
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables with updated_at columns
CREATE TRIGGER set_timestamp_families BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_characters BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_quest_templates BEFORE UPDATE ON quest_templates FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_quest_instances BEFORE UPDATE ON quest_instances FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_boss_battles BEFORE UPDATE ON boss_battles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_boss_battle_participants BEFORE UPDATE ON boss_battle_participants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rewards BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_achievements BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_sos_requests BEFORE UPDATE ON sos_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();