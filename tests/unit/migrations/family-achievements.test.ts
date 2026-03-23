/**
 * Unit tests for the family achievements schema migration.
 * Validates that the SQL file contains required DDL, constraints,
 * policies, indexes, and seed data. Structural tests only — actual
 * SQL correctness is validated by `supabase db reset`.
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Family Achievements Schema Migration (20260323000001)", () => {
  const migrationPath = path.join(
    __dirname,
    "../../../supabase/migrations/20260323000001_family_achievements.sql",
  );
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(migrationPath, "utf-8");
  });

  describe("Table Creation", () => {
    it("should create family_achievements table", () => {
      expect(sql).toMatch(/CREATE TABLE family_achievements/i);
    });

    it("should include all required columns in family_achievements", () => {
      const tableBlock = sql.match(
        /CREATE TABLE family_achievements\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const block = tableBlock![0];
      expect(block).toMatch(/\bid\b/i);
      expect(block).toMatch(/\bname\b/i);
      expect(block).toMatch(/\bdescription\b/i);
      expect(block).toMatch(/category_id/i);
      expect(block).toMatch(/\bicon\b/i);
      expect(block).toMatch(/xp_reward/i);
      expect(block).toMatch(/gold_reward/i);
      expect(block).toMatch(/is_hidden/i);
      expect(block).toMatch(/criteria_type/i);
      expect(block).toMatch(/criteria_config/i);
      expect(block).toMatch(/family_id/i);
      expect(block).toMatch(/created_at/i);
      expect(block).toMatch(/updated_at/i);
    });

    it("should have NOT NULL on family_id in family_achievements", () => {
      const tableBlock = sql.match(
        /CREATE TABLE family_achievements\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      expect(tableBlock![0]).toMatch(/family_id\s+UUID\s+NOT NULL/i);
    });

    it("should create family_achievement_progress table", () => {
      expect(sql).toMatch(/CREATE TABLE family_achievement_progress/i);
    });

    it("should include all required columns in family_achievement_progress", () => {
      const tableBlock = sql.match(
        /CREATE TABLE family_achievement_progress\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const block = tableBlock![0];
      expect(block).toMatch(/\bid\b/i);
      expect(block).toMatch(/family_id/i);
      expect(block).toMatch(/family_achievement_id/i);
      expect(block).toMatch(/unlocked_at/i);
      expect(block).toMatch(/\bprogress\b/i);
      expect(block).toMatch(/notified/i);
      expect(block).toMatch(/created_at/i);
      expect(block).toMatch(/updated_at/i);
    });

    it("should have UNIQUE constraint on (family_id, family_achievement_id)", () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*family_id\s*,\s*family_achievement_id\s*\)/i,
      );
    });

    it("should have ON DELETE CASCADE on family_achievement_progress FKs", () => {
      const tableBlock = sql.match(
        /CREATE TABLE family_achievement_progress\s*\([\s\S]*?\);/i,
      );
      expect(tableBlock).toBeTruthy();
      const cascadeMatches = tableBlock![0].match(/ON DELETE CASCADE/gi);
      expect(cascadeMatches).toBeTruthy();
      expect(cascadeMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Triggers", () => {
    it("should create updated_at trigger on family_achievements", () => {
      expect(sql).toMatch(/CREATE TRIGGER[\s\S]*?ON family_achievements/i);
      expect(sql).toMatch(/trigger_set_timestamp/i);
    });

    it("should create updated_at trigger on family_achievement_progress", () => {
      expect(sql).toMatch(
        /CREATE TRIGGER[\s\S]*?ON family_achievement_progress/i,
      );
    });
  });

  describe("Index Creation", () => {
    it("should index family_achievements.family_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON family_achievements\s*\(\s*family_id\s*\)/i,
      );
    });

    it("should index family_achievements.category_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON family_achievements\s*\(\s*category_id\s*\)/i,
      );
    });

    it("should index family_achievements.criteria_type", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON family_achievements\s*\(\s*criteria_type\s*\)/i,
      );
    });

    it("should index family_achievement_progress.family_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON family_achievement_progress\s*\(\s*family_id\s*\)/i,
      );
    });

    it("should index family_achievement_progress.family_achievement_id", () => {
      expect(sql).toMatch(
        /CREATE INDEX.*ON family_achievement_progress\s*\(\s*family_achievement_id\s*\)/i,
      );
    });
  });

  describe("Row Level Security", () => {
    it("should enable RLS on family_achievements", () => {
      expect(sql).toMatch(
        /ALTER TABLE family_achievements\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it("should enable RLS on family_achievement_progress", () => {
      expect(sql).toMatch(
        /ALTER TABLE family_achievement_progress\s+ENABLE ROW LEVEL SECURITY/i,
      );
    });

    it("should create SELECT policy on family_achievements using get_user_family_id()", () => {
      expect(sql).toMatch(/ON family_achievements[\s\S]*?FOR SELECT/i);
      expect(sql).toMatch(/get_user_family_id\(\)/i);
    });

    it("should create Guild Master management policy on family_achievements", () => {
      expect(sql).toMatch(/GUILD_MASTER/i);
      expect(sql).toMatch(/ON family_achievements/i);
    });

    it("should create SELECT policy on family_achievement_progress", () => {
      expect(sql).toMatch(/ON family_achievement_progress[\s\S]*?FOR SELECT/i);
    });

    it("should create service-role-only write policy on family_achievement_progress", () => {
      expect(sql).toMatch(
        /ON family_achievement_progress[\s\S]*?USING \(false\)/i,
      );
    });
  });

  describe("Replica Identity", () => {
    it("should set REPLICA IDENTITY FULL on family_achievement_progress", () => {
      expect(sql).toMatch(
        /ALTER TABLE family_achievement_progress REPLICA IDENTITY FULL/i,
      );
    });
  });

  describe("Seed Data", () => {
    it("should insert family achievements", () => {
      expect(sql).toMatch(/INSERT INTO family_achievements/i);
    });

    it("should seed sum-mode achievements with quest_complete", () => {
      expect(sql).toMatch(/family_evaluation_mode.*sum/i);
      expect(sql).toMatch(/quest_complete/i);
    });

    it("should seed sum-mode achievements with gold_earned", () => {
      expect(sql).toMatch(/gold_earned/i);
    });

    it("should seed all-mode achievements with level_reached", () => {
      expect(sql).toMatch(/family_evaluation_mode.*all/i);
      expect(sql).toMatch(/level_reached/i);
    });

    it("should seed achievements for all existing families using CROSS JOIN", () => {
      expect(sql).toMatch(/FROM families/i);
      expect(sql).toMatch(/CROSS JOIN/i);
    });
  });
});
