/**
 * Quest Instance Service
 * Handles family quest claiming, release, and assignment operations
 * Implements anti-hoarding logic (one family quest per hero) and volunteer bonuses
 */

import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { QuestInstance, QuestTemplate } from "@/lib/types/database";
import { StreakService } from "@/lib/streak-service";
import { RewardCalculator } from "@/lib/reward-calculator";

// Volunteer bonus percentage (20% = 0.2 multiplier)
const VOLUNTEER_BONUS_PERCENT = 0.2;

export class QuestInstanceService {
  private readonly streakService: StreakService;

  constructor(
    private readonly client: SupabaseClient<Database> = supabase,
    streakServiceInstance?: StreakService
  ) {
    this.streakService = streakServiceInstance ?? new StreakService(this.client);
  }

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
    const { data: quest, error: fetchError } = await this.client
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
    const { data: character, error: characterError } = await this.client
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
    const { data: updatedQuest, error: updateError } = await this.client
      .from("quest_instances")
      .update({
        assigned_to_id: character.user_id, // Assign to the user, not character
        volunteered_by: characterId,
        volunteer_bonus: VOLUNTEER_BONUS_PERCENT, // Store as decimal (0.2 = 20%)
        status: "PENDING",
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to claim quest: ${updateError.message}`);
    }

    // Update character's active_family_quest_id
    const { error: characterUpdateError } = await this.client
      .from("characters")
      .update({ active_family_quest_id: questId })
      .eq("id", characterId);

    if (characterUpdateError) {
      // Rollback quest update if character update fails
      await this.client
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
    const { data: quest, error: fetchError } = await this.client
      .from("quest_instances")
      .select("*")
      .eq("id", questId)
      .single();

    if (fetchError || !quest) {
      throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
    }

    // Validate quest is PENDING, CLAIMED, IN_PROGRESS, or AVAILABLE status
    if (quest.status !== "PENDING" && quest.status !== "CLAIMED" && quest.status !== "IN_PROGRESS" && quest.status !== "AVAILABLE") {
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
    const { data: updatedQuest, error: updateError } = await this.client
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
      const { error: characterUpdateError } = await this.client
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
    void _gmId;
    // Fetch the quest to validate it's available
    const { data: quest, error: fetchError } = await this.client
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
    const { data: character, error: characterError } = await this.client
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
    const { data: updatedQuest, error: updateError } = await this.client
      .from("quest_instances")
      .update({
        assigned_to_id: character.user_id, // Assign to the user
        volunteered_by: characterId, // Store the specific character being assigned
        volunteer_bonus: null, // No volunteer bonus for GM assignments
        status: "PENDING",
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to assign quest: ${updateError.message}`);
    }

    // Update character's active_family_quest_id
    const { error: characterUpdateError } = await this.client
      .from("characters")
      .update({ active_family_quest_id: questId })
      .eq("id", characterId);

