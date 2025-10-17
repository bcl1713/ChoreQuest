-- Add timezone column to families table
-- This allows families to set their local timezone for quest recurrence alignment

ALTER TABLE families
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';

-- Add index for performance when querying families by timezone
CREATE INDEX idx_families_timezone ON families(timezone);

-- Set all existing families to UTC to maintain current behavior
-- (Already done via DEFAULT, but explicit for clarity)
UPDATE families SET timezone = 'UTC' WHERE timezone IS NULL;

COMMENT ON COLUMN families.timezone IS 'IANA timezone string (e.g., America/Chicago) for quest recurrence alignment';
