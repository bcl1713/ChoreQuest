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
    let newLevel = currentLevel;
    while (this.getXPRequiredForLevel(newLevel + 1) <= gainedXP + currentXP) {
      newLevel += 1;
    }
    if (newLevel == currentLevel) {
      return null;
    } else {
      return {
        newLevel: newLevel,
        previousLevel: currentLevel,
      };
    }
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
    switch (characterClass) {
      case "HEALER":
        return { xpBonus: 1.1, goldBonus: 1.0 };
      case "RANGER":
        return { xpBonus: 1.0, goldBonus: 1.0 };
      case "KNIGHT":
        return { xpBonus: 1.05, goldBonus: 1.05 };
      case "MAGE":
        return { xpBonus: 1.2, goldBonus: 1.0 };
      case "ROGUE":
        return { xpBonus: 1.0, goldBonus: 1.15 };
      default:
        return { xpBonus: 1, goldBonus: 1 };
    }
  }

  static getXPRequiredForLevel(level: number): number {
    // Simple quadratic formula for XP required per level
    return 50 * (level - 1) ** 2;
  }
}
