import { supabase } from "@/lib/supabase";
import { RewardCalculator } from "@/lib/reward-calculator";
import type { CharacterClass } from "@/lib/types/database";

export interface BossBattleSummary {
  battlesThisWeek: number;
  battlesThisMonth: number;
  topParticipantWeek: TopBossParticipant | null;
  topParticipantMonth: TopBossParticipant | null;
}

export interface TopBossParticipant {
  userId: string;
  displayName: string;
  characterName: string;
  participationScore: number;
  totalXp: number;
  totalGold: number;
}

type ParticipantRow = {
  boss_battle_id: string | null;
  user_id: string | null;
  participation_status: string | null;
  awarded_gold: number | null;
  awarded_xp: number | null;
};

type CharacterRow = {
  name?: string | null;
  class?: CharacterClass | null;
};

type MemberRow = {
  id: string;
  name: string | null;
  characters: CharacterRow | CharacterRow[] | null;
};

type BattleRow = {
  id: string;
  defeated_at?: string | null;
  reward_gold?: number | null;
  reward_xp?: number | null;
  rewards_distributed?: boolean | null;
};

export const calculateBossBattleSummary = async ({
  bossBattles,
  familyMembers,
  startOfThisWeek,
  startOfThisMonth,
}: {
  bossBattles: BattleRow[];
  familyMembers: MemberRow[];
  startOfThisWeek: Date;
  startOfThisMonth: Date;
}): Promise<BossBattleSummary> => {
  const defeatedBattles = bossBattles.filter(
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

  let participants: ParticipantRow[] = [];

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

  const battleMap = new Map<string, { reward_gold?: number | null; reward_xp?: number | null }>();
  defeatedBattles.forEach((battle) => {
    battleMap.set(battle.id, {
      reward_gold: battle.reward_gold,
      reward_xp: battle.reward_xp,
    });
  });

  const topParticipantWeek = getTopBossParticipant(
    participants,
    battleMap,
    memberMap,
    new Set(battlesThisWeek.map((b) => b.id))
  );

  const topParticipantMonth = getTopBossParticipant(
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
};

const getTopBossParticipant = (
  participants: ParticipantRow[],
  battleMap: Map<string, { reward_gold?: number | null; reward_xp?: number | null }>,
  memberMap: Map<string, { displayName: string; characterName: string; characterClass: CharacterClass | null }>,
  includedBattleIds: Set<string>
): TopBossParticipant | null => {
  if (participants.length === 0 || includedBattleIds.size === 0) {
    return null;
  }

  const totals = new Map<string, { score: number; totalXp: number; totalGold: number }>();

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

    const fullRewards = getFullBossRewards(battle, member.characterClass);
    const score = getParticipationScore(
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

    if (!top || isBetterParticipant(candidate, top)) {
      top = candidate;
    }
  });

  return top;
};

const getParticipationScore = (
  rawStatus: string | null,
  awardedXp: number,
  awardedGold: number,
  fullRewards: { xp: number; gold: number }
): number => {
  const status = (rawStatus || "").toUpperCase();

  if (status === "APPROVED") {
    return 1;
  }

  if (status === "PARTIAL") {
    const xpFraction = fullRewards.xp > 0 ? awardedXp / fullRewards.xp : 0;
    const goldFraction = fullRewards.gold > 0 ? awardedGold / fullRewards.gold : 0;
    const average = (clampFraction(xpFraction) + clampFraction(goldFraction)) / 2;
    return clampFraction(average);
  }

  return 0;
};

const clampFraction = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const getFullBossRewards = (
  battle: { reward_gold?: number | null; reward_xp?: number | null },
  characterClass: CharacterClass | null
): { gold: number; xp: number } => {
  const bonus = getClassBonusMultiplier(characterClass);
  const baseGold = battle.reward_gold ?? 0;
  const baseXp = battle.reward_xp ?? 0;

  return {
    gold: Math.floor(baseGold * bonus.goldBonus),
    xp: Math.floor(baseXp * bonus.xpBonus),
  };
};

const getClassBonusMultiplier = (characterClass: CharacterClass | null | undefined) => {
  if (!characterClass) {
    return { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };
  }

  const bonus = RewardCalculator.getClassBonus(characterClass);
  return bonus ?? { xpBonus: 1, goldBonus: 1, honorBonus: 1, gemsBonus: 1 };
};

const isBetterParticipant = (candidate: TopBossParticipant, current: TopBossParticipant): boolean => {
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
};
