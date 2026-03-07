/**
 * Streak Utilities
 * Helper functions for streak calculations and validation
 */

import { getDaysBetweenInTimezone } from "@/lib/timezone-utils";

// Streak bonus constants
export const STREAK_BONUS_INCREMENT = 0.01; // 1% bonus per threshold
export const STREAK_THRESHOLD_DAYS = 5; // Bonus increases every 5 days
export const MAX_STREAK_BONUS = 0.05; // 5% maximum bonus (25-day streak)

/**
 * Calculate the streak bonus percentage for a given streak count
 * Formula: +1% per 5 days, capped at +5% (25-day streak)
 * Examples:
 * - 0-4 days: 0% bonus
 * - 5-9 days: 1% bonus (0.01)
 * - 10-14 days: 2% bonus (0.02)
 * - 25+ days: 5% bonus (0.05) - MAX
 */
export function calculateStreakBonus(streakCount: number): number {
  // Calculate how many thresholds have been reached
  const thresholdsPassed = Math.floor(streakCount / STREAK_THRESHOLD_DAYS);

  // Calculate bonus (1% per threshold)
  const bonus = thresholdsPassed * STREAK_BONUS_INCREMENT;

  // Cap at maximum bonus (5%)
  return Math.min(bonus, MAX_STREAK_BONUS);
}

/**
 * Validate if a quest completion is consecutive (no gaps in the streak)
 * Checks if the last completion was within the expected timeframe in the family's timezone
 */
export function validateConsecutiveCompletion(
  lastCompletedDate: string | null,
  recurrencePattern: "DAILY" | "WEEKLY" | "CUSTOM",
  currentDate: Date,
  timezone: string = "UTC",
): boolean {
  if (!lastCompletedDate) {
    // First completion is always valid
    return true;
  }

  const lastDate = new Date(lastCompletedDate);

  // For DAILY quests: allow completion today or yesterday in the family's timezone
  if (recurrencePattern === "DAILY") {
    const daysBetween = getDaysBetweenInTimezone(
      lastDate,
      currentDate,
      timezone,
    );

    // Allow same day (0 days = re-completion) or next day (1 day = consecutive)
    // daysBetween uses calendar days in the family's timezone, so this is correct
    return daysBetween <= 1;
  }

  // For WEEKLY quests: allow completion this week or last week in the family's timezone
  if (recurrencePattern === "WEEKLY") {
    const daysBetween = getDaysBetweenInTimezone(
      lastDate,
      currentDate,
      timezone,
    );

    // Allow up to 8 days (same week or previous week)
    // This accounts for completing at the start of one week and end of next
    return daysBetween < 8;
  }

  // For CUSTOM, we can't validate without more info, so allow it
  return true;
}
