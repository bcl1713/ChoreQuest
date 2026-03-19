import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

// ─── Event types ────────────────────────────────────────────────────────────

export type AchievementEventType =
  | "QUEST_APPROVED"
  | "REWARD_APPROVED"
  | "BOSS_COMPLETED";

export type AchievementEvent = {
  type: AchievementEventType;
};

// ─── Evaluator function signature ───────────────────────────────────────────

export type CriteriaConfig = {
  threshold?: number;
  difficulty?: string;
  [key: string]: unknown;
};

export type EvaluatorFn = (
  client: SupabaseClient<Database>,
  characterId: string,
  userId: string,
  criteriaConfig?: CriteriaConfig,
) => Promise<{ current: number }>;

// ─── Event → criteria-type mapping ──────────────────────────────────────────

export const EVENT_CRITERIA_MAP: Record<AchievementEventType, string[]> = {
  QUEST_APPROVED: [
    "quest_complete",
    "quest_volunteer",
    "quest_difficulty",
    "gold_earned",
    "xp_earned",
    "level_reached",
    "streak_reached",
  ],
  REWARD_APPROVED: ["gold_spent", "reward_redeemed"],
  BOSS_COMPLETED: [
    "boss_defeated",
    "boss_participated",
    "gold_earned",
    "xp_earned",
    "level_reached",
  ],
};

export const ALL_CRITERIA_TYPES = [
  "quest_complete",
  "quest_volunteer",
  "quest_difficulty",
  "boss_defeated",
  "boss_participated",
  "gold_earned",
  "gold_spent",
  "reward_redeemed",
  "xp_earned",
  "level_reached",
  "streak_reached",
  "class_change",
  "honor_earned",
] as const;

// ─── Evaluators ──────────────────────────────────────────────────────────────

