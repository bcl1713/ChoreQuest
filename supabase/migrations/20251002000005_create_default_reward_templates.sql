-- Migration: Create Default Reward Templates and Auto-Copy Trigger
-- Part of Template Rewards System (PRD: 0006-prd-template-rewards.md)
-- Creates 15 default reward templates and trigger to copy them to new families
--
-- DEFAULT REWARD TEMPLATES (15 total)
-- =====================================
--
-- SCREEN_TIME (4 rewards):
--   01. 30 Minutes Extra Screen Time - 50g
--   02. 1 Hour Gaming Session - 100g
--   03. Movie Night Pick - 75g
--   04. Weekend Gaming Marathon - 300g
--
-- PRIVILEGE (4 rewards):
--   05. Skip One Chore - 100g
--   06. Stay Up 30 Minutes Late - 75g
--   07. Choose Family Dinner - 125g
--   08. Friend Sleepover - 250g
--
-- PURCHASE (4 rewards):
--   09. Small Treat - 25g
--   10. Book or Magazine - 150g
--   11. Toy or Game ($15 value) - 200g
--   12. Big Purchase ($30 value) - 400g
--
-- EXPERIENCE (3 rewards):
--   13. Ice Cream Outing - 125g
--   14. Trip to the Park - 100g
--   15. Special One-on-One Time - 350g
--
-- Cost Distribution:
--   Small (25-75g): 4 rewards
--   Medium (100-200g): 7 rewards
--   Large (250-400g): 4 rewards
--
-- All rewards are:
--   - Family-friendly and age-appropriate (5-15+ years)
--   - Non-gender-specific and culturally neutral
--   - Fully editable by Guild Masters after copying
--   - Marked with family_id = NULL (global templates)
--   - Using predictable UUIDs (00000000-0000-0000-0000-0000000000XX)

-- ======================================================================
-- REWARD TEMPLATE INSERTS
-- ======================================================================

-- SCREEN_TIME REWARDS (4)

-- 1. 30 Minutes Extra Screen Time - 50g (SMALL)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '30 Minutes Extra Screen Time',
  'Earn 30 additional minutes of screen time for games, videos, or apps of your choice.',
  'SCREEN_TIME',
  50,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. 1 Hour Gaming Session - 100g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '1 Hour Gaming Session',
  'Enjoy a full hour of uninterrupted gaming time on your favorite device or console.',
  'SCREEN_TIME',
  100,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Movie Night Pick - 75g (SMALL)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Movie Night Pick',
  'Choose the movie for family movie night and control the remote!',
  'SCREEN_TIME',
  75,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 4. Weekend Gaming Marathon - 300g (LARGE)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Weekend Gaming Marathon',
  'Earn 3 hours of gaming time on a weekend day of your choice.',
  'SCREEN_TIME',
  300,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- PRIVILEGE REWARDS (4)

-- 5. Skip One Chore - 100g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'Skip One Chore',
  'Skip your least favorite chore for the day - no questions asked!',
  'PRIVILEGE',
  100,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 6. Stay Up 30 Minutes Late - 75g (SMALL)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'Stay Up 30 Minutes Late',
  'Extend your bedtime by 30 minutes on a school night.',
  'PRIVILEGE',
  75,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 7. Choose Family Dinner - 125g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  'Choose Family Dinner',
  'Pick what the family eats for dinner - pizza, tacos, or your favorite meal!',
  'PRIVILEGE',
  125,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 8. Friend Sleepover - 250g (LARGE)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  'Friend Sleepover',
  'Invite a friend over for a sleepover with snacks and fun activities.',
  'PRIVILEGE',
  250,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- PURCHASE REWARDS (4)

-- 9. Small Treat - 25g (SMALL)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  'Small Treat',
  'Choose a special snack, candy, or drink from the store.',
  'PURCHASE',
  25,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 10. Book or Magazine - 150g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Book or Magazine',
  'Pick out a new book, graphic novel, or magazine of your choice.',
  'PURCHASE',
  150,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 11. Toy or Game ($15 value) - 200g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Toy or Game ($15 value)',
  'Choose a toy, trading cards, or small game from the store (up to $15).',
  'PURCHASE',
  200,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 12. Big Purchase ($30 value) - 400g (LARGE)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  'Big Purchase ($30 value)',
  'Save up for a larger purchase like a video game, LEGO set, or special item (up to $30).',
  'PURCHASE',
  400,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- EXPERIENCE REWARDS (3)

-- 13. Ice Cream Outing - 125g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000013',
  'Ice Cream Outing',
  'Enjoy a trip to your favorite ice cream shop and pick any flavor or treat!',
  'EXPERIENCE',
  125,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 14. Trip to the Park - 100g (MEDIUM)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000014',
  'Trip to the Park',
  'Spend an afternoon at the park or playground with a parent.',
  'EXPERIENCE',
  100,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- 15. Special One-on-One Time - 350g (LARGE)
INSERT INTO rewards (id, name, description, type, cost, family_id, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000015',
  'Special One-on-One Time',
  'Plan a special activity with a parent - mini golf, bowling, arcade, or your choice!',
  'EXPERIENCE',
  350,
  NULL,
  true
) ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- TRIGGER FUNCTION AND TRIGGER
-- ======================================================================

-- Create function to copy default reward templates to new families
-- SECURITY DEFINER allows the function to bypass RLS and access global templates
CREATE OR REPLACE FUNCTION copy_default_reward_templates_to_new_family()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  -- Copy all default reward templates (where family_id IS NULL) to the new family
  INSERT INTO rewards (
    name,
    description,
    type,
    cost,
    family_id,
    is_active
  )
  SELECT
    name,
    description,
    type,
    cost,
    NEW.id, -- Assign to the new family
    is_active
  FROM rewards
  WHERE family_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically copy templates when a new family is created
CREATE TRIGGER trigger_copy_reward_templates_on_family_insert
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_reward_templates_to_new_family();

-- Add comment explaining the system
COMMENT ON FUNCTION copy_default_reward_templates_to_new_family() IS
  'Automatically copies default reward templates (family_id IS NULL) to newly created families. Uses SECURITY DEFINER to bypass RLS policies and access global templates.';
