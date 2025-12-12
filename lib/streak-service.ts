/**
 * Streak Service
 * Handles consecutive completion streak tracking for recurring quests
 * Implements streak bonuses (+1% per 5 days, capped at +5%)
 */

import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/types/database-generated";

type CharacterQuestStreak = Tables<"character_quest_streaks">;
type CharacterQuestStreakInsert = TablesInsert<"character_quest_streaks">;
type CharacterQuestStreakUpdate = TablesUpdate<"character_quest_streaks">;

export class StreakService {
  constructor(private readonly client: SupabaseClient<Database> = supabase) {}
  /**
   * Get the current streak for a character and template
   * Creates a new streak record if one doesn't exist
   * @param characterId - The character ID
   * @param templateId - The quest template ID
   * @returns The streak record
   */
  async getStreak(
    characterId: string,
    templateId: string,
  ): Promise<CharacterQuestStreak> {
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
    completedDate: Date,
  ): Promise<CharacterQuestStreak> {
    // Get current streak
    const streak = await this.getStreak(characterId, templateId);

    // Increment streak count
    const newStreakCount = (streak.current_streak || 0) + 1;
    const newLongestStreak = Math.max(
      newStreakCount,
      streak.longest_streak || 0,
    );

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
  async resetStreak(
    characterId: string,
    templateId: string,
  ): Promise<CharacterQuestStreak> {
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
   * Get all streaks for a character
   * @param characterId - The character ID
   * @returns Array of streak records
   */
  async getCharacterStreaks(
    characterId: string,
  ): Promise<CharacterQuestStreak[]> {
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
  async getStreakLeaderboard(
    familyId: string,
  ): Promise<
    Array<
      CharacterQuestStreak & { character_name: string; template_title: string }
    >
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
      `,
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
}

// Export a singleton instance
export const streakService = new StreakService();
