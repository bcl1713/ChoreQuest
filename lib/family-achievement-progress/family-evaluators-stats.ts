import type { FamilyEvaluatorFn } from "./types";
import { aggregate } from "./family-evaluator-utils";

export const evaluateGoldEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (let i = 0; i < userIds.length; i++) {
    const { data: questRows, error: questError } = await client
      .from("quest_instances")
      .select("gold_reward, volunteer_bonus, streak_bonus")
      .eq("status", "APPROVED")
      .or(
        `assigned_to_id.eq.${userIds[i]},volunteered_by.eq.${characterIds[i]}`,
      );
    if (questError) throw questError;

    const questGold = (questRows ?? []).reduce((sum, row) => {
      const base = row.gold_reward ?? 0;
      const bonusFraction =
        (row.volunteer_bonus ?? 0) + (row.streak_bonus ?? 0);
      return sum + Math.round(base * (1 + bonusFraction));
    }, 0);

    const { data: bossRows, error: bossError } = await client
      .from("boss_battle_participants")
      .select("awarded_gold")
      .eq("user_id", userIds[i])
      .in("participation_status", ["APPROVED", "PARTIAL"]);
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
) => {
  const values: number[] = [];
  for (const userId of allUserIds) {
    const { data, error } = await client
      .from("reward_redemptions")
      .select("cost")
      .eq("user_id", userId)
      .in("status", ["APPROVED", "FULFILLED"]);
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
) => {
  const values: number[] = [];
  for (const userId of allUserIds) {
    const { count, error } = await client
      .from("reward_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["APPROVED", "FULFILLED"]);
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateXpEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (const characterId of characterIds) {
    const { data, error } = await client
      .from("characters")
      .select("xp")
      .eq("id", characterId)
      .single();
    if (error) throw error;
    values.push(data?.xp ?? 0);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateLevelReached: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (const characterId of characterIds) {
    const { data, error } = await client
      .from("characters")
      .select("level")
      .eq("id", characterId)
      .single();
    if (error) throw error;
    values.push(data?.level ?? 0);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateStreakReached: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (const characterId of characterIds) {
    const { data, error } = await client
      .from("character_quest_streaks")
      .select("longest_streak")
      .eq("character_id", characterId);
    if (error) throw error;
    if (!data || data.length === 0) {
      values.push(0);
    } else {
      values.push(Math.max(...data.map((row) => row.longest_streak ?? 0)));
    }
  }
  return { current: aggregate(values, mode) };
};

export const evaluateClassChange: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (const characterId of characterIds) {
    const { count, error } = await client
      .from("character_change_history")
      .select("*", { count: "exact", head: true })
      .eq("character_id", characterId)
      .eq("change_type", "class");
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

export const evaluateHonorEarned: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  characterIds,
  _allUserIds,
  mode,
) => {
  const values: number[] = [];
  for (const characterId of characterIds) {
    const { data, error } = await client
      .from("characters")
      .select("honor_points")
      .eq("id", characterId)
      .single();
    if (error) throw error;
    values.push(data?.honor_points ?? 0);
  }
  return { current: aggregate(values, mode) };
};
