import { QuestDifficulty, CharacterClass } from "@/lib/generated/prisma";

export class RewardCalculator {
  static calculateQuestRewards(
    baseRewards: QuestRewards,
    difficulty: QuestDifficulty,
    characterClass: CharacterClass,
    currentLevel: number,
  ): CalculatedRewards {
    // This will be implemented later - for now return dummy values to make tests fail
    return {
      gold: 0,
      xp: 0,
      gems: 0,
      honorPoints: 0,
    };
  }

  static calculateLevelUp(
    currentXP: number,
    gainedXP: number,
    currentLevel: number,
  ): { newLevel: number; previousLevel: number } | null {
    // This will be implemented later - for now return null to make tests fail
    return null;
  }

  static getDifficultyMultiplier(difficulty: QuestDifficulty): number {
    switch (difficulty) {
      case "EASY":
        return 1.0;
      case "MEDIUM":
        return 1.5;
      case "HARD":
        return 2.0;
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }
  }

  static getClassBonus(characterClass: CharacterClass): {
    xpBonus: number;
    goldBonus: number;
  } {
    // This will be implemented later - for now return no bonuses to make tests fail
    return { xpBonus: 1, goldBonus: 1 };
  }

  static getXPRequiredForLevel(level: number): number {
    // This will be implemented later - for now return high number to make level up tests fail
    return 999999;
  }
}
