/**
 * Statistics Service
 * Calculates and aggregates family statistics for the admin dashboard
 */

import { supabase } from "@/lib/supabase";
import { RewardCalculator } from "@/lib/reward-calculator";
import type { CharacterClass } from "@/lib/types/database";

export interface FamilyStatistics {
  // Quest statistics
  questsCompletedThisWeek: number;
  questsCompletedThisMonth: number;
  questsCompletedLastWeek: number;
  questsCompletedLastMonth: number;

  // Family totals
  totalGoldEarned: number;
  totalXpEarned: number;
  totalGemsEarned: number;
  totalHonorEarned: number;

  // Character progress
  characterProgress: {
    userId: string;
    characterName: string;
    displayName: string;
    level: number;
    xp: number;
    gold: number;
    gems: number;
    honor: number;
    questsCompleted: number;
    completionRate: number; // Percentage of assigned quests completed
  }[];

  // Most active member
  mostActiveMember: {
    userId: string;
    characterName: string;
    displayName: string;
    questsCompleted: number;
  } | null;

  // Pending approvals
  pendingQuestApprovals: number;
  pendingRewardRedemptions: number;

  // Reward redemption statistics
  rewardRedemptionsThisWeek: number;
  rewardRedemptionsThisMonth: number;

  // Boss battle summary
  bossBattleSummary: {
    battlesThisWeek: number;
    battlesThisMonth: number;
    topParticipantWeek: TopBossParticipant | null;
    topParticipantMonth: TopBossParticipant | null;
  };
}

export interface TopBossParticipant {
  userId: string;
  displayName: string;
  characterName: string;
  participationScore: number;
  totalXp: number;
  totalGold: number;
}

