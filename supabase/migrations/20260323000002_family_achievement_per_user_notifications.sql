-- Per-user family achievement notification tracking
-- Replaces reliance on the shared `notified` flag on family_achievement_progress
-- with a per-user record so every family member receives their own notification.

-- ============================================================
-- 1. Create table
-- ============================================================

CREATE TABLE family_achievement_user_notifications (
  id                              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_achievement_progress_id  UUID        NOT NULL REFERENCES family_achievement_progress(id) ON DELETE CASCADE,
  created_at                      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, family_achievement_progress_id)
);

-- ============================================================
-- 2. Indexes
-- ============================================================

CREATE INDEX idx_faun_user_id     ON family_achievement_user_notifications(user_id);
CREATE INDEX idx_faun_progress_id ON family_achievement_user_notifications(family_achievement_progress_id);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

ALTER TABLE family_achievement_user_notifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own notification records (needed by the
-- catch-up query in useAchievementNotifications.helpers.ts).
CREATE POLICY "Users can view their own notifications"
  ON family_achievement_user_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- All writes go through the service role (bypasses RLS), consistent with the
-- pattern used for family_achievement_progress.
CREATE POLICY "Service role manages user notifications"
  ON family_achievement_user_notifications
  FOR ALL
  USING (false);
