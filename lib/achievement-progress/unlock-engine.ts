import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { RewardCalculator } from "@/lib/reward-calculator";
import { evaluateCriteriaMet } from "./unlock-evaluator";
import type {
  AchievementProgressValue,
  CriteriaConfig,
  CompoundProgress,
  CompoundConditionResult,
} from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FetchedAchievement = {
  id: string;
  name: string;
  criteria_type: string;
  criteria_config: unknown;
  xp_reward: number | null;
  gold_reward: number | null;
};

export type UpsertRow = {
  character_id: string;
  achievement_id: string;
  progress: AchievementProgressValue;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildProgressValue(
  criteriaType: string,
  result: {
    current: number;
    compoundConditions?: CompoundConditionResult[];
    compoundMet?: boolean;
  },
  config: CriteriaConfig,
): AchievementProgressValue {
  if (criteriaType === "compound" && result.compoundConditions !== undefined) {
    return {
      conditions: result.compoundConditions,
      met: result.compoundMet ?? false,
    } satisfies CompoundProgress;
  }
  return { current: result.current, threshold: config?.threshold ?? 0 };
}

// ─── Core unlock evaluation engine ───────────────────────────────────────────

const MAX_CASCADE_DEPTH = 10;

export async function runUnlockEvaluation(
  characterId: string,
  progressRows: UpsertRow[],
  achievementMap: Map<string, FetchedAchievement>,
  readClient: SupabaseClient<Database>,
  writeClient: SupabaseClient<Database>,
  depth = 0,
): Promise<void> {
  if (depth > MAX_CASCADE_DEPTH || progressRows.length === 0) return;

  // Fetch existing unlocked_at for the upserted achievement IDs
  const achievementIds = progressRows.map((r) => r.achievement_id);
  const { data: existingRows, error: fetchError } = await readClient
    .from("character_achievements")
    .select("achievement_id, unlocked_at")
    .eq("character_id", characterId)
    .in("achievement_id", achievementIds);

  if (fetchError) {
    throw new Error(`Failed to fetch unlock state: ${fetchError.message}`);
  }

  const unlockedAtMap = new Map(
    (existingRows ?? []).map((r) => [r.achievement_id, r.unlocked_at]),
  );

  // Apply strategy dispatch; filter to newly eligible (criteria met + unlocked_at IS NULL)
  const newlyEligible = progressRows.filter((row) => {
    if (unlockedAtMap.get(row.achievement_id)) return false;
    const achievement = achievementMap.get(row.achievement_id);
    if (!achievement) return false;
    const config = achievement.criteria_config as CriteriaConfig;
    return evaluateCriteriaMet(row.progress, config);
  });

  if (newlyEligible.length === 0) return;

  // Batch update unlocked_at = now() with IS NULL concurrency filter.
  // .select() returns only the rows that matched and were updated by this call.
  // Under concurrent unlock evaluations, only one caller wins the IS NULL race;
  // the other receives an empty set and returns early without granting rewards.
  const { data: actuallyUnlocked, error: unlockError } = await writeClient
    .from("character_achievements")
    .update({ unlocked_at: new Date().toISOString() })
    .eq("character_id", characterId)
    .in(
      "achievement_id",
      newlyEligible.map((r) => r.achievement_id),
    )
    .is("unlocked_at", null)
    .select("achievement_id");

  if (unlockError) {
    throw new Error(`Failed to set unlocked_at: ${unlockError.message}`);
  }

  // Only grant rewards for achievements actually unlocked by this call
  if (!actuallyUnlocked || actuallyUnlocked.length === 0) return;

  // Sum xp_reward and gold_reward across actually-unlocked achievements
  const totalXp = actuallyUnlocked.reduce(
    (sum, row) =>
      sum + (achievementMap.get(row.achievement_id)?.xp_reward ?? 0),
    0,
  );
  const totalGold = actuallyUnlocked.reduce(
    (sum, row) =>
      sum + (achievementMap.get(row.achievement_id)?.gold_reward ?? 0),
    0,
  );

  // Skip character stats update when total rewards are zero
  if (totalXp === 0 && totalGold === 0) return;

  // Atomically increment XP and gold to prevent concurrent read-modify-write races.
  // Returns the new values after the increment.
  const { data: newStats, error: rpcError } = await writeClient
    .rpc("fn_increment_character_stats", {
      p_character_id: characterId,
      p_xp: totalXp,
      p_gold: totalGold,
    })
    .single();

  if (rpcError) {
    throw new Error(`Failed to increment character stats: ${rpcError.message}`);
  }

  // Compute level from previous XP (new xp minus the increment) to detect level-up
  const prevXp = (newStats?.xp ?? 0) - totalXp;
  const levelUpResult = RewardCalculator.calculateLevelUp(
    prevXp,
    totalXp,
    newStats?.level ?? 1,
  );

  if (levelUpResult) {
    const { error: levelError } = await writeClient
      .from("characters")
      .update({ level: levelUpResult.newLevel })
      .eq("id", characterId);

    if (levelError) {
      throw new Error(
        `Failed to update character level: ${levelError.message}`,
      );
    }
  }

  // Level-up cascade: re-evaluate level_reached achievements
  if (levelUpResult && depth < MAX_CASCADE_DEPTH) {
    const newLevel = levelUpResult.newLevel;
    const levelAchievements = [...achievementMap.values()].filter(
      (a) => a.criteria_type === "level_reached",
    );
    if (levelAchievements.length > 0) {
      const cascadeRows: UpsertRow[] = levelAchievements.map((a) => {
        const config = a.criteria_config as CriteriaConfig;
        return {
          character_id: characterId,
          achievement_id: a.id,
          progress: { current: newLevel, threshold: config?.threshold ?? 0 },
        };
      });
      await runUnlockEvaluation(
        characterId,
        cascadeRows,
        achievementMap,
        readClient,
        writeClient,
        depth + 1,
      );
    }
  }
}
