import type { TopBossParticipant } from "./boss-battles";

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
