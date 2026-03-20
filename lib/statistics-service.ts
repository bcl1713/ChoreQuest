/**
 * Statistics Service
 * Calculates and aggregates family statistics for the admin dashboard
 */

import { supabase } from "@/lib/supabase";
import { calculateBossBattleSummary } from "./statistics/boss-battles";
import { getStartOfMonth, getStartOfWeek } from "./statistics/time-windows";
import type { FamilyStatistics } from "./statistics/types";

export type { FamilyStatistics };

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
    const startOfThisWeek = getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const startOfThisMonth = getStartOfMonth(now);
    const startOfLastMonth = getStartOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );

    // Fetch all family members with character data in one query
    const { data: familyMembers, error: membersError } = await supabase
      .from("user_profiles")
      .select(
        `
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
      `,
      )
      .eq("family_id", familyId);

    if (membersError) {
      throw new Error(
        `Failed to fetch family members: ${membersError.message}`,
      );
    }

    // Fetch all completed quests for the family
    const { data: completedQuests, error: questsError } = await supabase
      .from("quest_instances")
      .select("id, status, assigned_to_id, completed_at, approved_at")
      .eq("family_id", familyId)
      .eq("status", "APPROVED");

    if (questsError) {
      throw new Error(
        `Failed to fetch completed quests: ${questsError.message}`,
      );
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
      throw new Error(
        `Failed to fetch pending quests: ${pendingQuestsError.message}`,
      );
    }

    // Fetch pending reward redemptions
    const { data: pendingRedemptions, error: pendingRedemptionsError } =
      await supabase
        .from("reward_redemptions")
        .select("id, user_id")
        .eq("status", "PENDING")
        .in("user_id", familyMembers?.map((m) => m.id) || []);

    if (pendingRedemptionsError) {
      throw new Error(
        `Failed to fetch pending redemptions: ${pendingRedemptionsError.message}`,
      );
    }

    // Fetch reward redemptions for statistics
    const { data: allRedemptions, error: redemptionsError } = await supabase
      .from("reward_redemptions")
      .select("id, requested_at, user_id")
      .in("user_id", familyMembers?.map((m) => m.id) || []);

    if (redemptionsError) {
      throw new Error(
        `Failed to fetch redemptions: ${redemptionsError.message}`,
      );
    }

    // Fetch boss battles for the family
    const { data: bossBattles, error: bossBattlesError } = await supabase
      .from("boss_battles")
      .select(
        "id, defeated_at, reward_gold, reward_xp, status, rewards_distributed, family_id",
      )
      .eq("family_id", familyId)
      .eq("status", "DEFEATED");

    if (bossBattlesError) {
      throw new Error(
        `Failed to fetch boss battles: ${bossBattlesError.message}`,
      );
    }

    // Calculate quest statistics by time period
    const questsThisWeek =
      completedQuests?.filter(
        (q) => q.completed_at && new Date(q.completed_at) >= startOfThisWeek,
      ).length || 0;

    const questsLastWeek =
      completedQuests?.filter(
        (q) =>
          q.completed_at &&
          new Date(q.completed_at) >= startOfLastWeek &&
          new Date(q.completed_at) < startOfThisWeek,
      ).length || 0;

    const questsThisMonth =
      completedQuests?.filter(
        (q) => q.completed_at && new Date(q.completed_at) >= startOfThisMonth,
      ).length || 0;

    const questsLastMonth =
      completedQuests?.filter(
        (q) =>
          q.completed_at &&
          new Date(q.completed_at) >= startOfLastMonth &&
          new Date(q.completed_at) < startOfThisMonth,
      ).length || 0;

    // Calculate redemption statistics by time period
    const redemptionsThisWeek =
      allRedemptions?.filter(
        (r) => r.requested_at && new Date(r.requested_at) >= startOfThisWeek,
      ).length || 0;

    const redemptionsThisMonth =
      allRedemptions?.filter(
        (r) => r.requested_at && new Date(r.requested_at) >= startOfThisMonth,
      ).length || 0;

    // Boss battle summary
    const bossBattleSummary = await calculateBossBattleSummary({
      bossBattles: bossBattles || [],
      familyMembers: familyMembers || [],
      startOfThisWeek,
      startOfThisMonth,
    });

    // Calculate total family gold and XP
    const totalGold =
      familyMembers?.reduce((sum, member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        return sum + (character?.gold || 0);
      }, 0) || 0;

    const totalXp =
      familyMembers?.reduce((sum, member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        return sum + (character?.xp || 0);
      }, 0) || 0;

    const totalGems =
      familyMembers?.reduce((sum, member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        return sum + (character?.gems || 0);
      }, 0) || 0;

    const totalHonor =
      familyMembers?.reduce((sum, member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        return sum + (character?.honor_points || 0);
      }, 0) || 0;

    // Calculate per-character progress and completion rates
    const characterProgress =
      familyMembers?.map((member) => {
        const character = Array.isArray(member.characters)
          ? member.characters[0]
          : member.characters;
        const userId = member.id;

        // Count completed quests for this user
        const userCompletedQuests =
          completedQuests?.filter((q) => q.assigned_to_id === userId).length ||
          0;

        // Count all assigned quests (in progress, submitted, completed)
        const userAllQuests =
          allQuests?.filter((q) => q.assigned_to_id === userId).length || 0;

        // Calculate completion rate
        const completionRate =
          userAllQuests > 0
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
    const mostActiveMember =
      characterProgress.length > 0
        ? characterProgress.reduce((prev, current) =>
            current.questsCompleted > prev.questsCompleted ? current : prev,
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
      mostActiveMember: mostActiveMember
        ? {
            userId: mostActiveMember.userId,
            characterName: mostActiveMember.characterName,
            displayName: mostActiveMember.displayName,
            questsCompleted: mostActiveMember.questsCompleted,
          }
        : null,
      pendingQuestApprovals: pendingQuests?.length || 0,
      pendingRewardRedemptions: pendingRedemptions?.length || 0,
      rewardRedemptionsThisWeek: redemptionsThisWeek,
      rewardRedemptionsThisMonth: redemptionsThisMonth,
      bossBattleSummary,
    };
  }
}