const evaluateQuestComplete: EvaluatorFn = async (
  client,
  characterId,
  userId,
) => {
  const { count, error } = await client
    .from("quest_instances")
    .select("*", { count: "exact", head: true })
    .eq("status", "APPROVED")
    .or(`assigned_to_id.eq.${userId},volunteered_by.eq.${characterId}`);

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateQuestVolunteer: EvaluatorFn = async (client, characterId) => {
  const { count, error } = await client
    .from("quest_instances")
    .select("*", { count: "exact", head: true })
    .eq("volunteered_by", characterId)
    .eq("status", "APPROVED");

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateQuestDifficulty: EvaluatorFn = async (
  client,
  characterId,
  userId,
  criteriaConfig,
) => {
  const difficulty = criteriaConfig?.difficulty;
  if (!difficulty) return { current: 0 };

  const { count, error } = await client
    .from("quest_instances")
    .select("*", { count: "exact", head: true })
    .eq("status", "APPROVED")
    .eq("difficulty", difficulty as "EASY" | "MEDIUM" | "HARD")
    .or(`assigned_to_id.eq.${userId},volunteered_by.eq.${characterId}`);

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateBossDefeated: EvaluatorFn = async (
  client,
  _characterId,
  userId,
) => {
  const { count, error } = await client
    .from("boss_battle_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("participation_status", "APPROVED");

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateBossParticipated: EvaluatorFn = async (
  client,
  _characterId,
  userId,
) => {
  const { count, error } = await client
    .from("boss_battle_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateGoldEarned: EvaluatorFn = async (client, characterId, userId) => {
  // Quest base gold rewards (approved quests)
  const { data: questRows, error: questError } = await client
    .from("quest_instances")
    .select("gold_reward")
    .eq("status", "APPROVED")
    .or(`assigned_to_id.eq.${userId},volunteered_by.eq.${characterId}`);

  if (questError) throw questError;

  const questGold = (questRows ?? []).reduce(
    (sum, row) => sum + (row.gold_reward ?? 0),
    0,
  );

  // Boss battle gold rewards (approved participations)
  const { data: bossRows, error: bossError } = await client
    .from("boss_battle_participants")
    .select("awarded_gold")
    .eq("user_id", userId)
    .eq("participation_status", "APPROVED");

  if (bossError) throw bossError;

  const bossGold = (bossRows ?? []).reduce(
    (sum, row) => sum + (row.awarded_gold ?? 0),
    0,
  );

  return { current: questGold + bossGold };
};

const evaluateGoldSpent: EvaluatorFn = async (client, _characterId, userId) => {
  const { data, error } = await client
    .from("reward_redemptions")
    .select("cost")
    .eq("user_id", userId)
    .in("status", ["APPROVED", "FULFILLED"]);

  if (error) throw error;

  const total = (data ?? []).reduce((sum, row) => sum + (row.cost ?? 0), 0);
  return { current: total };
};

const evaluateRewardRedeemed: EvaluatorFn = async (
  client,
  _characterId,
  userId,
) => {
  const { count, error } = await client
    .from("reward_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["APPROVED", "FULFILLED"]);

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateXpEarned: EvaluatorFn = async (client, characterId) => {
  const { data, error } = await client
    .from("characters")
    .select("xp")
    .eq("id", characterId)
    .single();

  if (error) throw error;
  return { current: data?.xp ?? 0 };
};

const evaluateLevelReached: EvaluatorFn = async (client, characterId) => {
  const { data, error } = await client
    .from("characters")
    .select("level")
    .eq("id", characterId)
    .single();

  if (error) throw error;
  return { current: data?.level ?? 0 };
};

const evaluateStreakReached: EvaluatorFn = async (client, characterId) => {
  const { data, error } = await client
    .from("character_quest_streaks")
    .select("longest_streak")
    .eq("character_id", characterId);

  if (error) throw error;
  if (!data || data.length === 0) return { current: 0 };

  const maxStreak = Math.max(...data.map((row) => row.longest_streak ?? 0));
  return { current: maxStreak };
};

const evaluateClassChange: EvaluatorFn = async () => {
  // Backfill-only: no class change history table exists
  return { current: 0 };
};

const evaluateHonorEarned: EvaluatorFn = async (client, characterId) => {
  const { data, error } = await client
    .from("characters")
    .select("honor_points")
    .eq("id", characterId)
    .single();

  if (error) throw error;
  return { current: data?.honor_points ?? 0 };
};

// ─── Evaluator registry ──────────────────────────────────────────────────────

const EVALUATOR_REGISTRY: Record<string, EvaluatorFn> = {
  quest_complete: evaluateQuestComplete,
  quest_volunteer: evaluateQuestVolunteer,
  quest_difficulty: evaluateQuestDifficulty,
  boss_defeated: evaluateBossDefeated,
  boss_participated: evaluateBossParticipated,
  gold_earned: evaluateGoldEarned,
  gold_spent: evaluateGoldSpent,
  reward_redeemed: evaluateRewardRedeemed,
  xp_earned: evaluateXpEarned,
  level_reached: evaluateLevelReached,
  streak_reached: evaluateStreakReached,
  class_change: evaluateClassChange,
  honor_earned: evaluateHonorEarned,
};

// ─── Progress record returned by getProgress ────────────────────────────────

export type AchievementProgressRecord = {
  character_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: { current: number; threshold: number } | null;
  notified: boolean | null;
  achievement: {
    id: string;
    name: string;
    description: string;
    criteria_type: string;
    criteria_config: CriteriaConfig;
  };
};

// ─── Service class ───────────────────────────────────────────────────────────

export class AchievementProgressService {
  private readonly readClient: SupabaseClient<Database>;
  private readonly writeClient: SupabaseClient<Database>;

  constructor(readClient?: SupabaseClient<Database>) {
    this.writeClient = createServiceSupabaseClient();
    this.readClient = readClient ?? this.writeClient;
  }

  private async resolveCharacterContext(
    characterId: string,
  ): Promise<{ userId: string; familyId: string | null }> {
    const { data, error } = await this.readClient
      .from("characters")
      .select("user_id, user_profiles!characters_user_id_fkey(family_id)")
      .eq("id", characterId)
      .single();

    if (error || !data) {
      throw new Error(
        `Character not found: ${characterId}${error ? ` (${error.message})` : ""}`,
      );
    }

    if (!data.user_id) {
      throw new Error(`Character ${characterId} has no associated user`);
    }

    const userProfile = data.user_profiles as {
      family_id?: string | null;
    } | null;
    return {
      userId: data.user_id,
      familyId: userProfile?.family_id ?? null,
    };
  }

  private async fetchAchievements(familyId: string | null) {
    let query = this.readClient
      .from("achievements")
      .select("id, criteria_type, criteria_config");

    if (familyId) {
      query = query.eq("family_id", familyId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch achievements: ${error.message}`);
    }

    return data ?? [];
  }

  private async hasExistingProgress(characterId: string): Promise<boolean> {
    const { count, error } = await this.readClient
      .from("character_achievements")
      .select("*", { count: "exact", head: true })
      .eq("character_id", characterId);

    if (error) {
      throw new Error(`Failed to check progress: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async updateProgress(
    characterId: string,
    event: AchievementEvent,
  ): Promise<void> {
    const { userId, familyId } =
      await this.resolveCharacterContext(characterId);
    const achievements = await this.fetchAchievements(familyId);
    const hasProgress = await this.hasExistingProgress(characterId);

    const criteriaTypesToEvaluate = hasProgress
      ? (EVENT_CRITERIA_MAP[event.type] ?? [])
      : ALL_CRITERIA_TYPES.slice(); // full backfill

    // Warn about achievements with unrecognized criteria types
    for (const a of achievements) {
      if (!EVALUATOR_REGISTRY[a.criteria_type]) {
        console.warn(
          `Unknown criteria type: ${a.criteria_type} — skipping achievement ${a.id}`,
        );
      }
    }

    // Filter achievements to the relevant criteria types
    const relevantAchievements = achievements.filter(
      (a) =>
        criteriaTypesToEvaluate.includes(a.criteria_type) &&
        EVALUATOR_REGISTRY[a.criteria_type],
    );

    if (relevantAchievements.length === 0) return;

    // Run evaluators for each relevant achievement
    const upsertRows: {
      character_id: string;
      achievement_id: string;
      progress: { current: number; threshold: number };
    }[] = [];

    for (const achievement of relevantAchievements) {
      const evaluator = EVALUATOR_REGISTRY[achievement.criteria_type];
      if (!evaluator) {
        console.warn(
          `Unknown criteria type: ${achievement.criteria_type} — skipping achievement ${achievement.id}`,
        );
        continue;
      }

      const config = achievement.criteria_config as CriteriaConfig;
      const result = await evaluator(
        this.readClient,
        characterId,
        userId,
        config,
      );
      const threshold = config?.threshold ?? 0;

      upsertRows.push({
        character_id: characterId,
        achievement_id: achievement.id,
        progress: { current: result.current, threshold },
      });
    }

    if (upsertRows.length === 0) return;

    // Atomic batch upsert — writes only progress column, preserves unlocked_at
    const { error } = await this.writeClient
      .from("character_achievements")
      .upsert(upsertRows, {
        onConflict: "character_id,achievement_id",
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to upsert progress: ${error.message}`);
    }
  }

  async getProgress(characterId: string): Promise<AchievementProgressRecord[]> {
    const { data, error } = await this.readClient
      .from("character_achievements")
      .select(
        `
        character_id,
        achievement_id,
        unlocked_at,
        progress,
        notified,
        achievements (
          id,
          name,
          description,
          criteria_type,
          criteria_config
        )
      `,
      )
      .eq("character_id", characterId);

    if (error) {
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    if (!data) return [];

    return data.map((row) => {
      const achievement = Array.isArray(row.achievements)
        ? row.achievements[0]
        : row.achievements;
      return {
        character_id: row.character_id,
        achievement_id: row.achievement_id,
        unlocked_at: row.unlocked_at,
        progress: row.progress as { current: number; threshold: number } | null,
        notified: row.notified,
        achievement: achievement as AchievementProgressRecord["achievement"],
      };
    });
  }
}
