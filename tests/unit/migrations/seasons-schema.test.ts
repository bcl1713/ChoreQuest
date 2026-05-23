import * as fs from "fs";
import * as path from "path";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260326000001_add_seasons.sql",
);

const sql = () => fs.readFileSync(migrationPath, "utf8");

describe("seasons schema migration", () => {
  it("creates seasons and connects families to an active season", () => {
    const migration = sql();

    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS seasons/i);
    expect(migration).toMatch(/family_id\s+UUID\s+NOT NULL REFERENCES families\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/starts_at\s+TIMESTAMPTZ NOT NULL/i);
    expect(migration).toMatch(/CONSTRAINT seasons_date_order CHECK \(ends_at IS NULL OR ends_at > starts_at\)/i);
    expect(migration).toMatch(/ALTER TABLE families\s+ADD COLUMN IF NOT EXISTS active_season_id UUID REFERENCES seasons\(id\) ON DELETE SET NULL/i);
  });

  it("enforces one active season per family", () => {
    expect(sql()).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_one_active_per_family\s+ON seasons\(family_id\)\s+WHERE is_active = true/i,
    );
  });

  it("adds nullable season scope to achievement progress with legacy null uniqueness", () => {
    const migration = sql();

    expect(migration).toMatch(/ALTER TABLE character_achievements\s+ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/ALTER TABLE family_achievement_progress\s+ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/DROP CONSTRAINT IF EXISTS character_achievements_character_id_achievement_id_key/i);
    expect(migration).toMatch(/DROP CONSTRAINT IF EXISTS family_achievement_progress_family_id_family_achievement_id_key/i);
    expect(migration).toMatch(/idx_character_achievements_character_achievement_season[\s\S]*NULLS NOT DISTINCT/i);
    expect(migration).toMatch(/idx_family_achievement_progress_family_achievement_season[\s\S]*NULLS NOT DISTINCT/i);
  });
});
