/**
 * Activity Service
 * Fetches and aggregates family activity events for the admin dashboard
 */

import { supabase } from "@/lib/supabase";

export type ActivityEventType =
  | "QUEST_COMPLETED"
  | "QUEST_SUBMITTED"
  | "REWARD_REDEEMED"
  | "REWARD_APPROVED"
  | "REWARD_DENIED"
  | "LEVEL_UP"
  | "CHARACTER_CREATED";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  characterName: string;
  displayName: string;
  userId: string;

  // Quest-specific fields
  questTitle?: string;
  questId?: string;

  // Reward-specific fields
  rewardName?: string;
  rewardId?: string;
  redemptionId?: string;

  // Level-up specific fields
  newLevel?: number;
  previousLevel?: number;
}

export class ActivityService {
  /**
   * Get recent activity events for a family
   * Aggregates events from quest completions, reward redemptions, and level-ups
   * @param familyId - The family ID to fetch activity for
   * @param limit - Maximum number of events to return (default: 50)
   * @returns Array of activity events sorted by most recent first
   */
  async getRecentActivity(familyId: string, limit: number = 50): Promise<ActivityEvent[]> {
    // Fetch all family members with their characters
    const { data: familyMembers, error: membersError } = await supabase
      .from("user_profiles")
      .select(`
        id,
        display_name,
        characters (
          name,
          level,
          created_at
        )
      `)
      .eq("family_id", familyId);

    if (membersError) {
      throw new Error(`Failed to fetch family members: ${membersError.message}`);
    }

    // Create a map of user IDs to character info for quick lookup
    const userCharacterMap = new Map(
      familyMembers?.map((member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        return [
          member.id,
          {
            characterName: character?.name || "Unknown",
            displayName: member.display_name || "Unknown",
            characterCreatedAt: character?.created_at,
          },
        ];
      }) || []
    );

    const events: ActivityEvent[] = [];

    // Fetch recent quest completions
    const { data: completedQuests, error: questsError } = await supabase
      .from("quest_instances")
      .select("id, title, assigned_to_id, completed_at, status")
      .eq("family_id", familyId)
      .eq("status", "COMPLETED")
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (questsError) {
      throw new Error(`Failed to fetch completed quests: ${questsError.message}`);
    }

    // Add quest completion events
    completedQuests?.forEach((quest) => {
      if (!quest.completed_at || !quest.assigned_to_id) return;

      const userInfo = userCharacterMap.get(quest.assigned_to_id);
      if (!userInfo) return;

      events.push({
        id: `quest-${quest.id}`,
        type: "QUEST_COMPLETED",
        timestamp: quest.completed_at,
        characterName: userInfo.characterName,
        displayName: userInfo.displayName,
        userId: quest.assigned_to_id,
        questTitle: quest.title,
        questId: quest.id,
      });
    });

    // Fetch recent submitted quests (pending approval)
    const { data: submittedQuests, error: submittedError } = await supabase
      .from("quest_instances")
      .select("id, title, assigned_to_id, updated_at, status")
      .eq("family_id", familyId)
      .eq("status", "SUBMITTED")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (submittedError) {
      throw new Error(`Failed to fetch submitted quests: ${submittedError.message}`);
    }

    // Add quest submitted events
    submittedQuests?.forEach((quest) => {
      if (!quest.updated_at || !quest.assigned_to_id) return;

      const userInfo = userCharacterMap.get(quest.assigned_to_id);
      if (!userInfo) return;

      events.push({
        id: `quest-submitted-${quest.id}`,
        type: "QUEST_SUBMITTED",
        timestamp: quest.updated_at,
        characterName: userInfo.characterName,
        displayName: userInfo.displayName,
        userId: quest.assigned_to_id,
        questTitle: quest.title,
        questId: quest.id,
      });
    });

    // Fetch recent reward redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select("id, user_id, reward_name, status, requested_at, approved_at")
      .in("user_id", familyMembers?.map((m) => m.id) || [])
      .order("requested_at", { ascending: false })
      .limit(limit);

    if (redemptionsError) {
      throw new Error(`Failed to fetch redemptions: ${redemptionsError.message}`);
    }

    // Add reward redemption events
    redemptions?.forEach((redemption) => {
      const userInfo = userCharacterMap.get(redemption.user_id);
      if (!userInfo) return;

      // Add redemption request event
      if (redemption.requested_at) {
        events.push({
          id: `redemption-${redemption.id}`,
          type: "REWARD_REDEEMED",
          timestamp: redemption.requested_at,
          characterName: userInfo.characterName,
          displayName: userInfo.displayName,
          userId: redemption.user_id,
          rewardName: redemption.reward_name,
          redemptionId: redemption.id,
        });
      }

      // Add approval/denial event if applicable
      if (redemption.approved_at && redemption.status === "APPROVED") {
        events.push({
          id: `redemption-approved-${redemption.id}`,
          type: "REWARD_APPROVED",
          timestamp: redemption.approved_at,
          characterName: userInfo.characterName,
          displayName: userInfo.displayName,
          userId: redemption.user_id,
          rewardName: redemption.reward_name,
          redemptionId: redemption.id,
        });
      } else if (redemption.approved_at && redemption.status === "DENIED") {
        events.push({
          id: `redemption-denied-${redemption.id}`,
          type: "REWARD_DENIED",
          timestamp: redemption.approved_at,
          characterName: userInfo.characterName,
          displayName: userInfo.displayName,
          userId: redemption.user_id,
          rewardName: redemption.reward_name,
          redemptionId: redemption.id,
        });
      }
    });

    // Add character creation events (within last 30 days for relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    familyMembers?.forEach((member) => {
      const character = Array.isArray(member.characters)
        ? member.characters[0]
        : member.characters;

      if (
        character?.created_at &&
        new Date(character.created_at) >= thirtyDaysAgo
      ) {
        events.push({
          id: `character-created-${member.id}`,
          type: "CHARACTER_CREATED",
          timestamp: character.created_at,
          characterName: character.name || "Unknown",
          displayName: member.display_name || "Unknown",
          userId: member.id,
        });
      }
    });

    // Note: Level-up events would require tracking level changes in a separate
    // transactions or level_history table. For now, we skip this type.
    // This can be added in the future when level-up tracking is implemented.

    // Sort all events by timestamp (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to the requested number of events
    return events.slice(0, limit);
  }
}
