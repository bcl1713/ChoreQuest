import type { AchievementEventType } from "./types";

export const EVENT_CRITERIA_MAP: Record<AchievementEventType, string[]> = {
  QUEST_APPROVED: [
    "quest_complete",
    "quest_volunteer",
    "quest_difficulty",
    "gold_earned",
    "xp_earned",
    "level_reached",
    "streak_reached",
    "compound",
  ],
  REWARD_APPROVED: ["gold_spent", "reward_redeemed", "compound"],
  BOSS_COMPLETED: [
    "boss_defeated",
    "boss_participated",
    "gold_earned",
    "xp_earned",
    "level_reached",
    "compound",
  ],
  CLASS_CHANGED: ["class_change", "compound"],
};

export const ALL_CRITERIA_TYPES = [
  "quest_complete",
  "quest_volunteer",
  "quest_difficulty",
  "boss_defeated",
  "boss_participated",
  "gold_earned",
  "gold_spent",
  "reward_redeemed",
  "xp_earned",
  "level_reached",
  "streak_reached",
  "class_change",
  "honor_earned",
  "compound",
] as const;
