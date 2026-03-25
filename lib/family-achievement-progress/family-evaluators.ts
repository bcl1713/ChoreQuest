import type { FamilyEvaluatorFn } from "./types";
import type { AchievementEventType } from "../achievement-progress/types";
import { aggregate } from "./family-evaluator-utils";
import {
  evaluateGoldEarned,
  evaluateGoldSpent,
  evaluateRewardRedeemed,
  evaluateXpEarned,
  evaluateLevelReached,
  evaluateStreakReached,
  evaluateClassChange,
  evaluateHonorEarned,
} from "./family-evaluators-stats";

// ─── Event → criteria-type mapping (same as individual) ─────────────────────

export const FAMILY_EVENT_CRITERIA_MAP: Record<AchievementEventType, string[]> =
  {
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
      "honor_earned",
    ],
    CLASS_CHANGED: ["class_change"],
  };

// Criteria types that evaluate per-character data — members without a character
// contribute 0, which in "all" mode naturally floors the aggregate.  The
// character-presence guard in the progress service must be limited to these
// types so that user-based criteria (gold_spent, reward_redeemed, …) are not
// incorrectly zeroed when a family member has no character.
const CHARACTER_BASED_FAMILY_CRITERIA_TYPES: ReadonlySet<string> = new Set([
  "quest_volunteer",
  "xp_earned",
  "level_reached",
  "streak_reached",
  "class_change",
  "honor_earned",
]);

export function isCharBased(type: string): boolean {
  return CHARACTER_BASED_FAMILY_CRITERIA_TYPES.has(type);
}

export const ALL_FAMILY_CRITERIA_TYPES = [
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

// ─── Family evaluators ──────────────────────────────────────────────────────

const evaluateQuestComplete: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { userId, characterIds } of memberPairs) {
    const base = client
      .from("quest_instances")
      .select("*", { count: "exact", head: true })
      .eq("status", "APPROVED");
    const { count, error } =
      characterIds.length > 0
        ? await base.or(
            `assigned_to_id.eq.${userId},volunteered_by.in.(${characterIds.join(",")})`,
          )
        : await base.eq("assigned_to_id", userId);
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

const evaluateQuestVolunteer: FamilyEvaluatorFn = async (
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
    if (mode === "all") {
      // One value per member: max of their characters' volunteer counts
      let maxForMember = 0;
      for (const characterId of characterIds) {
        const { count, error } = await client
          .from("quest_instances")
          .select("*", { count: "exact", head: true })
          .eq("volunteered_by", characterId)
          .eq("status", "APPROVED");
        if (error) throw error;
        maxForMember = Math.max(maxForMember, count ?? 0);
      }
      values.push(maxForMember);
    } else {
      // One value per character: sum across all characters
      for (const characterId of characterIds) {
        const { count, error } = await client
          .from("quest_instances")
          .select("*", { count: "exact", head: true })
          .eq("volunteered_by", characterId)
          .eq("status", "APPROVED");
        if (error) throw error;
        values.push(count ?? 0);
      }
    }
  }
  return { current: aggregate(values, mode) };
};

const evaluateQuestDifficulty: FamilyEvaluatorFn = async (
  client,
  _familyId,
  _userIds,
  _characterIds,
  _allUserIds,
  mode,
  memberPairs,
) => {
  const values: number[] = [];
  for (const { userId, characterIds } of memberPairs) {
    const base = client
      .from("quest_instances")
      .select("*", { count: "exact", head: true })
      .eq("status", "APPROVED")
      .eq("difficulty", "HARD");
    const { count, error } =
      characterIds.length > 0
        ? await base.or(
            `assigned_to_id.eq.${userId},volunteered_by.in.(${characterIds.join(",")})`,
          )
        : await base.eq("assigned_to_id", userId);
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

const evaluateBossDefeated: FamilyEvaluatorFn = async (
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
      .from("boss_battle_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("participation_status", "APPROVED");
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

const evaluateBossParticipated: FamilyEvaluatorFn = async (
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
      .from("boss_battle_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("participation_status", ["APPROVED", "PARTIAL"]);
    if (error) throw error;
    values.push(count ?? 0);
  }
  return { current: aggregate(values, mode) };
};

// ─── Family evaluator registry ──────────────────────────────────────────────

export const FAMILY_EVALUATOR_REGISTRY: Record<string, FamilyEvaluatorFn> = {
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
