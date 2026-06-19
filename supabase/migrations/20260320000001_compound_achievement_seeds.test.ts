/**
 * Unit tests for the compound achievement seed migration.
 * Validates the SQL file contains the required compound achievement
 * seed data with correct structure. Actual SQL correctness is validated
 * by `supabase db reset`.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Compound Achievement Seeds Migration (20260320000001)", () => {
  const migrationPath = path.join(
    __dirname,
    "20260320000001_compound_achievement_seeds.sql",
  );
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(migrationPath, "utf-8");
  });

  it("10.5 migration file exists and is readable", () => {
    expect(sql).toBeTruthy();
    expect(sql.length).toBeGreaterThan(0);
  });

  // 10.2 AND compound achievement
  it("10.2 seeds at least one AND compound achievement", () => {
    // criteria_type value 'compound' appears in the INSERT
    expect(sql).toMatch(/'compound'/i);
    expect(sql).toMatch(/"operator"\s*:\s*"AND"/i);
  });

  it("10.2 AND compound achievement has multiple sub-conditions", () => {
    expect(sql).toMatch(/"conditions"/i);
    // At least two criteria_type entries within conditions
    const conditionsMatches = sql.match(/"criteria_type"/g);
    expect(conditionsMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("10.2 AND compound achievement references quest_complete and level_reached", () => {
    expect(sql).toMatch(/"criteria_type"\s*:\s*"quest_complete"/i);
    expect(sql).toMatch(/"criteria_type"\s*:\s*"level_reached"/i);
  });

  // 10.3 OR compound achievement
  it("10.3 seeds at least one OR compound achievement", () => {
    expect(sql).toMatch(/"operator"\s*:\s*"OR"/i);
  });

  it("10.3 OR compound achievement references boss_defeated or gold_earned", () => {
    const hasBossDefeated = /"criteria_type"\s*:\s*"boss_defeated"/i.test(sql);
    const hasGoldEarned = /"criteria_type"\s*:\s*"gold_earned"/i.test(sql);
    expect(hasBossDefeated || hasGoldEarned).toBe(true);
  });

  // 10.4 Compound achievements have non-zero rewards
  it("10.4 compound achievements have non-zero xp_reward values", () => {
    // Verify xp_reward values in the INSERT statements are > 0
    // Extract xp_reward lines around the compound inserts
    const xpMatches = sql.match(/\d+,\s*\n\s*'compound'/g);
    expect(xpMatches).toBeTruthy();
    xpMatches!.forEach((match) => {
      const num = parseInt(match, 10);
      expect(num).toBeGreaterThan(0);
    });
  });

  it("10.4 evaluation_strategy is set to compound in criteria_config", () => {
    expect(sql).toMatch(/"evaluation_strategy"\s*:\s*"compound"/i);
    // Should appear twice (once per achievement)
    const matches = sql.match(/"evaluation_strategy"\s*:\s*"compound"/gi);
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("10.5 compound achievements are cast to jsonb", () => {
    // The criteria_config should be cast with ::jsonb
    const jsonbMatches = sql.match(/::jsonb/g);
    expect(jsonbMatches).toBeTruthy();
    expect(jsonbMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
