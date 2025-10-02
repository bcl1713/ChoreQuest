-- Create demo family data for Supabase
-- This script creates "The Smith Family" with demo users for E2E testing

-- Insert demo family
INSERT INTO families (id, name, code, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'The Smith Family',
  'DEMO123',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Get the family ID for later use
DO $$
DECLARE
    demo_family_id UUID;
BEGIN
    SELECT id INTO demo_family_id FROM families WHERE code = 'DEMO123';

    -- Create quest templates for demo family
    INSERT INTO quest_templates (
      title, description, xp_reward, gold_reward, difficulty, category, family_id, class_bonuses, created_at, updated_at
    ) VALUES (
      'Make Your Bed',
      'Tidy up your room by making your bed neatly',
      25,
      5,
      'EASY',
      'DAILY',
      demo_family_id,
      '{"KNIGHT": 5, "MAGE": 0, "RANGER": 0, "ROGUE": 2, "HEALER": 0}',
      NOW(),
      NOW()
    ), (
      'Homework Quest',
      'Complete your daily homework assignments',
      50,
      10,
      'MEDIUM',
      'DAILY',
      demo_family_id,
      '{"KNIGHT": 0, "MAGE": 15, "RANGER": 0, "ROGUE": 0, "HEALER": 5}',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;

    -- Create reward store items for demo family
    INSERT INTO rewards (
      name, description, type, cost, family_id, created_at, updated_at
    ) VALUES (
      'Extra Screen Time',
      '30 minutes of additional device/TV time',
      'SCREEN_TIME',
      50,
      demo_family_id,
      NOW(),
      NOW()
    ), (
      'Stay Up 30 Minutes Later',
      'Extend bedtime by 30 minutes on weekend',
      'PRIVILEGE',
      75,
      demo_family_id,
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
END $$;

-- Display completion message
SELECT 'Demo family data created successfully!' as message;