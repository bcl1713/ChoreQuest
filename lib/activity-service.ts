/**
 * Activity Service
 * Fetches and aggregates family activity events for the admin dashboard
 */

import { supabase } from "@/lib/supabase";
import {
  addQuestAndRewardEvents,
  buildBossQuestEvents,
  buildBossTransactionEvents,
  buildUserCharacterMap,
  firstCharacter,
  selectMostRecentMember,
  type BossBattleWithParticipants,
  type UserProfileWithCharacters,
} from "./activity-service-helpers";

export type ActivityEventType =
  | "QUEST_COMPLETED"
  | "QUEST_SUBMITTED"
  | "REWARD_REDEEMED"
  | "REWARD_APPROVED"
  | "REWARD_DENIED"
  | "LEVEL_UP"
  | "CHARACTER_CREATED"
  | "BOSS_CREATED"
  | "BOSS_DEFEATED";

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

  // Boss quest fields
  bossTitle?: string;
  bossId?: string;
  bossParticipants?: number;
  bossRewards?: { gold: number; xp: number; honor: number };

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
  async getRecentActivity(
    familyId: string,
    limit: number = 50,
  ): Promise<ActivityEvent[]> {
    // Fetch all family members with their characters
    const { data: familyMembers, error: membersError } = await supabase
      .from("user_profiles")
      .select("id, name, characters ( name, level, created_at )")
      .eq("family_id", familyId);

    if (membersError) {
      throw new Error(
        `Failed to fetch family members: ${membersError.message}`,
      );
    }

    // Create a map of user IDs to character info for quick lookup
    const membersWithCharacters: UserProfileWithCharacters[] =
      familyMembers ?? [];

    const userCharacterMap = buildUserCharacterMap(membersWithCharacters);

    const events: ActivityEvent[] = [];
    const defaultActor = membersWithCharacters[0];

    // Add quest and reward events
    await addQuestAndRewardEvents(familyId, limit, events, userCharacterMap);

    // Add character creation events (within last 30 days for relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    userCharacterMap.forEach((info, userId) => {
      const createdAt = info.characterCreatedAt
        ? new Date(info.characterCreatedAt)
        : null;
      const withinWindow = createdAt ? createdAt >= thirtyDaysAgo : true;
      if (withinWindow) {
        const timestamp = createdAt
          ? createdAt.toISOString()
          : new Date().toISOString();
        events.push({
          id: `character-created-${userId}`,
          type: "CHARACTER_CREATED",
          timestamp,
          characterName: info.characterName || "Unknown",
          displayName: info.displayName || "Unknown",
          userId,
        });
      }
    });

    // Ensure at least one character entry is surfaced when family members exist
    if (
      events.filter((e) => e.type === "CHARACTER_CREATED").length === 0 &&
      membersWithCharacters.length
    ) {
      const fallbackMember = selectMostRecentMember(membersWithCharacters);
      const fallbackCharacter = fallbackMember
        ? firstCharacter(fallbackMember.characters)
        : null;
      const fallbackCreatedAt =
        fallbackCharacter?.created_at ?? new Date().toISOString();
      events.push({
        id: `character-created-${fallbackMember?.id}`,
        type: "CHARACTER_CREATED",
        timestamp: fallbackCreatedAt,
        characterName: fallbackCharacter?.name || "Unknown",
        displayName: fallbackMember?.name || "Unknown",
        userId: fallbackMember?.id || "unknown",
      });
    }

    // Boss quest events (creation + defeat)
    const { data: bossBattles, error: bossError } = await supabase
      .from("boss_battles")
      .select(
        "id, name, created_at, defeated_at, status, reward_gold, reward_xp, honor_reward, family_id, boss_battle_participants ( user_id )",
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (bossError) {
      throw new Error(`Failed to fetch boss quests: ${bossError.message}`);
    }

    const typedBossBattles: BossBattleWithParticipants[] = bossBattles ?? [];
    const bossMap = new Map(typedBossBattles.map((b) => [b.id, b]));

    events.push(...buildBossQuestEvents(typedBossBattles, defaultActor));

    const { data: bossTransactions, error: bossTxError } = await supabase
      .from("transactions")
      .select(
        "id, user_id, xp_change, gold_change, honor_change, created_at, related_id, type",
      )
      .eq("type", "BOSS_VICTORY")
      .in(
        "user_id",
        membersWithCharacters.map((m) => m.id),
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (bossTxError) {
      throw new Error(
        `Failed to fetch boss quest rewards: ${bossTxError.message}`,
      );
    }

    events.push(
      ...buildBossTransactionEvents(
        bossTransactions ?? [],
        userCharacterMap,
        bossMap,
      ),
    );

    // Note: Level-up events would require tracking level changes in a separate
    // transactions or level_history table. For now, we skip this type.
    // This can be added in the future when level-up tracking is implemented.

    // Sort all events by timestamp (most recent first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Limit to the requested number of events
    return events.slice(0, limit);
  }
}
