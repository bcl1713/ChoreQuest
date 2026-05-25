import type {
  FamilyAchievementEvaluationContext,
  FamilyEvaluatorFn,
} from "./types";
import { aggregate } from "./family-evaluator-utils";

function applySeasonCutoff<T extends { gte: (column: string, value: string) => T }>(
  query: T,
  context: FamilyAchievementEvaluationContext | undefined,
  column: "approved_at" | "created_at" = "approved_at",
): T {
  return context?.seasonStartedAt
    ? query.gte(column, context.seasonStartedAt)
    : query;
}

export const evaluateGoldEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
  _criteriaConfig,
  context,
) => {
  const values: number[] = [];
  for (const { userId, characterIds } of memberPairs) {
    const base = client
      .from("quest_instances")
      .select("gold_reward, volunteer_bonus, streak_bonus")
      .eq("status", "APPROVED");
    const questQuery =
      characterIds.length > 0
        ? base.or(
            `assigned_to_id.eq.${userId},volunteered_by.in.(${characterIds.join(",")})`,
          )
        : base.eq("assigned_to_id", userId);
    const { data: questRows, error: questError } = await applySeasonCutoff(
      questQuery,
      context,
    );
    if (questError) throw questError;

    const questGold = (questRows ?? []).reduce((sum, row) => {
      const base = row.gold_reward ?? 0;
      const bonusFraction =
        (row.volunteer_bonus ?? 0) + (row.streak_bonus ?? 0);
      return sum + Math.round(base * (1 + bonusFraction));
    }, 0);

    const bossQuery = client
      .from("boss_battle_participants")
      .select("awarded_gold")
      .eq("user_id", userId)
      .in("participation_status", ["APPROVED", "PARTIAL"]);
    const { data: bossRows, error: bossError } = await applySeasonCutoff(
      bossQuery,
      context,
    );
    if (bossError) throw bossError;

    const bossGold = (bossRows ?? []).reduce(
      (sum, row) => sum + (row.awarded_gold ?? 0),
      0,
    );

    values.push(questGold + bossGold);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateGoldSpent: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  allUserIds,
  mode,
  _memberPairs,
  _criteriaConfig,
  context,
) => {
  const values: number[] = [];
  for (const userId of allUserIds) {
    const query = client
      .from("reward_redemptions")
      .select("cost")
      .eq("user_id", userId)
      .in("status", ["APPROVED", "FULFILLED"]);
    const { data, error } = await applySeasonCutoff(query, context);
    if (error) throw error;
    const total = (data ?? []).reduce((sum, row) => sum + (row.cost ?? 0), 0);
    values.push(total);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateRewardRedeemed: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  allUserIds,
  mode,
  _memberPairs,
  _criteriaConfig,
  context,
) => {
  const values: number[] = [];
  for (const userId of allUserIds) {
    const query = client
      .from("reward_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["APPROVED", "FULFILLED"]);
    const { count, error } = await applySeasonCutoff(query, context);
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateXpEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { characterIds } of memberPairs) {
    const charValues: number[] = [];
    for (const characterId of characterIds) {
      const { data, error } = await client
        .from("characters")
        .select("xp")
        .eq("id", characterId)
        .single();
      if (error) throw error;
      charValues.push(data?.xp ?? 0);
    }
    if (mode === "all") {
      values.push(charValues.length > 0 ? Math.max(...charValues) : 0);
    } else {
      values.push(...charValues);
    }
  }
  return { current: aggregate(values, mode) };
};

export const evaluateLevelReached: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { characterIds } of memberPairs) {
    const charValues: number[] = [];
    for (const characterId of characterIds) {
      const { data, error } = await client
        .from("characters")
        .select("level")
        .eq("id", characterId)
        .single();
      if (error) throw error;
      charValues.push(data?.level ?? 0);
    }
    if (mode === "all") {
      values.push(charValues.length > 0 ? Math.max(...charValues) : 0);
    } else {
      values.push(...charValues);
    }
  }
  return { current: aggregate(values, mode) };
};

export const evaluateStreakReached: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { characterIds } of memberPairs) {
    const charValues: number[] = [];
    for (const characterId of characterIds) {
      const { data, error } = await client
        .from("character_quest_streaks")
        .select("longest_streak")
        .eq("character_id", characterId);
      if (error) throw error;
      if (!data || data.length === 0) {
        charValues.push(0);
      } else {
        charValues.push(
          Math.max(...data.map((row) => row.longest_streak ?? 0)),
        );
      }
    }
    if (mode === "all") {
      values.push(charValues.length > 0 ? Math.max(...charValues) : 0);
    } else {
      values.push(...charValues);
    }
  }
  return { current: aggregate(values, mode) };
};

export const evaluateClassChange: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
  _criteriaConfig,
  context,
) => {
  const values: number[] = [];
  for (const { characterIds } of memberPairs) {
    const charValues: number[] = [];
    for (const characterId of characterIds) {
      const query = client
        .from("character_change_history")
        .select("*", { count: "exact", head: true })
        .eq("character_id", characterId)
        .eq("change_type", "class");
      const { count, error } = await applySeasonCutoff(
        query,
        context,
        "created_at",
      );
      if (error) throw error;
      charValues.push(count ?? 0);
    }
    if (mode === "all") {
      values.push(charValues.length > 0 ? Math.max(...charValues) : 0);
    } else {
      values.push(...charValues);
    }
  }
  return { current: aggregate(values, mode) };
};

export const evaluateHonorEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { characterIds } of memberPairs) {
    const charValues: number[] = [];
    for (const characterId of characterIds) {
      const { data, error } = await client
        .from("characters")
        .select("honor_points")
        .eq("id", characterId)
        .single();
      if (error) throw error;
      charValues.push(data?.honor_points ?? 0);
    }
    if (mode === "all") {
      values.push(charValues.length > 0 ? Math.max(...charValues) : 0);
    } else {
      values.push(...charValues);
    }
  }
  return { current: aggregate(values, mode) };
};
