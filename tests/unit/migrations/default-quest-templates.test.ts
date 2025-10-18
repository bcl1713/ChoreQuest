/**
 * Unit tests for default quest template migration diversity.
 * These tests verify that the migration SQL file includes
 * a variety of quest types (individual/family) and recurrence
 * patterns (daily/weekly) as specified in issue #45.
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Default Quest Templates Migration (013)", () => {
  const migrationPath = path.join(
    __dirname,
    "../../../supabase/migrations/013_create_default_quest_templates.sql"
  );
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  it("should have the migration file", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  describe("Quest Type Diversity", () => {
    it("should include INDIVIDUAL quest types", () => {
      const individualCount = (
        migrationContent.match(/'INDIVIDUAL'/g) || []
      ).length;
      expect(individualCount).toBeGreaterThan(0);
    });

    it("should include FAMILY quest types", () => {
      const familyCount = (migrationContent.match(/'FAMILY'/g) || []).length;
      expect(familyCount).toBeGreaterThan(0);
    });

    it("should have at least 2 FAMILY quest templates", () => {
      // Count INSERT statements with quest_type = 'FAMILY'
      const familyInserts = migrationContent.match(
        /INSERT INTO quest_templates.*?VALUES.*?'FAMILY'\s*\)/gs
      );
      expect(familyInserts).toBeTruthy();
      expect(familyInserts!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Recurrence Pattern Diversity (category)", () => {
    it("should include both DAILY and WEEKLY categories", () => {
      expect(migrationContent).toContain("'DAILY'");
      expect(migrationContent).toContain("'WEEKLY'");
    });

    it("should have at least 5 WEEKLY quests for better diversity", () => {
      // Count how many times category = 'WEEKLY' appears in INSERT statements
      const weeklyMatches = migrationContent.match(/'WEEKLY'/g);
      expect(weeklyMatches).toBeTruthy();
      // We should have at least 5 WEEKLY quests
      expect(weeklyMatches!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Realistic Quest Frequencies", () => {
    it("Mow the Lawn should be WEEKLY not DAILY (issue #45)", () => {
      const mowLawnSection = migrationContent.match(
        /--\s*\d+\.\s*Mow the Lawn\s*-\s*\w+,\s*(\w+)/i
      );
      expect(mowLawnSection).toBeTruthy();
      expect(mowLawnSection![1]).toBe("WEEKLY");
    });

    it("Vacuum the House should be WEEKLY not DAILY", () => {
      const vacuumSection = migrationContent.match(
        /--\s*\d+\.\s*Vacuum the House\s*-\s*\w+,\s*(\w+)/i
      );
      expect(vacuumSection).toBeTruthy();
      expect(vacuumSection![1]).toBe("WEEKLY");
    });
  });

  describe("Family Quest Examples", () => {
    it("should include Family Grocery Shopping as a FAMILY quest", () => {
      expect(migrationContent).toContain("Family Grocery Shopping");
      // Find the INSERT statement containing Family Grocery Shopping
      const groceryInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Family Grocery Shopping'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(groceryInsert).toBeTruthy();
    });

    it("should include Family Garage Organization as a FAMILY quest", () => {
      expect(migrationContent).toContain("Family Garage Organization");
      // Find the INSERT statement containing Family Garage Organization
      const garageInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Family Garage Organization'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(garageInsert).toBeTruthy();
    });
  });

  describe("Trigger Function", () => {
    it("should include quest_type in the copy function", () => {
      const copyFunctionMatch = migrationContent.match(
        /CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family\(\)[\s\S]*?END;/i
      );
      expect(copyFunctionMatch).toBeTruthy();

      const functionBody = copyFunctionMatch![0];
      expect(functionBody).toContain("quest_type");
    });

    it("should select quest_type in the INSERT SELECT statement", () => {
      const insertSelectMatch = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?SELECT[\s\S]*?FROM quest_templates[\s\S]*?WHERE family_id IS NULL/i
      );
      expect(insertSelectMatch).toBeTruthy();

      const insertSelect = insertSelectMatch![0];
      // Check that quest_type appears in both the column list and SELECT list
      const columnList = insertSelect.match(/INSERT INTO quest_templates\s*\(([\s\S]*?)\)/i);
      const selectList = insertSelect.match(/SELECT([\s\S]*?)FROM/i);

      expect(columnList![1]).toContain("quest_type");
      expect(selectList![1]).toContain("quest_type");
    });
  });

  describe("Template Count", () => {
    it("should have 10 default quest template INSERT statements", () => {
      const insertStatements = migrationContent.match(
        /INSERT INTO quest_templates.*?VALUES.*?\);/gs
      );
      expect(insertStatements).toBeTruthy();
      expect(insertStatements!.length).toBe(10);
    });
  });
});