export class StatisticsService {
  /**
   * Get comprehensive family statistics for the admin dashboard
   * Optimized to minimize database queries and avoid N+1 problems
   * @param familyId - The family ID to calculate statistics for
   * @returns Complete family statistics object
   */
  async getFamilyStatistics(familyId: string): Promise<FamilyStatistics> {
    // Calculate date ranges
    const now = new Date();
    const startOfThisWeek = this.getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const startOfThisMonth = this.getStartOfMonth(now);
    const startOfLastMonth = this.getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    // Fetch all family members with character data in one query
    const { data: familyMembers, error: membersError } = await supabase
      .from("user_profiles")
      .select(`
        id,
        name,
        characters (
          name,
          level,
          xp,
          gold,
          gems,
          honor_points,
          class
        )
      `)
      .eq("family_id", familyId);

    if (membersError) {
      throw new Error(`Failed to fetch family members: ${membersError.message}`);
    }

    // Fetch all completed quests for the family
    const { data: completedQuests, error: questsError } = await supabase
      .from("quest_instances")
      .select("id, status, assigned_to_id, completed_at, approved_at")
      .eq("family_id", familyId)
      .eq("status", "APPROVED");

    if (questsError) {
      throw new Error(`Failed to fetch completed quests: ${questsError.message}`);
    }

    // Fetch all quest instances (for completion rate calculation)
    const { data: allQuests, error: allQuestsError } = await supabase
      .from("quest_instances")
      .select("id, status, assigned_to_id")
      .eq("family_id", familyId)
      .in("status", ["IN_PROGRESS", "COMPLETED", "APPROVED"]);

    if (allQuestsError) {
      throw new Error(`Failed to fetch all quests: ${allQuestsError.message}`);
    }

    // Fetch pending approvals
    const { data: pendingQuests, error: pendingQuestsError } = await supabase
      .from("quest_instances")
      .select("id")
      .eq("family_id", familyId)
      .eq("status", "COMPLETED");

    if (pendingQuestsError) {
      throw new Error(`Failed to fetch pending quests: ${pendingQuestsError.message}`);
    }

    // Fetch pending reward redemptions
    const { data: pendingRedemptions, error: pendingRedemptionsError } = await supabase
      .from("reward_redemptions")
      .select("id, user_id")
      .eq("status", "PENDING")
      .in("user_id", familyMembers?.map(m => m.id) || []);

    if (pendingRedemptionsError) {
      throw new Error(`Failed to fetch pending redemptions: ${pendingRedemptionsError.message}`);
    }

    // Fetch reward redemptions for statistics
    const { data: allRedemptions, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select("id, requested_at, user_id")
      .in("user_id", familyMembers?.map(m => m.id) || []);

    if (redemptionsError) {
      throw new Error(`Failed to fetch redemptions: ${redemptionsError.message}`);
    }

    // Fetch boss battles for the family
    const { data: bossBattles, error: bossBattlesError } = await supabase
      .from("boss_battles")
      .select("id, defeated_at, reward_gold, reward_xp, status, rewards_distributed, family_id")
      .eq("family_id", familyId)
      .eq("status", "DEFEATED");

    if (bossBattlesError) {
      throw new Error(`Failed to fetch boss battles: ${bossBattlesError.message}`);
    }

    // Calculate quest statistics by time period
    const questsThisWeek = completedQuests?.filter(q =>
      q.completed_at && new Date(q.completed_at) >= startOfThisWeek
    ).length || 0;

    const questsLastWeek = completedQuests?.filter(q =>
      q.completed_at &&
      new Date(q.completed_at) >= startOfLastWeek &&
      new Date(q.completed_at) < startOfThisWeek
    ).length || 0;

    const questsThisMonth = completedQuests?.filter(q =>
      q.completed_at && new Date(q.completed_at) >= startOfThisMonth
    ).length || 0;

    const questsLastMonth = completedQuests?.filter(q =>
      q.completed_at &&
      new Date(q.completed_at) >= startOfLastMonth &&
      new Date(q.completed_at) < startOfThisMonth
    ).length || 0;

    // Calculate redemption statistics by time period
    const redemptionsThisWeek = allRedemptions?.filter(r =>
      r.requested_at && new Date(r.requested_at) >= startOfThisWeek
    ).length || 0;

    const redemptionsThisMonth = allRedemptions?.filter(r =>
      r.requested_at && new Date(r.requested_at) >= startOfThisMonth
    ).length || 0;

    // Boss battle summary
    const bossBattleSummary = await this.calculateBossBattleSummary({
      bossBattles: bossBattles || [],
      familyMembers: familyMembers || [],
      startOfThisWeek,
      startOfThisMonth,
    });

    // Calculate total family gold and XP
    const totalGold = familyMembers?.reduce((sum, member) => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      return sum + (character?.gold || 0);
    }, 0) || 0;

    const totalXp = familyMembers?.reduce((sum, member) => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      return sum + (character?.xp || 0);
    }, 0) || 0;

