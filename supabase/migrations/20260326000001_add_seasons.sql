-- Seasons foundation for achievement reset baselines.
-- Related: issue #152 (season-as-baseline infrastructure)

-- ============================================================
-- 1. Seasons table and family active-season pointer
-- ============================================================

CREATE TABLE IF NOT EXISTS seasons (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id   UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  theme       TEXT,
  description TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ,
  is_active   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seasons_date_order CHECK (ends_at IS NULL OR ends_at > starts_at)
);

ALTER TABLE families
ADD COLUMN IF NOT EXISTS active_season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;

CREATE TRIGGER set_timestamp_seasons
  BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_seasons_family_id ON seasons(family_id);
CREATE INDEX IF NOT EXISTS idx_seasons_family_active ON seasons(family_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_seasons_starts_at ON seasons(starts_at);

-- Enforce at most one active season per family.
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_one_active_per_family
ON seasons(family_id)
WHERE is_active = true;

COMMENT ON TABLE seasons IS 'Family-scoped themed seasons. The active season start timestamp is used as the achievement baseline.';
COMMENT ON COLUMN families.active_season_id IS 'Current season whose starts_at timestamp bounds achievement evaluation.';

-- ============================================================
-- 2. Season-scoped achievement progress
-- ============================================================

ALTER TABLE character_achievements
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;

ALTER TABLE family_achievement_progress
ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE CASCADE;

ALTER TABLE character_achievements
DROP CONSTRAINT IF EXISTS character_achievements_character_id_achievement_id_key;

ALTER TABLE family_achievement_progress
DROP CONSTRAINT IF EXISTS family_achievement_progress_family_id_family_achievement_id_key;

-- New season-scoped uniqueness for season-aware writes. NULLS NOT DISTINCT
-- keeps current legacy NULL-season upserts conflict-safe until evaluator cutoff
-- work starts writing non-null active-season IDs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_character_achievements_character_achievement_season
ON character_achievements(character_id, achievement_id, season_id) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_family_achievement_progress_family_achievement_season
ON family_achievement_progress(family_id, family_achievement_id, season_id) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS idx_character_achievements_season_id ON character_achievements(season_id);
CREATE INDEX IF NOT EXISTS idx_family_achievement_progress_season_id ON family_achievement_progress(season_id);

COMMENT ON COLUMN character_achievements.season_id IS 'Season scope for achievement progress. NULL preserves legacy pre-season progress rows.';
COMMENT ON COLUMN family_achievement_progress.season_id IS 'Season scope for family achievement progress. NULL preserves legacy pre-season progress rows.';

-- ============================================================
-- 3. Row Level Security
-- ============================================================

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view seasons"
  ON seasons
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND family_id = get_user_family_id()
  );

CREATE POLICY "Guild Masters can manage seasons"
  ON seasons
  FOR ALL
  USING (
    family_id = get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'GUILD_MASTER'
    )
  );
