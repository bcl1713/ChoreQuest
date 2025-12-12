import { RewardCalculator } from "@/lib/reward-calculator";
import type { CharacterClass } from "@/lib/types/database";

export type DecisionStatus = "APPROVED" | "PARTIAL" | "DENIED";

export type ParticipantDecision = {
  status: DecisionStatus;
  gold?: number;
  xp?: number;
  honor?: number;
};

export type AppliedDecision = {
  status: DecisionStatus;
  gold: number;
  xp: number;
  honor: number;
};

export const resolveParticipantDecision = (
  participantId: string,
  decisionMap: Map<string, ParticipantDecision>,
  rewardGold: number,
  rewardXp: number,
  honorReward: number,
): AppliedDecision => {
  const rawDecision = decisionMap.get(participantId);
  const normalizedStatus = rawDecision?.status
    ? String(rawDecision.status).toUpperCase()
    : null;

  let status: DecisionStatus;
  if (normalizedStatus === "PARTIAL") {
    status = "PARTIAL";
  } else if (normalizedStatus === "DENIED") {
    status = "DENIED";
  } else {
    status = "APPROVED";
  }

  let appliedGold = rewardGold;
  let appliedXp = rewardXp;
  let appliedHonor = honorReward;

  if (status === "PARTIAL" && rawDecision) {
    appliedGold = Math.max(0, Math.floor(rawDecision.gold ?? rewardGold));
    appliedXp = Math.max(0, Math.floor(rawDecision.xp ?? rewardXp));
    appliedHonor = Math.max(0, Math.floor(rawDecision.honor ?? honorReward));
  } else if (status === "DENIED") {
    appliedGold = 0;
    appliedXp = 0;
    appliedHonor = 0;
  }

  return {
    status,
    gold: appliedGold,
    xp: appliedXp,
    honor: appliedHonor,
  };
};

export const applyClassBonusIfApproved = (
  decision: AppliedDecision,
  characterClass: CharacterClass | null,
): AppliedDecision => {
  if (decision.status !== "APPROVED") {
    return decision;
  }

  const bonus = characterClass
    ? RewardCalculator.getClassBonus(characterClass)
    : { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };

  return {
    ...decision,
    gold: Math.floor(decision.gold * bonus.goldBonus),
    xp: Math.floor(decision.xp * bonus.xpBonus),
    honor: Math.floor(decision.honor * bonus.honorBonus),
  };
};

export const buildCharacterRewardUpdate = (
  character: {
    gold?: number | null;
    xp?: number | null;
    honor_points?: number | null;
    level?: number | null;
  },
  rewards: { gold: number; xp: number; honor: number },
): { gold: number; xp: number; honor_points: number; level: number } => {
  const updatedGold = (character.gold || 0) + rewards.gold;
  const updatedXp = (character.xp || 0) + rewards.xp;
  const updatedHonor = (character.honor_points || 0) + rewards.honor;
  const derivedLevel = RewardCalculator.calculateLevelFromTotalXP(updatedXp);
  const currentLevel =
    Number.isFinite(character.level) && (character.level as number) > 0
      ? Math.floor(character.level as number)
      : 1;

  return {
    gold: updatedGold,
    xp: updatedXp,
    honor_points: updatedHonor,
    level: Math.max(currentLevel, derivedLevel),
  };
};

type DecisionInput = {
  userId?: string;
  status?: string;
  gold?: number;
  xp?: number;
  honor?: number;
};

export const buildDecisionMap = (
  decisions: unknown[],
): Map<string, ParticipantDecision> => {
  const decisionMap = new Map<string, ParticipantDecision>();

  (decisions as DecisionInput[]).forEach((decision) => {
    if (!decision || !decision.userId) return;
    const status =
      typeof decision.status === "string" ? decision.status.toUpperCase() : "";
    if (status === "APPROVED" || status === "PARTIAL" || status === "DENIED") {
      decisionMap.set(decision.userId, {
        status,
        gold: typeof decision.gold === "number" ? decision.gold : undefined,
        xp: typeof decision.xp === "number" ? decision.xp : undefined,
        honor: typeof decision.honor === "number" ? decision.honor : undefined,
      });
    }
  });

  return decisionMap;
};
