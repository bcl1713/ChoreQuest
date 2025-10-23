import { CharacterClass } from "@/lib/types/database";

/**
 * Character class configuration with UI metadata and bonus information.
 * Bonus values MUST match RewardCalculator.getClassBonus() exactly.
 */
export interface CharacterClassInfo {
  id: CharacterClass;
  name: string;
  description: string;
  icon: string;
  bonuses: {
    xp: number;      // Multiplier (1.0 = no bonus, 1.2 = +20%)
    gold: number;    // Multiplier
    honor: number;   // Multiplier
    gems: number;    // Multiplier
  };
}

/**
 * All available character classes with their UI metadata and bonuses.
 * These bonuses apply to ALL quests, regardless of quest type.
 *
 * IMPORTANT: Bonus values must match RewardCalculator.getClassBonus() exactly.
 */
export const CHARACTER_CLASSES: CharacterClassInfo[] = [
  {
    id: "MAGE",
    name: "Mage",
    description: "Masters of arcane knowledge and wisdom",
    icon: "Wand",
    bonuses: {
      xp: 1.2,      // +20% XP on all quests
      gold: 1.0,    // No gold bonus
      honor: 1.0,   // No honor bonus
      gems: 1.0,    // No gems bonus
    },
  },
  {
    id: "ROGUE",
    name: "Rogue",
    description: "Masters of cunning and fortune",
    icon: "Sword",
    bonuses: {
      xp: 1.0,      // No XP bonus
      gold: 1.15,   // +15% Gold on all quests
      honor: 1.0,   // No honor bonus
      gems: 1.0,    // No gems bonus
    },
  },
  {
    id: "KNIGHT",
    name: "Knight",
    description: "Balanced warriors of honor",
    icon: "Shield",
    bonuses: {
      xp: 1.05,     // +5% XP on all quests
      gold: 1.05,   // +5% Gold on all quests
      honor: 1.0,   // No honor bonus
      gems: 1.0,    // No gems bonus
    },
  },
  {
    id: "HEALER",
    name: "Healer",
    description: "Supportive heroes who strengthen the family",
    icon: "Sparkles",
    bonuses: {
      xp: 1.1,      // +10% XP on all quests
      gold: 1.0,    // No gold bonus
      honor: 1.25,  // +25% Honor Points on all quests
      gems: 1.0,    // No gems bonus
    },
  },
  {
    id: "RANGER",
    name: "Ranger",
    description: "Seekers of rare treasures",
    icon: "Crosshair",
    bonuses: {
      xp: 1.0,      // No XP bonus
      gold: 1.0,    // No gold bonus
      honor: 1.0,   // No honor bonus
      gems: 1.3,    // +30% Gems on all quests
    },
  },
];

/**
 * Helper function to format a bonus multiplier as a percentage string.
 * @param multiplier - The bonus multiplier (e.g., 1.2 for +20%)
 * @returns Formatted percentage string (e.g., "+20%")
 */
export function formatBonusPercentage(multiplier: number): string {
  if (multiplier === 1.0) {
    return "+0%";
  }
  const percentage = Math.round((multiplier - 1.0) * 100);
  return `+${percentage}%`;
}

/**
 * Get character class info by class ID.
 * @param classId - The character class ID
 * @returns Character class info or undefined if not found
 */
export function getCharacterClassInfo(classId: CharacterClass): CharacterClassInfo | undefined {
  return CHARACTER_CLASSES.find(c => c.id === classId);
}
