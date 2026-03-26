/**
 * Unit tests for the character-change invalidation migration fix.
 * Validates that the SQL function guards against non-first/non-last
 * character transitions before running the invalidation.
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Character-change invalidation fix (20260325000002)", () => {
  const migrationPath = path.join(
    __dirname,
    "../../../supabase/migrations/20260325000002_fix_character_change_invalidation.sql",
  );
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(migrationPath, "utf-8");
  });

  it("replaces the character-change invalidation function", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION invalidate_hidden_achievement_unlocks_on_character_change/i,
    );
  });

  it("checks character count before invalidating on INSERT", () => {
    expect(sql).toMatch(/TG_OP = 'INSERT'/);
    // On INSERT: count = 1 means first character; skip if count <> 1
    expect(sql).toMatch(/v_char_count\s*<>\s*1/);
  });

  it("checks character count before invalidating on DELETE", () => {
    expect(sql).toMatch(/TG_OP = 'INSERT'/); // handles both branches
    // On DELETE: count = 0 means last character; skip if count <> 0
    expect(sql).toMatch(/v_char_count\s*<>\s*0/);
  });

  it("counts characters for the correct user on INSERT", () => {
    expect(sql).toMatch(
      /SELECT COUNT\(\*\).*FROM characters WHERE user_id = NEW\.user_id/s,
    );
  });

  it("counts characters for the correct user on DELETE", () => {
    expect(sql).toMatch(
      /SELECT COUNT\(\*\).*FROM characters WHERE user_id = OLD\.user_id/s,
    );
  });

  it("looks up family_id from user_profiles", () => {
    expect(sql).toMatch(
      /SELECT family_id INTO v_family_id FROM user_profiles WHERE id/i,
    );
  });

  it("clears unlocked_at on hidden achievements and purges notification rows", () => {
    expect(sql).toMatch(/unlocked_at\s*=\s*NULL/i);
    expect(sql).toMatch(/DELETE FROM family_achievement_user_notifications/i);
  });

  it("guards against null family_id", () => {
    expect(sql).toMatch(/v_family_id IS NULL/);
  });
});
