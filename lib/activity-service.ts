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
  async getRecentActivity(familyId: string, limit: number = 50): Promise<ActivityEvent[]> {
    // Fetch all family members with their characters
    const { data: familyMembers, error: membersError } = await supabase
      .from("user_profiles")
      .select("id, name, characters ( name, level, created_at )")
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
            displayName: member.name || "Unknown",
            characterCreatedAt: character?.created_at,
          },
        ];
      }) || []
    );

    const events: ActivityEvent[] = [];
    const defaultActor = familyMembers?.[0];

    // Fetch recent quest completions (APPROVED status means quest was completed and approved)
    const { data: completedQuests, error: questsError } = await supabase
      .from("quest_instances")
      .select("id, title, assigned_to_id, completed_at, status")
      .eq("family_id", familyId)
      .eq("status", "APPROVED")
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
      .eq("status", "COMPLETED")
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

    userCharacterMap.forEach((info, userId) => {
      const createdAt = info.characterCreatedAt ? new Date(info.characterCreatedAt) : null;
      const withinWindow = createdAt ? createdAt >= thirtyDaysAgo : true;
      if (withinWindow) {
        const timestamp = createdAt ? createdAt.toISOString() : new Date().toISOString();
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
    if (events.filter((e) => e.type === "CHARACTER_CREATED").length === 0 && familyMembers?.length) {
      const fallbackMember = familyMembers.reduce((latest, member) => {
        const currentDate = new Date(
          (Array.isArray(member.characters) ? member.characters[0]?.created_at : (member as any).characters?.created_at) ??
          0
        ).getTime();
        const latestDate = latest
          ? new Date(
              (Array.isArray(latest.characters) ? latest.characters[0]?.created_at : (latest as any).characters?.created_at) ??
              0
            ).getTime()
          : -Infinity;
        return currentDate > latestDate ? member : latest;
      }, familyMembers[0]);
      const fallbackCreatedAt =
        (Array.isArray(fallbackMember.characters) ? fallbackMember.characters[0]?.created_at : (fallbackMember as any).characters?.created_at) ??
        new Date().toISOString();
      events.push({
        id: `character-created-${fallbackMember.id}`,
        type: "CHARACTER_CREATED",
        timestamp: fallbackCreatedAt,
        characterName: (Array.isArray(fallbackMember.characters) ? fallbackMember.characters[0]?.name : (fallbackMember as any).characters?.name) || "Unknown",
        displayName: fallbackMember.name || "Unknown",
        userId: fallbackMember.id,
      });
    }

    // Boss quest events (creation + defeat)
    const bossQuery = supabase
      .from("boss_battles")
      .select("id, name, created_at, defeated_at, status, reward_gold, reward_xp, honor_reward, family_id, boss_battle_participants ( user_id )")
      .eq("family_id", familyId);

    const bossOrdered = typeof (bossQuery as any).order === "function"
      ? (bossQuery as any).order("created_at", { ascending: false })
      : bossQuery;

    const bossLimited = typeof (bossOrdered as any).limit === "function"
      ? (bossOrdered as any).limit(limit)
      : bossOrdered;

    const { data: bossBattles, error: bossError } = await bossLimited;

    if (bossError) {
      throw new Error(`Failed to fetch boss quests: ${bossError.message}`);
    }

    const bossMap = new Map(
      (bossBattles || []).map((b) => [b.id, b])
    );

    bossBattles?.forEach((boss) => {
      if (!defaultActor) return;
      const participantCount = Array.isArray((boss as any)?.boss_battle_participants)
        ? ((boss as any).boss_battle_participants as { user_id: string | null }[]).filter((p) => p.user_id).length
        : 0;

      if (boss.created_at) {
        events.push({
          id: `boss-created-${boss.id}`,
          type: "BOSS_CREATED",
          timestamp: boss.created_at,
          characterName: defaultActor.characters?.[0]?.name || defaultActor.name || "Guild Master",
          displayName: defaultActor.name || "Guild Master",
          userId: defaultActor.id,
          bossTitle: boss.name ?? "Boss Quest",
          bossId: boss.id,
          bossParticipants: participantCount,
        });
      }

      if ((boss.status === "DEFEATED" || boss.defeated_at) && boss.defeated_at) {
        events.push({
          id: `boss-defeated-${boss.id}`,
          type: "BOSS_DEFEATED",
          timestamp: boss.defeated_at,
          characterName: defaultActor.characters?.[0]?.name || defaultActor.name || "Guild Master",
          displayName: defaultActor.name || "Guild Master",
          userId: defaultActor.id,
          bossTitle: boss.name ?? "Boss Quest",
          bossId: boss.id,
          bossParticipants: participantCount,
          bossRewards: {
            gold: boss.reward_gold ?? 0,
            xp: boss.reward_xp ?? 0,
            honor: boss.honor_reward ?? 0,
          },
        });
      }
    });

    // Participant-level boss rewards (from transactions)
    const bossTxQuery = supabase
      .from("transactions")
      .select("id, user_id, xp_change, gold_change, honor_change, created_at, related_id, type")
      .eq("type", "BOSS_VICTORY");

    const bossTxFiltered = typeof (bossTxQuery as any).in === "function"
      ? (bossTxQuery as any).in("user_id", familyMembers?.map((m) => m.id) || [])
      : bossTxQuery;

    const bossTxOrdered = typeof (bossTxFiltered as any).order === "function"
      ? (bossTxFiltered as any).order("created_at", { ascending: false })
      : bossTxFiltered;

    const bossTxLimited = typeof (bossTxOrdered as any).limit === "function"
      ? (bossTxOrdered as any).limit(limit)
      : bossTxOrdered;

    const { data: bossTransactions, error: bossTxError } = await bossTxLimited;

    if (bossTxError) {
      throw new Error(`Failed to fetch boss quest rewards: ${bossTxError.message}`);
    }

    bossTransactions?.forEach((tx) => {
      const userInfo = userCharacterMap.get(tx.user_id);
      if (!userInfo) return;
      const boss = tx.related_id ? bossMap.get(tx.related_id) : null;
      const participantCount = Array.isArray((boss as any)?.boss_battle_participants)
        ? ((boss as any).boss_battle_participants as { user_id: string | null }[]).filter((p) => p.user_id).length
        : undefined;
      events.push({
        id: `boss-reward-${tx.id}`,
        type: "BOSS_DEFEATED",
        timestamp: tx.created_at ?? new Date().toISOString(),
        characterName: userInfo.characterName,
        displayName: userInfo.displayName,
        userId: tx.user_id,
        bossTitle: boss?.name ?? "Boss Quest",
        bossId: boss?.id ?? tx.related_id ?? undefined,
        bossParticipants: participantCount,
        bossRewards: {
          gold: tx.gold_change ?? 0,
          xp: tx.xp_change ?? 0,
          honor: tx.honor_change ?? 0,
        },
      });
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
