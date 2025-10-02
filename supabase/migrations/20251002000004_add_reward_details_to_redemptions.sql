-- Add reward details to redemptions for independent transaction history
-- Denormalizes reward data so redemptions preserve reward info even if reward is deleted
-- Follows same pattern as quest instances copying from quest templates

ALTER TABLE reward_redemptions
ADD COLUMN IF NOT EXISTS reward_name TEXT,
ADD COLUMN IF NOT EXISTS reward_description TEXT,
ADD COLUMN IF NOT EXISTS reward_type TEXT;

-- Add comments
COMMENT ON COLUMN reward_redemptions.reward_name IS 'Snapshot of reward name at time of redemption';
COMMENT ON COLUMN reward_redemptions.reward_description IS 'Snapshot of reward description at time of redemption';
COMMENT ON COLUMN reward_redemptions.reward_type IS 'Snapshot of reward type at time of redemption';

-- Backfill existing redemptions with reward data from rewards table
UPDATE reward_redemptions rr
SET
  reward_name = r.name,
  reward_description = r.description,
  reward_type = r.type
FROM rewards r
WHERE rr.reward_id = r.id
  AND rr.reward_name IS NULL;
