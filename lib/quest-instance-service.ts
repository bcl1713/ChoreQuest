/**
 * Quest Instance Service
 * Handles family quest claiming, release, and assignment operations
 * Implements anti-hoarding logic (one family quest per hero) and volunteer bonuses
 */

import { supabase } from "@/lib/supabase";
import { QuestInstance } from "@/lib/types/database";

// Volunteer bonus percentage (20% = 0.2 multiplier)
const VOLUNTEER_BONUS_PERCENT = 0.2;

export class QuestInstanceService {
  /**
   * Claim a family quest for a hero
   * - Validates quest is AVAILABLE and FAMILY type
   * - Checks hero doesn't already have an active family quest (anti-hoarding)
   * - Sets assigned_to_id, volunteered_by, and calculates volunteer_bonus
   * - Updates character.active_family_quest_id
   * @param questId - The quest instance ID to claim
   * @param characterId - The character claiming the quest
   * @returns The claimed quest instance
   */
  async claimQuest(questId: string, characterId: string): Promise<QuestInstance> {
    // Fetch the quest to validate it's available and a family quest
    const { data: quest, error: fetchError } = await supabase
      .from("quest_instances")
      .select("*")
      .eq("id", questId)
      .single();

    if (fetchError || !quest) {
      throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
    }

    // Validate quest is AVAILABLE status
    if (quest.status !== "AVAILABLE") {
      throw new Error(`Quest is not available for claiming (status: ${quest.status})`);
    }

    // Validate quest is FAMILY type
    if (quest.quest_type !== "FAMILY") {
      throw new Error("Only FAMILY quests can be claimed");
    }

    // Fetch character to check for active family quest
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (characterError || !character) {
      throw new Error(`Failed to fetch character: ${characterError?.message || "Character not found"}`);
    }

    // Check if hero already has an active family quest (anti-hoarding)
    if (character.active_family_quest_id) {
      throw new Error("Hero already has an active family quest. Release the current quest before claiming another.");
    }

    // Calculate volunteer bonus (20% of base rewards)
    // Note: The bonus is stored as a multiplier (0.2) in the database
    // The actual bonus rewards will be calculated when the quest is approved

    // Update quest with claim details
    const { data: updatedQuest, error: updateError } = await supabase
      .from("quest_instances")
      .update({
        assigned_to_id: character.user_id, // Assign to the user, not character
        volunteered_by: characterId,
        volunteer_bonus: VOLUNTEER_BONUS_PERCENT, // Store as decimal (0.2 = 20%)
        status: "CLAIMED",
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to claim quest: ${updateError.message}`);
    }

    // Update character's active_family_quest_id
    const { error: characterUpdateError } = await supabase
      .from("characters")
      .update({ active_family_quest_id: questId })
      .eq("id", characterId);

    if (characterUpdateError) {
      // Rollback quest update if character update fails
      await supabase
        .from("quest_instances")
        .update({
          assigned_to_id: null,
          volunteered_by: null,
          volunteer_bonus: null,
          status: "AVAILABLE",
        })
        .eq("id", questId);

      throw new Error(`Failed to update character: ${characterUpdateError.message}`);
    }

    return updatedQuest;
  }

  /**
   * Release a claimed family quest back to AVAILABLE status
   * - Can be called by the hero who claimed it or by a GM
   * - Clears assigned_to_id, volunteered_by, and volunteer_bonus
   * - Updates character.active_family_quest_id to null
   * @param questId - The quest instance ID to release
   * @param characterId - The character releasing the quest (for validation)
   * @returns The released quest instance
   */
  async releaseQuest(questId: string, characterId: string): Promise<QuestInstance> {
    // Fetch the quest to validate it's claimed
    const { data: quest, error: fetchError } = await supabase
      .from("quest_instances")
      .select("*")
      .eq("id", questId)
      .single();

    if (fetchError || !quest) {
      throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
    }

    // Validate quest is CLAIMED or AVAILABLE status
    if (quest.status !== "CLAIMED" && quest.status !== "AVAILABLE") {
      throw new Error(`Quest cannot be released (status: ${quest.status})`);
    }

    // Validate quest is FAMILY type
    if (quest.quest_type !== "FAMILY") {
      throw new Error("Only FAMILY quests can be released");
    }

    // Validate the character is the one who claimed it (or allow GM to release)
    if (quest.volunteered_by !== characterId && quest.volunteered_by !== null) {
      // Allow GMs or the quest owner to release, but not other heroes
      // This validation might need additional role checking
      throw new Error("Only the hero who claimed this quest can release it");
    }

    // Update quest to AVAILABLE status
    const { data: updatedQuest, error: updateError } = await supabase
      .from("quest_instances")
      .update({
        assigned_to_id: null,
        volunteered_by: null,
        volunteer_bonus: null,
        status: "AVAILABLE",
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to release quest: ${updateError.message}`);
    }

    // Update character's active_family_quest_id to null
    if (quest.volunteered_by) {
      const { error: characterUpdateError } = await supabase
        .from("characters")
        .update({ active_family_quest_id: null })
        .eq("id", quest.volunteered_by);

      if (characterUpdateError) {
        throw new Error(`Failed to update character: ${characterUpdateError.message}`);
      }
    }

    return updatedQuest;
  }

