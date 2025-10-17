/**
 * Streak Service
 * Handles consecutive completion streak tracking for recurring quests
 * Implements streak bonuses (+1% per 5 days, capped at +5%)
 */

import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database-generated";
import { getDaysBetweenInTimezone } from "@/lib/timezone-utils";

type CharacterQuestStreak = Tables<"character_quest_streaks">;
type CharacterQuestStreakInsert = TablesInsert<"character_quest_streaks">;
type CharacterQuestStreakUpdate = TablesUpdate<"character_quest_streaks">;

// Streak bonus constants
const STREAK_BONUS_INCREMENT = 0.01; // 1% bonus per threshold
const STREAK_THRESHOLD_DAYS = 5; // Bonus increases every 5 days
const MAX_STREAK_BONUS = 0.05; // 5% maximum bonus (25-day streak)

export class StreakService {
  constructor(
    private readonly client: SupabaseClient | typeof supabase = supabase
  ) {}
  /**
   * Get the current streak for a character and template
   * Creates a new streak record if one doesn't exist
   * @param characterId - The character ID
   * @param templateId - The quest template ID
   * @returns The streak record
   */
  async getStreak(characterId: string, templateId: string): Promise<CharacterQuestStreak> {
    const { data: streak, error } = await this.client
      .from("character_quest_streaks")
      .select("*")
      .eq("character_id", characterId)
      .eq("template_id", templateId)
      .single();

    if (error && error.code === "PGRST116") {
      // No streak found, create a new one
      const newStreak: CharacterQuestStreakInsert = {
        character_id: characterId,
        template_id: templateId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
      };

      const { data: createdStreak, error: createError } = await this.client
        .from("character_quest_streaks")
        .insert(newStreak)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create streak: ${createError.message}`);
      }

      return createdStreak;
    }

    if (error) {
      throw new Error(`Failed to fetch streak: ${error.message}`);
    }

    return streak;
  }

  /**
   * Increment the streak for a character and template
   * Updates current_streak, longest_streak if exceeded, and last_completed_date
   * @param characterId - The character ID
   * @param templateId - The quest template ID
   * @param completedDate - The date the quest was completed
   * @returns The updated streak record
   */
  async incrementStreak(
    characterId: string,
    templateId: string,
    completedDate: Date
  ): Promise<CharacterQuestStreak> {
    // Get current streak
    const streak = await this.getStreak(characterId, templateId);

    // Increment streak count
    const newStreakCount = (streak.current_streak || 0) + 1;
    const newLongestStreak = Math.max(newStreakCount, streak.longest_streak || 0);

    // Update streak record
    const update: CharacterQuestStreakUpdate = {
      current_streak: newStreakCount,
      longest_streak: newLongestStreak,
      last_completed_date: completedDate.toISOString(),
    };

    const { data: updatedStreak, error } = await this.client
      .from("character_quest_streaks")
      .update(update)
      .eq("id", streak.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to increment streak: ${error.message}`);
    }

