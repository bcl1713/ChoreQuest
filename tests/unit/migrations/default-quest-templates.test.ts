/**
 * Unit tests for default quest template migration diversity.
 * These tests verify that the migration SQL file includes
 * a variety of quest types (individual/family) and recurrence
 * patterns (daily/weekly) as specified in issue #45.
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Default Quest Templates Migration (20251019000002)", () => {
  const migrationPath = path.join(
    __dirname,
    "../../../supabase/migrations/20251019000002_diversify_default_quest_templates.sql"
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

    it("should have at least 6 FAMILY quest templates to showcase the feature", () => {
      // Count INSERT statements with quest_type = 'FAMILY'
      const familyInserts = migrationContent.match(
        /INSERT INTO quest_templates.*?VALUES.*?'FAMILY'\s*\)/gs
      );
      expect(familyInserts).toBeTruthy();
      expect(familyInserts!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Recurrence Pattern Diversity (category)", () => {
    it("should include both DAILY and WEEKLY categories", () => {
      expect(migrationContent).toContain("'DAILY'");
      expect(migrationContent).toContain("'WEEKLY'");
    });

    it("should have more WEEKLY quests than DAILY for realistic household chores", () => {
      const dailyMatches = migrationContent.match(/'DAILY'/g);
      const weeklyMatches = migrationContent.match(/'WEEKLY'/g);
      expect(weeklyMatches).toBeTruthy();
      expect(dailyMatches).toBeTruthy();
      expect(weeklyMatches!.length).toBeGreaterThan(dailyMatches!.length);
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

    it("Laundry Duty should be WEEKLY not DAILY", () => {
      const laundrySection = migrationContent.match(
        /--\s*\d+\.\s*Laundry Duty\s*-\s*\w+,\s*(\w+)/i
      );
      expect(laundrySection).toBeTruthy();
      expect(laundrySection![1]).toBe("WEEKLY");
    });

    it("Clean Your Room should be WEEKLY not DAILY", () => {
      const cleanRoomSection = migrationContent.match(
        /--\s*\d+\.\s*Clean Your Room\s*-\s*\w+,\s*(\w+)/i
      );
      expect(cleanRoomSection).toBeTruthy();
      expect(cleanRoomSection![1]).toBe("WEEKLY");
    });
  });

  describe("Family vs Individual Quest Logic", () => {
    it("Clean Your Room should be INDIVIDUAL (everyone does their own)", () => {
      expect(migrationContent).toContain("Clean Your Room");
      const cleanRoomInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Clean Your Room'[\s\S]*?'INDIVIDUAL'[\s\S]*?\);/i
      );
      expect(cleanRoomInsert).toBeTruthy();
    });

    it("Unload the Dishwasher should be FAMILY (someone does it)", () => {
      expect(migrationContent).toContain("Unload the Dishwasher");
      const dishwasherInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Unload the Dishwasher'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(dishwasherInsert).toBeTruthy();
    });

    it("Take Out the Trash should be FAMILY (someone does it)", () => {
      expect(migrationContent).toContain("Take Out the Trash");
      const trashInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Take Out the Trash'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(trashInsert).toBeTruthy();
    });

    it("Vacuum the House should be FAMILY (someone does it)", () => {
      expect(migrationContent).toContain("Vacuum the House");
      const vacuumInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Vacuum the House'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(vacuumInsert).toBeTruthy();
    });

    it("Mow the Lawn should be FAMILY (someone does it)", () => {
      expect(migrationContent).toContain("Mow the Lawn");
      const mowInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Mow the Lawn'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(mowInsert).toBeTruthy();
    });

    it("Clean the Bathroom should be FAMILY (someone does it)", () => {
      expect(migrationContent).toContain("Clean the Bathroom");
      const bathroomInsert = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?'Clean the Bathroom'[\s\S]*?'FAMILY'[\s\S]*?\);/i
      );
      expect(bathroomInsert).toBeTruthy();
    });
  });

  describe("Daily Kitchen Cleanup Quests", () => {
    it("should include Unload the Dishwasher as a DAILY quest", () => {
      expect(migrationContent).toContain("Unload the Dishwasher");
      const dishwasherMatch = migrationContent.match(
        /--\s*\d+\.\s*Unload the Dishwasher\s*-\s*\w+,\s*(\w+)/i
      );
      expect(dishwasherMatch![1]).toBe("DAILY");
    });

    it("should include Clear & Load Dishwasher After Dinner as a DAILY quest", () => {
      expect(migrationContent).toContain("Clear & Load Dishwasher After Dinner");
      const loadDishwasherMatch = migrationContent.match(
        /--\s*\d+\.\s*Clear & Load Dishwasher After Dinner\s*-\s*\w+,\s*(\w+)/i
      );
      expect(loadDishwasherMatch![1]).toBe("DAILY");
    });

    it("should include Wipe Counters & Sweep Floor as a DAILY quest", () => {
      expect(migrationContent).toContain("Wipe Counters & Sweep Floor");
      const cleanKitchenMatch = migrationContent.match(
        /--\s*\d+\.\s*Wipe Counters & Sweep Floor\s*-\s*\w+,\s*(\w+)/i
      );
      expect(cleanKitchenMatch![1]).toBe("DAILY");
    });
  });

  describe("Default Templates Should Be Active But Paused", () => {
    it("all default templates should have is_active = true", () => {
      // Count INSERT statements with is_active set to true
      const activeMatches = migrationContent.match(/NULL,\s*true,\s*true,/g);
      expect(activeMatches).toBeTruthy();
      expect(activeMatches!.length).toBe(10); // All 10 templates should be active
    });

    it("all default templates should have is_paused = true", () => {
      // Verify templates start paused so users can review before activation
      const insertPattern = /INSERT INTO quest_templates.*?VALUES.*?\);/gs;
      const inserts = migrationContent.match(insertPattern);
      expect(inserts).toBeTruthy();
      expect(inserts!.length).toBe(10);

      // Each insert should have is_paused in the column list
      inserts!.forEach(insert => {
        expect(insert).toContain('is_paused');
        // Check that the VALUES section has true for is_paused (appears after is_active)
        expect(insert).toMatch(/NULL,\s*true,\s*true,/);
      });
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

    it("should include is_paused in the copy function", () => {
      const copyFunctionMatch = migrationContent.match(
        /CREATE OR REPLACE FUNCTION copy_default_quest_templates_to_new_family\(\)[\s\S]*?END;/i
      );
      expect(copyFunctionMatch).toBeTruthy();

      const functionBody = copyFunctionMatch![0];
      expect(functionBody).toContain("is_paused");
    });

    it("should select quest_type and is_paused in the INSERT SELECT statement", () => {
      const insertSelectMatch = migrationContent.match(
        /INSERT INTO quest_templates[\s\S]*?SELECT[\s\S]*?FROM quest_templates[\s\S]*?WHERE family_id IS NULL/i
      );
      expect(insertSelectMatch).toBeTruthy();

      const insertSelect = insertSelectMatch![0];
      // Check that quest_type and is_paused appear in both the column list and SELECT list
      const columnList = insertSelect.match(/INSERT INTO quest_templates\s*\(([\s\S]*?)\)/i);
      const selectList = insertSelect.match(/SELECT([\s\S]*?)FROM/i);

      expect(columnList![1]).toContain("quest_type");
      expect(selectList![1]).toContain("quest_type");
      expect(columnList![1]).toContain("is_paused");
      expect(selectList![1]).toContain("is_paused");
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
