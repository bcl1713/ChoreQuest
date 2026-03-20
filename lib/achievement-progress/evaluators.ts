import type {
  AchievementEventType,
  CriteriaConfig,
  EvaluatorFn,
} from "./types";

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
  CLASS_CHANGED: ["class_change"],
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
    .eq("user_id", userId)
    .in("participation_status", ["APPROVED", "PARTIAL"]);

  if (error) throw error;
  return { current: count ?? 0 };
};

const evaluateGoldEarned: EvaluatorFn = async (client, characterId, userId) => {
  const { data: questRows, error: questError } = await client
    .from("quest_instances")
    .select("gold_reward, volunteer_bonus, streak_bonus")
    .eq("status", "APPROVED")
    .or(`assigned_to_id.eq.${userId},volunteered_by.eq.${characterId}`);

  if (questError) throw questError;

  const questGold = (questRows ?? []).reduce((sum, row) => {
    const base = row.gold_reward ?? 0;
    const bonusFraction = (row.volunteer_bonus ?? 0) + (row.streak_bonus ?? 0);
    return sum + Math.round(base * (1 + bonusFraction));
  }, 0);

  const { data: bossRows, error: bossError } = await client
    .from("boss_battle_participants")
    .select("awarded_gold")
    .eq("user_id", userId)
    .in("participation_status", ["APPROVED", "PARTIAL"]);

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

const evaluateClassChange: EvaluatorFn = async (client, characterId) => {
  const { count, error } = await client
    .from("character_change_history")
    .select("*", { count: "exact", head: true })
    .eq("character_id", characterId)
    .eq("change_type", "class");

  if (error) throw error;
  return { current: count ?? 0 };
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

export const EVALUATOR_REGISTRY: Record<string, EvaluatorFn> = {
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

// Re-export CriteriaConfig for use in evaluator callers
export type { CriteriaConfig };
