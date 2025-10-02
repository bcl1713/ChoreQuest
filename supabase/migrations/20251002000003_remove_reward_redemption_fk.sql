-- Remove foreign key constraint from reward_redemptions.reward_id
-- This makes rewards blueprints (like quest templates) - redemptions become independent records
-- Preserves transaction history even if reward is deleted

ALTER TABLE reward_redemptions
DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;

-- Add comment explaining the architecture
COMMENT ON COLUMN reward_redemptions.reward_id IS 'Blueprint reference only (not a foreign key). Redemptions are independent records that preserve history.';