    if (characterUpdateError) {
      // Rollback quest update if character update fails
      await this.client
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
   * Approve a completed quest and distribute rewards
   * - Validates quest is in a completable state (CLAIMED)
   * - Fetches assigned character and quest template
   * - Calculates total rewards (base + volunteer bonus + streak bonus)
   * - Updates character stats (gold, xp, level)
   * - Increments quest streak for recurring quests
   * - Sets quest status to APPROVED
   * @param questId - The quest instance ID to approve
   * @returns The approved quest instance
  */
  async approveQuest(questId: string): Promise<QuestInstance> {
    const { data: quest, error: fetchError } = await this.client
      .from("quest_instances")
      .select("*")
      .eq("id", questId)
      .single();

    if (fetchError || !quest) {
      throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
    }

    if (quest.status !== "CLAIMED" && quest.status !== "IN_PROGRESS" && quest.status !== "COMPLETED") {
      throw new Error(`Quest cannot be approved (status: ${quest.status})`);
    }

    if (!quest.assigned_to_id) {
      throw new Error("Quest is not assigned to a hero");
    }

    let characterQuery = this.client.from("characters").select("*");

    // Prioritize the specific character ID if available (from claim or new assignment logic)
    if (quest.volunteered_by) {
      characterQuery = characterQuery.eq("id", quest.volunteered_by);
    } else {
      // Fallback for legacy assigned quests: find a character by user ID.
      // Using limit(1) to prevent errors if a user has multiple characters.
      characterQuery = characterQuery.eq("user_id", quest.assigned_to_id).limit(1);
    }

    const { data: character, error: characterError } = await characterQuery.single();

    if (characterError || !character) {
      throw new Error(`Failed to fetch assigned character: ${characterError?.message || "Character not found"}`);
    }

    const completionDate = quest.completed_at ? new Date(quest.completed_at) : new Date();
    const completionTimestamp = completionDate.toISOString();

    let template: QuestTemplate | null = null;
    if (quest.template_id) {
      const { data: templateData, error: templateError } = await this.client
        .from("quest_templates")
        .select("*")
        .eq("id", quest.template_id)
        .maybeSingle();

      if (templateError) {
        throw new Error(`Failed to fetch quest template: ${templateError.message}`);
      }

      template = templateData ?? null;
    }

    const baseXp = quest.xp_reward ?? template?.xp_reward ?? 0;
    const baseGold = quest.gold_reward ?? template?.gold_reward ?? 0;

    let totalXp = baseXp;
    let totalGold = baseGold;
    let streakCount = quest.streak_count ?? 0;
    let streakBonus = quest.streak_bonus ?? 0;

    // 1. Volunteer Bonus
    if (quest.volunteer_bonus && quest.volunteer_bonus > 0 && quest.volunteered_by === character.id) {
      totalXp += baseXp * quest.volunteer_bonus;
      totalGold += baseGold * quest.volunteer_bonus;
    }

    const templateIdForStreaks = template?.id ?? quest.template_id ?? null;
    const recurrencePattern = (quest.recurrence_pattern ?? template?.recurrence_pattern ?? null) as
      | "DAILY"
      | "WEEKLY"
      | "CUSTOM"
      | null;

    // Fetch family timezone for streak validation
    let familyTimezone = 'UTC';
    if (quest.family_id) {
      const { data: family } = await this.client
        .from("families")
        .select("timezone")
        .eq("id", quest.family_id)
        .maybeSingle();

      if (family) {
        familyTimezone = family.timezone ?? 'UTC';
      }
    }

    if (templateIdForStreaks && recurrencePattern) {
      const streak = await this.streakService.getStreak(character.id, templateIdForStreaks);
      const isConsecutive = this.streakService.validateConsecutiveCompletion(
        streak.last_completed_date,
        recurrencePattern,
        completionDate,
        familyTimezone
      );

      if (isConsecutive) {
        const updatedStreak = await this.streakService.incrementStreak(
          character.id,
          templateIdForStreaks,
          completionDate
        );
        streakCount = updatedStreak.current_streak ?? 0;
        streakBonus = this.streakService.calculateStreakBonus(streakCount);
        totalXp += baseXp * streakBonus;
        totalGold += baseGold * streakBonus;
      } else {
        const resetStreak = await this.streakService.resetStreak(character.id, templateIdForStreaks);
        streakCount = resetStreak.current_streak ?? 0;
        streakBonus = 0;
      }
    }

    const updatedXp = Math.round(totalXp);
    const updatedGold = Math.round(totalGold);

    const characterUpdatePayload: {
      gold: number;
      xp: number;
      active_family_quest_id: null;
      level?: number;
    } = {
      gold: (character.gold || 0) + updatedGold,
      xp: (character.xp || 0) + updatedXp,
      active_family_quest_id: null,
    };

    const levelResult = RewardCalculator.calculateLevelUp(
      character.xp || 0,
      updatedXp,
      character.level || 1
    );

    if (levelResult) {
      characterUpdatePayload.level = levelResult.newLevel;
    }

    // Update character stats
    const { error: characterUpdateError } = await this.client
      .from("characters")
      .update(characterUpdatePayload)
      .eq("id", character.id);

    if (characterUpdateError) {
      throw new Error(`Failed to update character stats: ${characterUpdateError.message}`);
    }

    // Update quest status to APPROVED
    const { data: approvedQuest, error: questUpdateError } = await this.client
      .from("quest_instances")
      .update({
        status: "APPROVED",
        completed_at: completionTimestamp,
        approved_at: new Date().toISOString(),
        streak_count: streakCount,
        streak_bonus: streakBonus,
      })
      .eq("id", questId)
      .select()
      .single();

    if (questUpdateError) {
      // Note: Character stats were already updated. Consider a rollback strategy for production.
      throw new Error(`Failed to approve quest: ${questUpdateError.message}`);
    }

    return approvedQuest;
  }
}

// Export a singleton instance
export const questInstanceService = new QuestInstanceService();
