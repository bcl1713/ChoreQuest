import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/database-generated";
import type { ActivityEvent } from "./activity-service";

type CharacterSummary = Pick<
  Database["public"]["Tables"]["characters"]["Row"],
  "name" | "level" | "created_at"
>;

export type UserProfileWithCharacters = Pick<
  Database["public"]["Tables"]["user_profiles"]["Row"],
  "id" | "name"
> & {
  characters: CharacterSummary[] | CharacterSummary | null;
};

type BossBattleParticipant = { user_id: string | null };

type BossBattleRow = Pick<
  Database["public"]["Tables"]["boss_battles"]["Row"],
  | "id"
  | "name"
  | "created_at"
  | "defeated_at"
  | "status"
  | "reward_gold"
  | "reward_xp"
  | "honor_reward"
>;

export type BossBattleWithParticipants = BossBattleRow & {
  boss_battle_participants: BossBattleParticipant[] | null;
};

type BossVictoryTransaction = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  | "id"
  | "user_id"
  | "xp_change"
  | "gold_change"
  | "honor_change"
  | "created_at"
  | "related_id"
  | "type"
>;

export type CharacterInfo = {
  characterName: string;
  displayName: string;
  characterCreatedAt?: string | null;
};

export const firstCharacter = (
  characters: UserProfileWithCharacters["characters"],
): CharacterSummary | null => {
  if (!characters) return null;
  return Array.isArray(characters) ? characters[0] : characters;
};

export const buildUserCharacterMap = (
  members: UserProfileWithCharacters[],
): Map<string, CharacterInfo> =>
  new Map(
    members.map((member) => {
      const character = firstCharacter(member.characters);
      return [
        member.id,
        {
          characterName: character?.name || "Unknown",
          displayName: member.name || "Unknown",
          characterCreatedAt: character?.created_at,
        },
      ];
    }),
  );

const characterCreatedAtMs = (member: UserProfileWithCharacters): number => {
  const createdAt = firstCharacter(member.characters)?.created_at;
  return createdAt ? new Date(createdAt).getTime() : -Infinity;
};

export const selectMostRecentMember = (
  members: UserProfileWithCharacters[],
): UserProfileWithCharacters | undefined =>
  members.reduce<UserProfileWithCharacters | undefined>((latest, member) => {
    if (!latest) return member;
    return characterCreatedAtMs(member) > characterCreatedAtMs(latest)
      ? member
      : latest;
  }, undefined);

const countParticipants = (boss: BossBattleWithParticipants): number =>
  (boss.boss_battle_participants || []).filter((p) => p.user_id).length;

export const buildBossQuestEvents = (
  bossBattles: BossBattleWithParticipants[],
  defaultActor?: UserProfileWithCharacters,
): ActivityEvent[] => {
  if (!defaultActor) return [];

  const defaultCharacter = firstCharacter(defaultActor.characters);
  const defaultCharacterName =
    defaultCharacter?.name || defaultActor.name || "Guild Master";
  const defaultDisplayName = defaultActor.name || "Guild Master";

  return bossBattles.flatMap((boss) => {
    const participantCount = countParticipants(boss);
    const events: ActivityEvent[] = [];

    if (boss.created_at) {
      events.push({
        id: `boss-created-${boss.id}`,
        type: "BOSS_CREATED",
        timestamp: boss.created_at,
        characterName: defaultCharacterName,
        displayName: defaultDisplayName,
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
        characterName: defaultCharacterName,
        displayName: defaultDisplayName,
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

    return events;
  });
};

export const buildBossTransactionEvents = (
  transactions: BossVictoryTransaction[],
  userCharacterMap: Map<string, CharacterInfo>,
  bossMap: Map<string, BossBattleWithParticipants>,
): ActivityEvent[] =>
  transactions.flatMap((tx) => {
    if (tx.type !== "BOSS_VICTORY") return [];
    if (!tx.user_id) return [];
    const userInfo = userCharacterMap.get(tx.user_id);
    if (!userInfo) return [];

    const boss = tx.related_id ? bossMap.get(tx.related_id) : undefined;
    const participantCount = boss ? countParticipants(boss) : undefined;

    return [
      {
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
      },
    ];
  });

export async function addQuestAndRewardEvents(
  familyId: string,
  limit: number,
  events: ActivityEvent[],
  userCharacterMap: Map<string, CharacterInfo>,
): Promise<void> {
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

  const { data: submittedQuests, error: submittedError } = await supabase
    .from("quest_instances")
    .select("id, title, assigned_to_id, updated_at, status")
    .eq("family_id", familyId)
    .eq("status", "COMPLETED")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (submittedError) {
    throw new Error(
      `Failed to fetch submitted quests: ${submittedError.message}`,
    );
  }

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

  const userIds = Array.from(userCharacterMap.keys());
  const { data: redemptions, error: redemptionsError } = await supabase
    .from("reward_redemptions")
    .select("id, user_id, reward_name, status, requested_at, approved_at")
    .in("user_id", userIds);

  if (redemptionsError) {
    throw new Error(`Failed to fetch redemptions: ${redemptionsError.message}`);
  }

  redemptions?.forEach((redemption) => {
    if (!redemption.user_id) return;
    const userInfo = userCharacterMap.get(redemption.user_id);
    if (!userInfo) return;
    if (redemption.requested_at) {
      events.push({
        id: `redemption-${redemption.id}`,
        type: "REWARD_REDEEMED",
        timestamp: redemption.requested_at,
        characterName: userInfo.characterName,
        displayName: userInfo.displayName,
        userId: redemption.user_id,
        rewardName: redemption.reward_name ?? undefined,
        redemptionId: redemption.id,
      });
    }
    if (redemption.approved_at && redemption.status === "APPROVED") {
      events.push({
        id: `redemption-approved-${redemption.id}`,
        type: "REWARD_APPROVED",
        timestamp: redemption.approved_at,
        characterName: userInfo.characterName,
        displayName: userInfo.displayName,
        userId: redemption.user_id,
        rewardName: redemption.reward_name ?? undefined,
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
        rewardName: redemption.reward_name ?? undefined,
        redemptionId: redemption.id,
      });
    }
  });
}
