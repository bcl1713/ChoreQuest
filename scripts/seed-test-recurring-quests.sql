-- Seed script for testing recurring quest generation with RECURRING_TEST_INTERVAL_MINUTES
-- This creates a minimal test setup with a family, user, character, and quest templates

-- Create a test user in auth.users first (required for user_profiles foreign key)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change_token_current,
  email_change_token_new
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'gm@test.local',
  crypt('test-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{}',
  false,
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create a test family (with unique code to avoid conflicts)
INSERT INTO families (id, name, code, timezone, week_start_day, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Family',
  'TEST' || floor(random() * 10000)::text,
  'America/New_York',
  0, -- Sunday
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a test user profile (Guild Master)
INSERT INTO user_profiles (id, email, name, role, family_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'gm@test.local',
  'Test GM',
  'GUILD_MASTER',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a test character for the GM (no family_id column in characters table)
INSERT INTO characters (id, name, user_id, level, xp, gold, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Hero',
  '00000000-0000-0000-0000-000000000001',
  1,
  0,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create INDIVIDUAL quest templates assigned to the character (no created_by_id column)
INSERT INTO quest_templates (
  id, title, description, category, difficulty, xp_reward, gold_reward,
  quest_type, recurrence_pattern, is_active, is_paused,
  family_id, assigned_character_ids,
  created_at, updated_at
) VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'Test Individual Quest 1',
  'A test individual quest that should recur every 5 minutes',
  'DAILY',
  'EASY',
  10,
  5,
  'INDIVIDUAL',
  'DAILY',
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['00000000-0000-0000-0000-000000000001']::uuid[],
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000012',
  'Test Individual Quest 2',
  'Another test individual quest',
  'DAILY',
  'MEDIUM',
  20,
  10,
  'INDIVIDUAL',
  'DAILY',
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['00000000-0000-0000-0000-000000000001']::uuid[],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create FAMILY quest templates (no assignment needed, no created_by_id column)
INSERT INTO quest_templates (
  id, title, description, category, difficulty, xp_reward, gold_reward,
  quest_type, recurrence_pattern, is_active, is_paused,
  family_id, assigned_character_ids,
  created_at, updated_at
) VALUES
(
  '00000000-0000-0000-0000-000000000021',
  'Test Family Quest 1',
  'A test family quest that anyone can claim',
  'WEEKLY',
  'EASY',
  15,
  8,
  'FAMILY',
  'DAILY',
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  ARRAY[]::uuid[],
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000022',
  'Test Family Quest 2',
  'Another test family quest',
  'BOSS_BATTLE',
  'MEDIUM',
  25,
  15,
  'FAMILY',
  'DAILY',
  true,
  false,
  '00000000-0000-0000-0000-000000000001',
  ARRAY[]::uuid[],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 'Families created:' as info, COUNT(*) as count FROM families;
SELECT 'Users created:' as info, COUNT(*) as count FROM user_profiles;
SELECT 'Characters created:' as info, COUNT(*) as count FROM characters;
SELECT 'Quest templates created:' as info, COUNT(*) as count FROM quest_templates WHERE is_active = true AND is_paused = false;
SELECT 'Individual templates:' as info, COUNT(*) as count FROM quest_templates WHERE quest_type = 'INDIVIDUAL' AND is_active = true;
SELECT 'Family templates:' as info, COUNT(*) as count FROM quest_templates WHERE quest_type = 'FAMILY' AND is_active = true;