    return updatedStreak;
  }

  /**
   * Reset the streak to 0 (called when a quest is missed)
   * Preserves longest_streak for historical reference
   * @param characterId - The character ID
   * @param templateId - The quest template ID
   * @returns The updated streak record
   */
  async resetStreak(characterId: string, templateId: string): Promise<CharacterQuestStreak> {
    // Get current streak
    const streak = await this.getStreak(characterId, templateId);

    // Reset current streak to 0, keep longest streak
    const update: CharacterQuestStreakUpdate = {
      current_streak: 0,
    };

    const { data: updatedStreak, error } = await this.client
      .from("character_quest_streaks")
      .update(update)
      .eq("id", streak.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reset streak: ${error.message}`);
    }

    return updatedStreak;
  }

  /**
   * Calculate the streak bonus percentage for a given streak count
   * Formula: +1% per 5 days, capped at +5% (25-day streak)
   * Examples:
   * - 0-4 days: 0% bonus
   * - 5-9 days: 1% bonus (0.01)
   * - 10-14 days: 2% bonus (0.02)
   * - 25+ days: 5% bonus (0.05) - MAX
   * @param streakCount - The current streak count
   * @returns The bonus percentage as a decimal (e.g., 0.05 = 5%)
   */
  calculateStreakBonus(streakCount: number): number {
    // Calculate how many thresholds have been reached
    const thresholdsPassed = Math.floor(streakCount / STREAK_THRESHOLD_DAYS);

    // Calculate bonus (1% per threshold)
    const bonus = thresholdsPassed * STREAK_BONUS_INCREMENT;

    // Cap at maximum bonus (5%)
    return Math.min(bonus, MAX_STREAK_BONUS);
  }

  /**
   * Get all streaks for a character
   * @param characterId - The character ID
   * @returns Array of streak records
   */
  async getCharacterStreaks(characterId: string): Promise<CharacterQuestStreak[]> {
    const { data: streaks, error } = await this.client
      .from("character_quest_streaks")
      .select("*")
      .eq("character_id", characterId)
      .order("current_streak", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch character streaks: ${error.message}`);
    }

    return streaks || [];
  }

  /**
   * Get streak leaderboard for a family
   * Returns characters ranked by their highest current streak
   * @param familyId - The family ID
   * @returns Array of streaks with character information
   */
  async getStreakLeaderboard(familyId: string): Promise<
    Array<CharacterQuestStreak & { character_name: string; template_title: string }>
  > {
    const { data: streaks, error } = await this.client
      .from("character_quest_streaks")
      .select(
        `
        *,
        characters!character_quest_streaks_character_id_fkey (
          name,
          user_id
        ),
        quest_templates!character_quest_streaks_template_id_fkey (
          title,
          family_id
        )
      `
      )
      .order("current_streak", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch streak leaderboard: ${error.message}`);
    }

    // Filter by family and transform the data
    type JoinedStreakRow = CharacterQuestStreak & {
      characters?: {
        name?: string | null;
        user_id?: string | null;
      } | null;
      quest_templates?: {
        title?: string | null;
        family_id?: string | null;
      } | null;
    };

    const leaderboard = ((streaks ?? []) as JoinedStreakRow[])
      .filter((streak) => streak.quest_templates?.family_id === familyId)
      .map((streak) => ({
        ...streak,
        character_name: streak.characters?.name ?? "Unknown",
        template_title: streak.quest_templates?.title ?? "Unknown",
      }));

    return leaderboard;
  }

  /**
   * Validate if a quest completion is consecutive (no gaps in the streak)
   * Checks if the last completion was within the expected timeframe in the family's timezone
   * @param lastCompletedDate - The last completion date (ISO string or null)
   * @param recurrencePattern - The quest recurrence pattern (DAILY or WEEKLY)
   * @param currentDate - The current completion date
   * @param timezone - The family's IANA timezone string (e.g., 'America/Chicago')
   * @param weekStartDay - Day of week for weekly recurrence (0=Sunday, 1=Monday, etc.)
   * @returns True if consecutive, false if there's a gap
   */
  validateConsecutiveCompletion(
    lastCompletedDate: string | null,
    recurrencePattern: "DAILY" | "WEEKLY" | "CUSTOM",
    currentDate: Date,
    timezone: string = 'UTC',
    _weekStartDay: number = 0
  ): boolean {
    if (!lastCompletedDate) {
      // First completion is always valid
      return true;
    }

    const lastDate = new Date(lastCompletedDate);

    // For DAILY quests: allow completion today or yesterday in the family's timezone
    if (recurrencePattern === "DAILY") {
      const daysBetween = getDaysBetweenInTimezone(lastDate, currentDate, timezone);

      // Allow same day (re-completion edge case) or next day (consecutive)
      // Also allow 2-day gap to account for timezone edge cases
      return daysBetween <= 2;
    }

    // For WEEKLY quests: allow completion this week or last week in the family's timezone
    if (recurrencePattern === "WEEKLY") {
      const daysBetween = getDaysBetweenInTimezone(lastDate, currentDate, timezone);

      // Allow up to 8 days (same week or previous week)
      // This accounts for completing at the start of one week and end of next
      return daysBetween < 8;
    }

    // For CUSTOM, we can't validate without more info, so allow it
    return true;
  }
}

// Export a singleton instance
export const streakService = new StreakService();