  /**
   * Assign a family quest to a specific hero (GM manual assignment)
   * - No volunteer bonus applied (only for self-claimed quests)
   * - Sets assigned_to_id without setting volunteered_by
   * - Updates character.active_family_quest_id
   * @param questId - The quest instance ID to assign
   * @param characterId - The character to assign the quest to
   * @param _gmId - The GM user ID performing the assignment (unused, kept for API compatibility)
   * @returns The assigned quest instance
   */
  async assignQuest(questId: string, characterId: string, _gmId: string): Promise<QuestInstance> {
    // Fetch the quest to validate it's available
    const { data: quest, error: fetchError } = await supabase
      .from("quest_instances")
      .select("*")
      .eq("id", questId)
      .single();

    if (fetchError || !quest) {
      throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
    }

    // Validate quest is AVAILABLE status
    if (quest.status !== "AVAILABLE") {
      throw new Error(`Quest is not available for assignment (status: ${quest.status})`);
    }

    // Validate quest is FAMILY type
    if (quest.quest_type !== "FAMILY") {
      throw new Error("Only FAMILY quests can be assigned");
    }

    // Fetch character to check for active family quest
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (characterError || !character) {
      throw new Error(`Failed to fetch character: ${characterError?.message || "Character not found"}`);
    }

    // Check if hero already has an active family quest (anti-hoarding)
    if (character.active_family_quest_id) {
      throw new Error("Hero already has an active family quest. They must complete or release it first.");
    }

    // Update quest with assignment (no volunteer bonus)
    const { data: updatedQuest, error: updateError } = await supabase
      .from("quest_instances")
      .update({
        assigned_to_id: character.user_id, // Assign to the user, not character
        volunteered_by: null, // No volunteer since it's GM-assigned
        volunteer_bonus: null, // No volunteer bonus for GM assignments
        status: "CLAIMED",
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to assign quest: ${updateError.message}`);
    }

    // Update character's active_family_quest_id
    const { error: characterUpdateError } = await supabase
      .from("characters")
      .update({ active_family_quest_id: questId })
      .eq("id", characterId);

    if (characterUpdateError) {
      // Rollback quest update if character update fails
      await supabase
        .from("quest_instances")
        .update({
          assigned_to_id: null,
          volunteered_by: null,
          volunteer_bonus: null,
          status: "AVAILABLE",
        })
        .eq("id", questId);

      throw new Error(`Failed to update character: ${characterUpdateError.message}`);
    }

    return updatedQuest;
  }
}

// Export a singleton instance
export const questInstanceService = new QuestInstanceService();