    const totalGems = familyMembers?.reduce((sum, member) => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      return sum + (character?.gems || 0);
    }, 0) || 0;

    const totalHonor = familyMembers?.reduce((sum, member) => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      return sum + (character?.honor_points || 0);
    }, 0) || 0;

    // Calculate per-character progress and completion rates
    const characterProgress = familyMembers?.map(member => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      const userId = member.id;

      // Count completed quests for this user
      const userCompletedQuests = completedQuests?.filter(q => q.assigned_to_id === userId).length || 0;

      // Count all assigned quests (in progress, submitted, completed)
      const userAllQuests = allQuests?.filter(q => q.assigned_to_id === userId).length || 0;

      // Calculate completion rate
      const completionRate = userAllQuests > 0
        ? Math.round((userCompletedQuests / userAllQuests) * 100)
        : 0;

      return {
        userId,
        characterName: character?.name || "Unknown",
        displayName: member.name || "Unknown",
        level: character?.level || 1,
        xp: character?.xp || 0,
        gold: character?.gold || 0,
        gems: character?.gems || 0,
        honor: character?.honor_points || 0,
        questsCompleted: userCompletedQuests,
        completionRate,
      };
    }) || [];

    // Find most active member (by quest completions)
    const mostActiveMember = characterProgress.length > 0
      ? characterProgress.reduce((prev, current) =>
          current.questsCompleted > prev.questsCompleted ? current : prev
        )
      : null;

    return {
      questsCompletedThisWeek: questsThisWeek,
      questsCompletedThisMonth: questsThisMonth,
      questsCompletedLastWeek: questsLastWeek,
      questsCompletedLastMonth: questsLastMonth,
      totalGoldEarned: totalGold,
      totalXpEarned: totalXp,
      totalGemsEarned: totalGems,
      totalHonorEarned: totalHonor,
      characterProgress,
      mostActiveMember: mostActiveMember ? {
        userId: mostActiveMember.userId,
        characterName: mostActiveMember.characterName,
        displayName: mostActiveMember.displayName,
        questsCompleted: mostActiveMember.questsCompleted,
      } : null,
      pendingQuestApprovals: pendingQuests?.length || 0,
      pendingRewardRedemptions: pendingRedemptions?.length || 0,
      rewardRedemptionsThisWeek: redemptionsThisWeek,
      rewardRedemptionsThisMonth: redemptionsThisMonth,
      bossBattleSummary,
    };
  }

  /**
   * Get the start of the week (Sunday at 00:00:00)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async calculateBossBattleSummary({
    bossBattles,
    familyMembers,
    startOfThisWeek,
    startOfThisMonth,
  }: {
    bossBattles: Array<{
      id: string;
      defeated_at?: string | null;
      reward_gold?: number | null;
      reward_xp?: number | null;
      rewards_distributed?: boolean | null;
    }>;
    familyMembers: Array<{
      id: string;
      name: string | null;
      characters: any;
    }>;
    startOfThisWeek: Date;
    startOfThisMonth: Date;
  }): Promise<FamilyStatistics["bossBattleSummary"]> {
    const defeatedBattles = (bossBattles || []).filter(
      (battle) => battle.rewards_distributed && battle.defeated_at
    );

    const battlesThisWeek = defeatedBattles.filter(
      (battle) => battle.defeated_at && new Date(battle.defeated_at) >= startOfThisWeek
    );

    const battlesThisMonth = defeatedBattles.filter(
      (battle) => battle.defeated_at && new Date(battle.defeated_at) >= startOfThisMonth
    );

    const relevantBattleIds = Array.from(
      new Set([...battlesThisWeek, ...battlesThisMonth].map((battle) => battle.id))
    );

    let participants:
      | {
          boss_battle_id: string | null;
          user_id: string | null;
          participation_status: string | null;
          awarded_gold: number | null;
          awarded_xp: number | null;
        }[]
      | [] = [];

    if (relevantBattleIds.length > 0) {
      const { data: participantsData, error: participantsError } = await supabase
        .from("boss_battle_participants")
        .select("boss_battle_id, user_id, participation_status, awarded_gold, awarded_xp")
        .in("boss_battle_id", relevantBattleIds);

      if (participantsError) {
        throw new Error(`Failed to fetch boss battle participants: ${participantsError.message}`);
      }

      participants = participantsData || [];
    }

    const memberMap = new Map<
      string,
      { displayName: string; characterName: string; characterClass: CharacterClass | null }
    >();

    familyMembers.forEach((member) => {
      const character = Array.isArray(member.characters) ? member.characters[0] : member.characters;
      if (!member.id) return;
      memberMap.set(member.id, {
        displayName: member.name || "Unknown",
        characterName: character?.name || "Unknown",
        characterClass: (character?.class as CharacterClass | null) ?? null,
      });
    });

    const battleMap = new Map<
      string,
      { reward_gold?: number | null; reward_xp?: number | null }
    >();
    defeatedBattles.forEach((battle) => {
      battleMap.set(battle.id, {
        reward_gold: battle.reward_gold,
        reward_xp: battle.reward_xp,
      });
    });

    const topParticipantWeek = this.getTopBossParticipant(
      participants,
      battleMap,
      memberMap,
      new Set(battlesThisWeek.map((b) => b.id))
    );

    const topParticipantMonth = this.getTopBossParticipant(
      participants,
      battleMap,
      memberMap,
      new Set(battlesThisMonth.map((b) => b.id))
    );

    return {
      battlesThisWeek: battlesThisWeek.length,
      battlesThisMonth: battlesThisMonth.length,
      topParticipantWeek,
      topParticipantMonth,
    };
  }

  private getTopBossParticipant(
    participants: {
      boss_battle_id: string | null;
      user_id: string | null;
      participation_status: string | null;
      awarded_gold: number | null;
      awarded_xp: number | null;
    }[],
    battleMap: Map<string, { reward_gold?: number | null; reward_xp?: number | null }>,
    memberMap: Map<string, { displayName: string; characterName: string; characterClass: CharacterClass | null }>,
    includedBattleIds: Set<string>
  ): TopBossParticipant | null {
    if (participants.length === 0 || includedBattleIds.size === 0) {
      return null;
    }

    const totals = new Map<
      string,
      { score: number; totalXp: number; totalGold: number }
    >();

    participants.forEach((participant) => {
      const battleId = participant.boss_battle_id || "";
      const userId = participant.user_id || "";

      if (!battleId || !userId || !includedBattleIds.has(battleId)) {
        return;
      }

      const battle = battleMap.get(battleId);
      const member = memberMap.get(userId);

      if (!battle || !member) {
        return;
      }

      const fullRewards = this.getFullBossRewards(battle, member.characterClass);
      const score = this.getParticipationScore(
        participant.participation_status,
        participant.awarded_xp || 0,
        participant.awarded_gold || 0,
        fullRewards
      );

      const current = totals.get(userId) || { score: 0, totalXp: 0, totalGold: 0 };

      totals.set(userId, {
        score: current.score + score,
        totalXp: current.totalXp + (participant.awarded_xp || 0),
        totalGold: current.totalGold + (participant.awarded_gold || 0),
      });
    });

    let top: TopBossParticipant | null = null;

    totals.forEach((value, userId) => {
      const member = memberMap.get(userId);
      if (!member) return;

      const candidate: TopBossParticipant = {
        userId,
        displayName: member.displayName,
        characterName: member.characterName,
        participationScore: Number(value.score.toFixed(2)),
        totalXp: value.totalXp,
        totalGold: value.totalGold,
      };

      if (!top || this.isBetterParticipant(candidate, top)) {
        top = candidate;
      }
    });

    return top;
  }

  private getParticipationScore(
    rawStatus: string | null,
    awardedXp: number,
    awardedGold: number,
    fullRewards: { xp: number; gold: number }
  ): number {
    const status = (rawStatus || "").toUpperCase();

    if (status === "APPROVED") {
      return 1;
    }

    if (status === "PARTIAL") {
      const xpFraction = fullRewards.xp > 0 ? awardedXp / fullRewards.xp : 0;
      const goldFraction = fullRewards.gold > 0 ? awardedGold / fullRewards.gold : 0;
      const average = (this.clampFraction(xpFraction) + this.clampFraction(goldFraction)) / 2;
      return this.clampFraction(average);
    }

    return 0;
  }

  private clampFraction(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  private getFullBossRewards(
    battle: { reward_gold?: number | null; reward_xp?: number | null },
    characterClass: CharacterClass | null
  ): { gold: number; xp: number } {
    const bonus = this.getClassBonusMultiplier(characterClass);
    const baseGold = battle.reward_gold ?? 0;
    const baseXp = battle.reward_xp ?? 0;

    return {
      gold: Math.floor(baseGold * bonus.goldBonus),
      xp: Math.floor(baseXp * bonus.xpBonus),
    };
  }

  private getClassBonusMultiplier(characterClass: CharacterClass | null | undefined) {
    if (!characterClass) {
      return { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };
    }

    const bonus = RewardCalculator.getClassBonus(characterClass);
    return bonus ?? { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };
  }

  private isBetterParticipant(candidate: TopBossParticipant, current: TopBossParticipant): boolean {
    if (candidate.participationScore !== current.participationScore) {
      return candidate.participationScore > current.participationScore;
    }

    if (candidate.totalXp !== current.totalXp) {
      return candidate.totalXp > current.totalXp;
    }

    if (candidate.totalGold !== current.totalGold) {
      return candidate.totalGold > current.totalGold;
    }

    return candidate.displayName.localeCompare(current.displayName) < 0;
  }

  /**
   * Get the start of the month (1st day at 00:00:00)
   */
  private getStartOfMonth(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
