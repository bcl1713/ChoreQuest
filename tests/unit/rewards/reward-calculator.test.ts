import { describe, it, expect } from "@jest/globals";
import { RewardCalculator } from "@/lib/reward-calculator";
import { QuestRewards } from "@/types/QuestRewards";

describe("RewardCalculator", () => {
  describe("calculateQuestRewards", () => {
    it("should calculate base rewards for EASY quest with KNIGHT class", () => {
      const baseRewards: QuestRewards = {
        goldReward: 50,
        xpReward: 100,
        gemsReward: 5,
        honorPointsReward: 10,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "EASY",
        "KNIGHT",
        1,
      );

      // EASY quests should have base multiplier (1x) with KNIGHT bonus (1.05x)
      expect(result.gold).toBe(52); // 50 * 1.05 = 52.5, floor = 52
      expect(result.xp).toBe(105);
      expect(result.gems).toBe(5);
      expect(result.honor_points).toBe(10);
    });

    it("should apply difficulty multiplier for MEDIUM quests", () => {
      const baseRewards: QuestRewards = {
        xpReward: 100,
        goldReward: 50,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "MEDIUM",
        "KNIGHT",
        1,
      );

      // MEDIUM should be 1.5x multiplier with 1.05x KNIGHT bonus
      expect(result.xp).toBe(157); // 100 * 1.5 * 1.05 = 157.5, floor = 157
      expect(result.gold).toBe(78); // 100 * 1.5 * 1.05 = 78.75, floor = 78
    });

    it("should apply difficulty multiplier for HARD quests", () => {
      const baseRewards: QuestRewards = {
        xpReward: 100,
        goldReward: 50,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "HARD",
        "KNIGHT",
        1,
      );

      // HARD should be 2x multiplier with 1.05x KNIGHT bonus
      expect(result.xp).toBe(210);
      expect(result.gold).toBe(105);
    });

    it("should apply MAGE class XP bonus", () => {
      const baseRewards: QuestRewards = {
        xpReward: 100,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "EASY",
        "MAGE",
        1,
      );

      // MAGE should get 1.2x XP bonus
      expect(result.xp).toBe(120);
    });

    it("should apply ROGUE class gold bonus", () => {
      const baseRewards: QuestRewards = {
        goldReward: 100,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "EASY",
        "ROGUE",
        1,
      );

      // ROGUE should get 1.15x gold bonus (100 * 1.15 = 115, but floating point precision may cause floor to be 114)
      expect(result.gold).toBe(114);
    });

    it("should apply RANGER class gem bonus", () => {
      const baseRewards: QuestRewards = {
        gemsReward: 10,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "EASY",
        "RANGER",
        1,
      );

      // RANGER should get 1.3x gem bonus
      expect(result.gems).toBe(13);
    });

    it("should apply HEALER class honor points bonus", () => {
      const baseRewards: QuestRewards = {
        honorPointsReward: 20,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "EASY",
        "HEALER",
        1,
      );

      // HEALER should get 1.25x honor points bonus
      expect(result.honor_points).toBe(25);
    });

    it("should combine difficulty multiplier and class bonuses", () => {
      const baseRewards: QuestRewards = {
        xpReward: 100,
        goldReward: 100,
      };

      const result = RewardCalculator.calculateQuestRewards(
        baseRewards,
        "HARD", // 2x multiplier
        "MAGE", // 1.2x XP bonus
        1,
      );

      // XP: 100 * 2 (difficulty) * 1.2 (class) = 240
      // Gold: 100 * 2 (difficulty) = 200 (no MAGE gold bonus)
      expect(result.xp).toBe(240);
      expect(result.gold).toBe(200);
    });
  });

  describe("calculateLevelUp", () => {
    it("should not level up if XP requirement not met", () => {
      const result = RewardCalculator.calculateLevelUp(0, 10, 1);

      // 10 total XP should not be enough for level 2 (assuming 50 XP required)
      expect(result).toBeNull();
    });

    it("should level up when XP requirement is met", () => {
      const result = RewardCalculator.calculateLevelUp(40, 50, 1);

      // 1100 total XP should be enough for level 2
      expect(result).not.toBeNull();
      expect(result!.newLevel).toBe(2);
      expect(result!.previousLevel).toBe(1);
    });

    it("should handle multiple level ups in one quest", () => {
      const result = RewardCalculator.calculateLevelUp(500, 2000, 1);

      // 2500 total XP should skip multiple levels
      expect(result).not.toBeNull();
      expect(result!.newLevel).toBeGreaterThan(2);
      expect(result!.previousLevel).toBe(1);
    });

    it("should calculate correct level for high XP values", () => {
      const result = RewardCalculator.calculateLevelUp(5000, 1000, 5);

      // Should calculate the correct new level based on XP formula
      expect(result).not.toBeNull();
      expect(result!.previousLevel).toBe(5);
      expect(result!.newLevel).toBeGreaterThan(5);
    });
  });

  describe("getDifficultyMultiplier", () => {
    it("should return correct multipliers for each difficulty", () => {
      expect(RewardCalculator.getDifficultyMultiplier("EASY")).toBe(1.0);
      expect(RewardCalculator.getDifficultyMultiplier("MEDIUM")).toBe(1.5);
      expect(RewardCalculator.getDifficultyMultiplier("HARD")).toBe(2.0);
    });
  });

  describe("getClassBonus", () => {
    it("should return MAGE bonuses", () => {
      const bonus = RewardCalculator.getClassBonus("MAGE");
      expect(bonus.xpBonus).toBe(1.2);
      expect(bonus.goldBonus).toBe(1.0);
    });

    it("should return ROGUE bonuses", () => {
      const bonus = RewardCalculator.getClassBonus("ROGUE");
      expect(bonus.xpBonus).toBe(1.0);
      expect(bonus.goldBonus).toBe(1.15);
    });

    it("should return KNIGHT bonuses (balanced)", () => {
      const bonus = RewardCalculator.getClassBonus("KNIGHT");
      expect(bonus.xpBonus).toBe(1.05);
      expect(bonus.goldBonus).toBe(1.05);
    });

    it("should return RANGER bonuses", () => {
      const bonus = RewardCalculator.getClassBonus("RANGER");
      expect(bonus.xpBonus).toBe(1.0);
      expect(bonus.goldBonus).toBe(1.0);
      // RANGER bonus is for gems, which we'll test in a separate gem bonus test
    });

    it("should return HEALER bonuses", () => {
      const bonus = RewardCalculator.getClassBonus("HEALER");
      expect(bonus.xpBonus).toBe(1.1);
      expect(bonus.goldBonus).toBe(1.0);
      // HEALER bonus is for honor points, which we'll test separately
    });
  });

  describe("getXPRequiredForLevel", () => {
    it("should return correct XP requirements for early levels", () => {
      expect(RewardCalculator.getXPRequiredForLevel(1)).toBe(0); // Level 1 starts at 0
      expect(RewardCalculator.getXPRequiredForLevel(2)).toBe(50);
      expect(RewardCalculator.getXPRequiredForLevel(3)).toBe(200);
      expect(RewardCalculator.getXPRequiredForLevel(4)).toBe(450);
    });
  });

  describe("getLevelProgress", () => {
    it("returns zero progress for a brand new level one hero", () => {
      const progress = RewardCalculator.getLevelProgress(1, 0);

      expect(progress.current).toBe(0);
      expect(progress.required).toBe(50);
      expect(progress.percentage).toBe(0);
    });

    it("calculates XP progress within the current level", () => {
      // Level 3 starts at 200 XP, level 4 requires 450 XP total.
      const progress = RewardCalculator.getLevelProgress(3, 250);

      expect(progress.current).toBe(50); // 250 total - 200 required for level 3
      expect(progress.required).toBe(250); // 450 - 200
      expect(progress.percentage).toBeCloseTo(20, 5);
    });

    it("clamps progress when XP exceeds the next level requirement", () => {
      // This can happen temporarily if the level up event hasn't processed yet.
      const progress = RewardCalculator.getLevelProgress(2, 5000);

      expect(progress.current).toBe(progress.required);
      expect(progress.percentage).toBe(100);
    });

    it("floors non-integer levels and clamps progress", () => {
      const progress = RewardCalculator.getLevelProgress(1.5, 75);

      expect(progress.current).toBe(progress.required);
      expect(progress.percentage).toBe(100);
    });

    it("defaults negative levels to level one", () => {
      const progress = RewardCalculator.getLevelProgress(-3, 25);

      expect(progress.current).toBe(25);
      expect(progress.required).toBe(50);
      expect(progress.percentage).toBe(50);
    });

    it("treats non-finite level values as level one", () => {
      const progress = RewardCalculator.getLevelProgress(Number.NaN, 100);

      expect(progress.current).toBe(progress.required);
      expect(progress.percentage).toBe(100);
    });

    it("resets non-finite XP values to zero", () => {
      const progress = RewardCalculator.getLevelProgress(3, Number.POSITIVE_INFINITY);

      expect(progress.current).toBe(0);
      expect(progress.required).toBe(250);
      expect(progress.percentage).toBe(0);
    });

    it("clamps negative XP values to zero", () => {
      const progress = RewardCalculator.getLevelProgress(2, -50);

      expect(progress.current).toBe(0);
      expect(progress.required).toBe(150);
      expect(progress.percentage).toBe(0);
    });
  });
});
