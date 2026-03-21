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

  // Batch update unlocked_at = now() with IS NULL concurrency filter
  const { error: unlockError } = await writeClient
    .from("character_achievements")
    .update({ unlocked_at: new Date().toISOString() })
    .eq("character_id", characterId)
    .in(
      "achievement_id",
      newlyEligible.map((r) => r.achievement_id),
    )
    .is("unlocked_at", null);

  if (unlockError) {
    throw new Error(`Failed to set unlocked_at: ${unlockError.message}`);
  }

  // Sum xp_reward and gold_reward across newly-unlocked achievements
  const totalXp = newlyEligible.reduce(
    (sum, row) =>
      sum + (achievementMap.get(row.achievement_id)?.xp_reward ?? 0),
    0,
  );
  const totalGold = newlyEligible.reduce(
    (sum, row) =>
      sum + (achievementMap.get(row.achievement_id)?.gold_reward ?? 0),
    0,
  );

  // Skip character stats update when total rewards are zero
  if (totalXp === 0 && totalGold === 0) return;

  // Fetch character's current XP, gold, and level
  const { data: charData, error: charError } = await readClient
    .from("characters")
    .select("xp, gold, level")
    .eq("id", characterId)
    .single();

  if (charError) {
    throw new Error(`Failed to fetch character stats: ${charError.message}`);
  }

  const currentXp = charData?.xp ?? 0;
  const currentGold = charData?.gold ?? 0;
  const currentLevel = charData?.level ?? 1;

  // Call RewardCalculator.calculateLevelUp
  const levelUpResult = RewardCalculator.calculateLevelUp(
    currentXp,
    totalXp,
    currentLevel,
  );

  // Increment characters.xp, characters.gold, and optionally level
  const statsUpdate: Record<string, number> = {
    xp: currentXp + totalXp,
    gold: currentGold + totalGold,
  };
  if (levelUpResult) {
    statsUpdate.level = levelUpResult.newLevel;
  }

  const { error: statsError } = await writeClient
    .from("characters")
    .update(statsUpdate)
    .eq("id", characterId);

  if (statsError) {
    throw new Error(`Failed to update character stats: ${statsError.message}`);
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
