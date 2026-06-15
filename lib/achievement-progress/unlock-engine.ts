import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { RewardCalculator } from "@/lib/reward-calculator";
import { evaluateCriteriaMet, buildProgressValue } from "./unlock-evaluator";
import { EVALUATOR_REGISTRY } from "./evaluators";
import { performRollback } from "./unlock-rollback";
import type {
  AchievementProgressValue,
  CriteriaConfig,
  CompoundCondition,
} from "./types";

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
  season_id: string | null;
  progress: AchievementProgressValue;
};

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

  const achievementIds = progressRows.map((r) => r.achievement_id);
  const seasonId = progressRows[0]?.season_id ?? null;
  const unlockStateQuery = readClient
    .from("character_achievements")
    .select("achievement_id, unlocked_at")
    .eq("character_id", characterId)
    .in("achievement_id", achievementIds);
  const { data: existingRows, error: fetchError } = seasonId
    ? await unlockStateQuery.eq("season_id", seasonId)
    : await unlockStateQuery;

  if (fetchError) {
    throw new Error(`Failed to fetch unlock state: ${fetchError.message}`);
  }

  const unlockedAtMap = new Map(
    (existingRows ?? []).map((r) => [r.achievement_id, r.unlocked_at]),
  );

  const newlyEligible = progressRows.filter((row) => {
    if (unlockedAtMap.get(row.achievement_id)) return false;
    const achievement = achievementMap.get(row.achievement_id);
    if (!achievement) return false;
    const config = achievement.criteria_config as CriteriaConfig;
    return evaluateCriteriaMet(row.progress, config);
  });

  if (newlyEligible.length === 0) return;

  const candidateAchievementIds = newlyEligible.map((row: UpsertRow) => row.achievement_id);
  const candidateTotalXp = newlyEligible.reduce((sum: number, row: UpsertRow) => sum + (achievementMap.get(row.achievement_id)?.xp_reward ?? 0), 0);
  const candidateTotalGold = newlyEligible.reduce((sum: number, row: UpsertRow) => sum + (achievementMap.get(row.achievement_id)?.gold_reward ?? 0), 0);

  const lockAchievementsOnly = async () => {
    const unlockUpdateQuery = writeClient.from("character_achievements").update({ unlocked_at: new Date().toISOString() }).eq("character_id", characterId).in("achievement_id", candidateAchievementIds).is("unlocked_at", null);
    const { data: actuallyUnlocked, error: unlockError } = seasonId
      ? await unlockUpdateQuery.eq("season_id", seasonId).select("achievement_id")
      : await unlockUpdateQuery.select("achievement_id");
    if (unlockError) throw new Error(`Failed to set unlocked_at: ${unlockError.message}`);
    return (actuallyUnlocked ?? []).map((row: { achievement_id: string }) => row.achievement_id);
  };

  let lockedIds: string[] = [];
  let totalXp = 0;
  let totalGold = 0;

  if (candidateTotalXp === 0 && candidateTotalGold === 0) {
    lockedIds = await lockAchievementsOnly();
    if (lockedIds.length === 0) return;
    return;
  }

  let statsApplied = false,
    levelApplied = false;
  let prevLevel: number | null = null;
  let appliedLevel: number | null = null;
  let capturedNewStats: { xp: number; gold: number } | null = null;
  let prevCascadeSnapshot: Array<{
    achievement_id: string;
    progress: unknown;
  }> = [];
  const cascadeRows: UpsertRow[] = [];
  try {
    const { data: atomicUnlock, error: rpcError } = await writeClient
      .rpc("fn_unlock_achievements_and_grant_rewards", {
        p_character_id: characterId,
        p_achievement_ids: candidateAchievementIds,
        p_season_id: seasonId,
      })
      .single();

    if (rpcError) throw new Error(`Failed to atomically unlock achievements and grant rewards: ${rpcError.message}`);

    lockedIds = atomicUnlock?.unlocked_achievement_ids ?? [];
    if (lockedIds.length === 0) return;

    totalXp = atomicUnlock?.awarded_xp ?? 0;
    totalGold = atomicUnlock?.awarded_gold ?? 0;
    if (totalXp === 0 && totalGold === 0) return;

    const newStats =
      atomicUnlock?.xp === null || atomicUnlock?.gold === null || atomicUnlock?.level === null
        ? null
        : { xp: atomicUnlock.xp, gold: atomicUnlock.gold, level: atomicUnlock.level };

    if (!newStats) throw new Error("Atomic unlock RPC returned unlocked achievements without updated character stats");

    statsApplied = true;
    prevLevel = newStats?.level ?? null;
    capturedNewStats = newStats
      ? { xp: newStats.xp ?? 0, gold: newStats.gold ?? 0 }
      : null;

    // Compute level from previous XP (new xp minus the increment) to detect level-up
    const prevXp = (newStats?.xp ?? 0) - totalXp;
    const levelUpResult = RewardCalculator.calculateLevelUp(
      prevXp,
      totalXp,
      newStats?.level ?? 1,
    );

    if (levelUpResult) {
      const { data: levelData, error: levelError } = await writeClient
        .from("characters")
        .update({ level: levelUpResult.newLevel })
        .eq("id", characterId)
        .lt("level", levelUpResult.newLevel) // only advance, never downgrade
        .select("level");

      if (levelError) {
        throw new Error(
          `Failed to update character level: ${levelError.message}`,
        );
      }

      levelApplied = (levelData?.length ?? 0) > 0;
      if (levelApplied) appliedLevel = levelUpResult.newLevel;
    }

    if (depth < MAX_CASCADE_DEPTH) {
      const cascadeAchievementIds = new Set<string>();

      const cascadeTriggers: Array<{
        shouldRun: boolean;
        criteriaType: "xp_earned" | "level_reached";
        newValue: number;
      }> = [
        {
          shouldRun: totalXp > 0,
          criteriaType: "xp_earned",
          newValue: newStats?.xp ?? 0,
        },
        {
          shouldRun: !!(levelUpResult && levelApplied),
          criteriaType: "level_reached",
          newValue: levelUpResult?.newLevel ?? 0,
        },
      ];

      for (const trigger of cascadeTriggers) {
        if (!trigger.shouldRun) continue;
        for (const a of achievementMap.values()) {
          if (a.criteria_type !== trigger.criteriaType) continue;
          const config = a.criteria_config as CriteriaConfig;
          cascadeRows.push({
            character_id: characterId,
            achievement_id: a.id,
            season_id: seasonId,
            progress: {
              current: trigger.newValue,
              threshold: config?.threshold ?? 0,
            },
          });
          cascadeAchievementIds.add(a.id);
        }
      }

      // Compound cascade: re-evaluate compound achievements with an xp_earned
      // or level_reached sub-condition, deduplicating across both triggers.
      const shouldEvalCompound = totalXp > 0 || (levelUpResult && levelApplied);
      if (shouldEvalCompound) {
        for (const a of achievementMap.values()) {
          if (a.criteria_type !== "compound") continue;
          if (cascadeAchievementIds.has(a.id)) continue; // already queued
          const config = a.criteria_config as CriteriaConfig;
          const hasRelevantCondition = (config?.conditions ?? []).some(
            (c: CompoundCondition) =>
              c.criteria_type === "xp_earned" ||
              c.criteria_type === "level_reached",
          );
          if (!hasRelevantCondition) continue;
          const result = await EVALUATOR_REGISTRY.compound(
            readClient,
            characterId,
            userId,
            config,
            { seasonId, seasonStartedAt: null },
          );
          cascadeRows.push({
            character_id: characterId,
            achievement_id: a.id,
            season_id: seasonId,
            progress: buildProgressValue("compound", result, config),
          });
          cascadeAchievementIds.add(a.id);
        }
      }

      if (cascadeRows.length > 0) {
        // Fix P2: snapshot existing progress before upserting so rollback can
        // restore prior values rather than blindly writing null.
        const snapshotQuery = readClient
          .from("character_achievements")
          .select("achievement_id, progress")
          .eq("character_id", characterId)
          .in(
            "achievement_id",
            cascadeRows.map((r) => r.achievement_id),
          );
        const { data: existingCascade, error: snapshotErr } = seasonId
          ? await snapshotQuery.eq("season_id", seasonId)
          : await snapshotQuery;
        if (snapshotErr) {
          throw new Error(
            `Failed to snapshot cascade progress: ${snapshotErr.message}`,
          );
        }
        prevCascadeSnapshot =
          (existingCascade as typeof prevCascadeSnapshot) ?? [];

        // Persist cascade progress before recursing
        const { error: cascadeUpsertError } = await writeClient
          .from("character_achievements")
          .upsert(cascadeRows, {
            onConflict: "character_id,achievement_id,season_id",
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
    await performRollback(writeClient, characterId, {
      levelApplied,
      prevLevel,
      appliedLevel,
      statsApplied,
      capturedNewStats,
      totalXp,
      totalGold,
      lockedIds,
      cascadeRows,
      prevCascadeSnapshot,
    });
    throw err;
  }
}
