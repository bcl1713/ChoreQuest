import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { RewardCalculator } from "@/lib/reward-calculator";
import { evaluateCriteriaMet } from "./unlock-evaluator";
import { EVALUATOR_REGISTRY } from "./evaluators";
import type {
  AchievementProgressValue,
  CriteriaConfig,
  CompoundProgress,
  CompoundConditionResult,
  CompoundCondition,
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
  userId: string,
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

  // P1: Extract locked IDs for potential revert on failure
  const lockedIds = actuallyUnlocked.map((r) => r.achievement_id);

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

  let statsApplied = false,
    levelApplied = false;
  let prevLevel: number | null = null;
  try {
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
      throw new Error(
        `Failed to increment character stats: ${rpcError.message}`,
      );
    }

    statsApplied = true;
    prevLevel = newStats?.level ?? null;

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

      levelApplied = true;
    }

    // P2 + P3: Unified cascade section
    if (depth < MAX_CASCADE_DEPTH) {
      const cascadeRows: UpsertRow[] = [];

      // P3: Re-evaluate xp_earned with post-reward XP total
      if (totalXp > 0) {
        for (const a of achievementMap.values()) {
          if (a.criteria_type !== "xp_earned") continue;
          const config = a.criteria_config as CriteriaConfig;
          cascadeRows.push({
            character_id: characterId,
            achievement_id: a.id,
            progress: {
              current: newStats?.xp ?? 0,
              threshold: config?.threshold ?? 0,
            },
          });
        }
      }

      // Level-up cascade: level_reached + compound achievements
      if (levelUpResult) {
        const newLevel = levelUpResult.newLevel;
        for (const a of achievementMap.values()) {
          if (a.criteria_type !== "level_reached") continue;
          const config = a.criteria_config as CriteriaConfig;
          cascadeRows.push({
            character_id: characterId,
            achievement_id: a.id,
            progress: { current: newLevel, threshold: config?.threshold ?? 0 },
          });
        }

        for (const a of achievementMap.values()) {
          if (a.criteria_type !== "compound") continue;
          const config = a.criteria_config as CriteriaConfig;
          const hasLevelCondition = (config?.conditions ?? []).some(
            (c: CompoundCondition) => c.criteria_type === "level_reached",
          );
          if (!hasLevelCondition) continue;
          const result = await EVALUATOR_REGISTRY.compound(
            readClient,
            characterId,
            userId,
            config,
          );
          cascadeRows.push({
            character_id: characterId,
            achievement_id: a.id,
            progress: buildProgressValue("compound", result, config),
          });
        }
      }

      if (cascadeRows.length > 0) {
        // P2: Persist cascade progress before recursing
        const { error: cascadeUpsertError } = await writeClient
          .from("character_achievements")
          .upsert(cascadeRows, {
            onConflict: "character_id,achievement_id",
            ignoreDuplicates: false,
          });

        if (cascadeUpsertError) {
          throw new Error(
            `Failed to persist cascade progress: ${cascadeUpsertError.message}`,
          );
        }

        await runUnlockEvaluation(
          characterId,
          userId,
          cascadeRows,
          achievementMap,
          readClient,
          writeClient,
          depth + 1,
        );
      }
    }
  } catch (err) {
    const { error: revertError } = await writeClient
      .from("character_achievements")
      .update({ unlocked_at: null })
      .eq("character_id", characterId)
      .in("achievement_id", lockedIds);
    if (revertError) {
      console.error(
        "Critical: failed to revert unlock after reward failure:",
        revertError,
      );
    }
    if (levelApplied && prevLevel !== null) {
      const { error: lvlRevertErr } = await writeClient
        .from("characters")
        .update({ level: prevLevel })
        .eq("id", characterId);
      if (lvlRevertErr) {
        console.error(
          "Critical: failed to revert level after reward failure:",
          lvlRevertErr,
        );
      }
    }
    if (statsApplied) {
      const { error: statsRevertErr } = await writeClient
        .rpc("fn_increment_character_stats", {
          p_character_id: characterId,
          p_xp: 0 - totalXp,
          p_gold: 0 - totalGold,
        })
        .single();
      if (statsRevertErr) {
        console.error(
          "Critical: failed to revert stats after reward failure:",
          statsRevertErr,
        );
      }
    }
    throw err;
  }
}
