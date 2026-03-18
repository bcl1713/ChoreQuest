/**
 * Unit tests for the achievement system schema migration.
 * Validates that the SQL file contains required DDL, constraints,
 * policies, indexes, and seed data. Structural tests only — actual
 * SQL correctness is validated by `supabase db reset`.
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Achievement System Schema Migration (20260318000001)", () => {
  const migrationPath = path.join(
    __dirname,
    "../../../supabase/migrations/20260318000001_achievement_system_schema.sql",
  );
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(migrationPath, "utf-8");
  });

  // 7.2 DROP TABLE for legacy tables
  describe("Legacy Table Drops", () => {
    it("should drop user_achievements before achievements (FK order)", () => {
      expect(sql).toMatch(/DROP TABLE IF EXISTS user_achievements/i);
      expect(sql).toMatch(/DROP TABLE IF EXISTS achievements/i);
      const userAchPos = sql.search(/DROP TABLE IF EXISTS user_achievements/i);
      const achPos = sql.search(/DROP TABLE IF EXISTS achievements/i);
      expect(userAchPos).toBeLessThan(achPos);
    });
  });

  // 7.3 CREATE TABLE for all three new tables with required columns
  describe("Table Creation", () => {
    it("should create achievement_categories table", () => {
      expect(sql).toMatch(/CREATE TABLE achievement_categories/i);
    });

    it("should include all required columns in achievement_categories", () => {
      const tableBlock = sql.match(
        /CREATE TABLE achievement_categories\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const block = tableBlock![0];
      expect(block).toMatch(/\bid\b/i);
      expect(block).toMatch(/\bname\b/i);
      expect(block).toMatch(/\bdescription\b/i);
      expect(block).toMatch(/display_order/i);
      expect(block).toMatch(/\bicon\b/i);
      expect(block).toMatch(/created_at/i);
      expect(block).toMatch(/updated_at/i);
    });

    it("should create achievements table", () => {
      expect(sql).toMatch(/CREATE TABLE achievements/i);
    });

    it("should include all required columns in achievements", () => {
      const tableBlock = sql.match(
        /CREATE TABLE achievements\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const block = tableBlock![0];
      expect(block).toMatch(/\bid\b/i);
      expect(block).toMatch(/\bname\b/i);
      expect(block).toMatch(/\bdescription\b/i);
      expect(block).toMatch(/category_id/i);
      expect(block).toMatch(/xp_reward/i);
      expect(block).toMatch(/gold_reward/i);
      expect(block).toMatch(/is_hidden/i);
      expect(block).toMatch(/criteria_type/i);
      expect(block).toMatch(/criteria_config/i);
      expect(block).toMatch(/family_id/i);
      expect(block).toMatch(/created_at/i);
      expect(block).toMatch(/updated_at/i);
    });

    it("should create character_achievements table", () => {
      expect(sql).toMatch(/CREATE TABLE character_achievements/i);
    });

    it("should include all required columns in character_achievements", () => {
      const tableBlock = sql.match(
        /CREATE TABLE character_achievements\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const block = tableBlock![0];
      expect(block).toMatch(/\bid\b/i);
      expect(block).toMatch(/character_id/i);
      expect(block).toMatch(/achievement_id/i);
      expect(block).toMatch(/unlocked_at/i);
      expect(block).toMatch(/\bprogress\b/i);
      expect(block).toMatch(/notified/i);
      expect(block).toMatch(/created_at/i);
      expect(block).toMatch(/updated_at/i);
    });

    it("should have UNIQUE constraint on (character_id, achievement_id)", () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*character_id\s*,\s*achievement_id\s*\)/i,
      );
    });

    it("should have ON DELETE CASCADE on character_achievements FKs", () => {
      const tableBlock = sql.match(
        /CREATE TABLE character_achievements\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const cascadeMatches = tableBlock![0].match(/ON DELETE CASCADE/gi);
      expect(cascadeMatches).toBeTruthy();
      expect(cascadeMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // 7.4 ENABLE ROW LEVEL SECURITY for all three tables
  describe("Row Level Security Enablement", () => {
    it("should enable RLS on achievement_categories", () => {
      expect(sql).toMatch(
        /ALTER TABLE achievement_categories\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it("should enable RLS on achievements", () => {
      expect(sql).toMatch(
        /ALTER TABLE achievements\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it("should enable RLS on character_achievements", () => {
      expect(sql).toMatch(
        /ALTER TABLE character_achievements\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });
  });

  // 7.5 CREATE INDEX for all required indexes
  describe("Index Creation", () => {
    it("should index character_achievements.character_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON character_achievements\s*\(\s*character_id\s*\)/i,
      );
    });

    it("should index character_achievements.achievement_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON character_achievements\s*\(\s*achievement_id\s*\)/i,
      );
    });

    it("should index achievements.category_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON achievements\s*\(\s*category_id\s*\)/i,
      );
    });

    it("should index achievements.family_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON achievements\s*\(\s*family_id\s*\)/i,
      );
    });

    it("should index achievements.criteria_type", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON achievements\s*\(\s*criteria_type\s*\)/i,
      );
    });
  });

  // 7.6 CREATE POLICY statements for achievement RLS
  describe("RLS Policies", () => {
    it("should create SELECT policy on achievement_categories", () => {
      expect(sql).toMatch(/ON achievement_categories/i);
      expect(sql).toMatch(/FOR SELECT/i);
    });

    it("should create SELECT policy on achievements", () => {
      expect(sql).toMatch(/ON achievements/i);
      expect(sql).toMatch(/FOR SELECT/i);
    });

    it("achievements SELECT policy should allow global (NULL) and family rows", () => {
      expect(sql).toMatch(/family_id IS NULL/i);
      expect(sql).toMatch(/get_user_family_id\(\)/i);
    });

    it("should create Guild Master management policy on achievements", () => {
      expect(sql).toMatch(/GUILD_MASTER/i);
      expect(sql).toMatch(/ON achievements/i);
    });

    it("should create SELECT policy on character_achievements", () => {
      expect(sql).toMatch(/ON character_achievements/i);
      expect(sql).toMatch(/FOR SELECT/i);
    });

    it("character_achievements SELECT policy should use family join", () => {
      expect(sql).toMatch(/FROM characters/i);
      expect(sql).toMatch(/user_profiles/i);
    });
  });

  // 7.7 INSERT statements for seed categories and achievements
  describe("Seed Data", () => {
    it("should insert into achievement_categories", () => {
      expect(sql).toMatch(/INSERT INTO achievement_categories/i);
    });

    it("should seed all 6 required categories", () => {
      expect(sql).toMatch(/'Adventurer'/i);
      expect(sql).toMatch(/'Warrior'/i);
      expect(sql).toMatch(/'Wealth'/i);
      expect(sql).toMatch(/'Growth'/i);
      expect(sql).toMatch(/'Dedication'/i);
      expect(sql).toMatch(/'Secret'/i);
    });

    it("should seed quest_complete achievements", () => {
      expect(sql).toMatch(/'quest_complete'/i);
    });

    it("should seed quest_complete at multiple thresholds (1, 10, 50, 100)", () => {
      const thresholds = sql.match(/"threshold":\s*1\b/g) || [];
      // At least threshold 1 appears
      expect(thresholds.length).toBeGreaterThan(0);
      expect(sql).toMatch(/"threshold":\s*10\b/);
      expect(sql).toMatch(/"threshold":\s*50\b/);
      expect(sql).toMatch(/"threshold":\s*100\b/);
    });

    it("should seed level_reached achievements", () => {
      expect(sql).toMatch(/'level_reached'/i);
    });

    it("should seed at least one hidden achievement (is_hidden = TRUE)", () => {
      // Verify the Secret seed block explicitly passes TRUE as the is_hidden column value.
      // The Secret INSERT selects TRUE as a literal in the SELECT list (not in VALUES),
      // so we look for the pattern within the Secret category's INSERT block.
      const secretInsertBlock = sql.match(
        /-- 6\.7 Secret achievements[\s\S]*?(?=--|$)/i,
      );
      expect(secretInsertBlock).toBeTruthy();
      expect(secretInsertBlock![0]).toMatch(/\bTRUE\b/i);
    });

    it("should seed achievements across all 6 categories", () => {
      const insertCount = (sql.match(/INSERT INTO achievements/gi) || [])
        .length;
      expect(insertCount).toBeGreaterThanOrEqual(6);
    });
  });

  // 7.8 REPLICA IDENTITY FULL for character_achievements
  describe("Replica Identity", () => {
    it("should set REPLICA IDENTITY FULL on character_achievements", () => {
      expect(sql).toMatch(
        /ALTER TABLE character_achievements REPLICA IDENTITY FULL/i,
      );
    });
  });
});
