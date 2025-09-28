import { QuestDifficulty, CharacterClass } from "@/lib/types/database";
import { CalculatedRewards, QuestRewards } from "@/types/QuestRewards";

export class RewardCalculator {
  static calculateQuestRewards(
    baseRewards: QuestRewards,
    difficulty: QuestDifficulty,
    characterClass: CharacterClass,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentLevel: number,
  ): CalculatedRewards {
    const classBonus = this.getClassBonus(characterClass);
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const baseGold = baseRewards.goldReward || 0;
    const baseXP = baseRewards.xpReward || 0;
    const baseGems = baseRewards.gemsReward || 0;
    const baseHonorPoints = baseRewards.honorPointsReward || 0;

    const rewards: CalculatedRewards = {
      gold: Number(
        (baseGold * classBonus.goldBonus * difficultyMultiplier).toFixed(2),
      ),
      xp: Number(
        (baseXP * classBonus.xpBonus * difficultyMultiplier).toFixed(2),
      ),
      gems: Number(
        (baseGems * classBonus.gemsBonus * difficultyMultiplier).toFixed(2),
      ),
      honorPoints: Number(
        (
          baseHonorPoints *
          classBonus.honorBonus *
          difficultyMultiplier
        ).toFixed(2),
      ),
    };

    return rewards;
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
    honorBonus: number;
    gemsBonus: number;
  } {
    switch (characterClass) {
      case "HEALER":
        return {
          xpBonus: 1.1,
          goldBonus: 1.0,
          honorBonus: 1.25,
          gemsBonus: 1.0,
        };
      case "RANGER":
        return {
          xpBonus: 1.0,
          goldBonus: 1.0,
          honorBonus: 1.0,
          gemsBonus: 1.3,
        };
      case "KNIGHT":
        return {
          xpBonus: 1.05,
          goldBonus: 1.05,
          honorBonus: 1.0,
          gemsBonus: 1.0,
        };
      case "MAGE":
        return {
          xpBonus: 1.2,
          goldBonus: 1.0,
          honorBonus: 1.0,
          gemsBonus: 1.0,
        };
      case "ROGUE":
        return {
          xpBonus: 1.0,
          goldBonus: 1.15,
          honorBonus: 1.0,
          gemsBonus: 1.0,
        };
      default:
        return { xpBonus: 1, goldBonus: 1, honorBonus: 1.0, gemsBonus: 1.0 };
    }
  }

  static getXPRequiredForLevel(level: number): number {
    // Simple quadratic formula for XP required per level
    return 50 * (level - 1) ** 2;
  }
}
