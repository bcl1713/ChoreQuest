import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { FAMILY_EVALUATOR_REGISTRY, isCharBased } from "./family-evaluators";
import type {
  FetchedFamilyAchievement,
  FamilyCriteriaConfig,
  FamilyAchievementEvaluationContext,
  FamilyMemberPair,
} from "./types";

type WriteClient = SupabaseClient<Database>;
type ReadClient = SupabaseClient<Database>;

// ─── recomputeAchievement ────────────────────────────────────────────────────

export async function recomputeAchievementImpl(
  readClient: ReadClient,
  writeClient: WriteClient,
  familyId: string,
  achievementId: string,
  familyContext: {
    userIds: string[];
    characterIds: string[];
    allUserIds: string[];
    totalMemberCount: number;
    membersWithCharCount: number;
    memberPairs: FamilyMemberPair[];
  },
  evaluationContext: FamilyAchievementEvaluationContext = {
    seasonId: null,
    seasonStartedAt: null,
  },
): Promise<void> {
  const { data: achievementData, error: achievementError } = await readClient
    .from("family_achievements")
    .select("id, name, criteria_type, criteria_config, xp_reward, gold_reward")
    .eq("id", achievementId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (achievementError || !achievementData) return;

  const achievement = achievementData as FetchedFamilyAchievement;
  const evaluator = FAMILY_EVALUATOR_REGISTRY[achievement.criteria_type];
  if (!evaluator) {
    console.warn(
      `Unknown family criteria type: ${achievement.criteria_type} — skipping recompute for ${achievementId}`,
    );
    return;
  }

  const config = achievement.criteria_config as FamilyCriteriaConfig;
  const rawMode = config.family_evaluation_mode ?? "sum";
  if (rawMode !== "sum" && rawMode !== "all") {
    throw new Error(
      `Invalid family_evaluation_mode "${rawMode}" for achievement ${achievementId} — expected "sum" or "all"`,
    );
  }
  const mode = rawMode;
  const threshold = config.threshold ?? 0;

  const {
    userIds,
    characterIds,
    allUserIds,
    totalMemberCount,
    membersWithCharCount,
    memberPairs,
  } = familyContext;

  const result = await evaluator(
    readClient,
    familyId,
    userIds,
    characterIds,
    allUserIds,
    mode,
    memberPairs,
    config,
    evaluationContext,
  );

  const guardFails =
    mode === "all" &&
    membersWithCharCount < totalMemberCount &&
    isCharBased(achievement.criteria_type);
  const current = guardFails ? 0 : result.current;

  const { error: upsertError } = await writeClient
    .from("family_achievement_progress")
    .upsert(
      {
        family_id: familyId,
        family_achievement_id: achievementId,
        season_id: evaluationContext.seasonId,
        progress: {
          current,
          threshold,
          member_count: familyContext.totalMemberCount,
          members_with_char_count: familyContext.membersWithCharCount,
        },
      },
      {
        onConflict: "family_id,family_achievement_id,season_id",
        ignoreDuplicates: false,
      },
    );

  if (upsertError) {
    throw new Error(`Failed to upsert family progress: ${upsertError.message}`);
  }

  if (current >= threshold) {
    let unlockQuery = writeClient
      .from("family_achievement_progress")
      .update({ unlocked_at: new Date().toISOString() })
      .eq("family_id", familyId)
      .eq("family_achievement_id", achievementId);
    if (evaluationContext.seasonId) {
      unlockQuery = unlockQuery.eq("season_id", evaluationContext.seasonId);
    }
    const { error: unlockError } = await unlockQuery.is("unlocked_at", null);

    if (unlockError) {
      console.error(
        `Failed to unlock family achievement ${achievementId}:`,
        unlockError,
      );
    }
  } else {
    let clearQuery = writeClient
      .from("family_achievement_progress")
      .update({ unlocked_at: null })
      .eq("family_id", familyId)
      .eq("family_achievement_id", achievementId);
    if (evaluationContext.seasonId) {
      clearQuery = clearQuery.eq("season_id", evaluationContext.seasonId);
    }
    const { data: progressRow, error: clearError } = await clearQuery
      .select("id")
      .maybeSingle();

    if (clearError) {
      console.error(
        `Failed to clear unlock for family achievement ${achievementId}:`,
        clearError,
      );
    }

    // Clear per-user notification records so members are notified again if
    // the achievement is unlocked a second time after this re-lock.
    if (progressRow?.id) {
      const { error: notifClearError } = await writeClient
        .from("family_achievement_user_notifications")
        .delete()
        .eq("family_achievement_progress_id", progressRow.id);

      if (notifClearError) {
        console.error(
          `Failed to clear notifications for family achievement ${achievementId}:`,
          notifClearError,
        );
      }
    }
  }
}

// ─── evaluateUnlocks ─────────────────────────────────────────────────────────

type ProgressRow = {
  family_id: string;
  family_achievement_id: string;
  season_id?: string | null;
  progress: { current: number; threshold: number };
};

export async function evaluateUnlocksImpl(
  readClient: ReadClient,
  writeClient: WriteClient,
  familyId: string,
  progressRows: ProgressRow[],
): Promise<void> {
  const seasonId = progressRows[0]?.season_id ?? null;

  // ── Unlock path ────────────────────────────────────────────────────────────
  const eligibleRows = progressRows.filter(
    (row) => row.progress.current >= row.progress.threshold,
  );

  if (eligibleRows.length > 0) {
    const achievementIds = eligibleRows.map((row) => row.family_achievement_id);

    let existingProgressQuery = readClient
      .from("family_achievement_progress")
      .select("family_achievement_id, unlocked_at")
      .eq("family_id", familyId)
      .in("family_achievement_id", achievementIds);

    if (
      seasonId &&
      typeof (existingProgressQuery as { eq?: unknown }).eq === "function"
    ) {
      existingProgressQuery = existingProgressQuery.eq("season_id", seasonId);
    }

    const { data: existingProgress, error: fetchError } =
      await existingProgressQuery;

    if (fetchError) {
      throw new Error(`Failed to check unlock state: ${fetchError.message}`);
    }

    const alreadyUnlocked = new Set(
      (existingProgress ?? [])
        .filter((row) => row.unlocked_at != null)
        .map((row) => row.family_achievement_id),
    );

    for (const achievementId of achievementIds.filter(
      (id) => !alreadyUnlocked.has(id),
    )) {
      let unlockQuery = writeClient
        .from("family_achievement_progress")
        .update({ unlocked_at: new Date().toISOString() })
        .eq("family_id", familyId)
        .eq("family_achievement_id", achievementId);

      if (seasonId) {
        unlockQuery = unlockQuery.eq("season_id", seasonId);
      }

      const { error: unlockError } = await unlockQuery.is("unlocked_at", null);

      if (unlockError) {
        console.error(
          `Failed to unlock family achievement ${achievementId}:`,
          unlockError,
        );
      }
    }
  }

  // ── Re-lock path ───────────────────────────────────────────────────────────
  // If progress regressed below the threshold, clear unlocked_at and per-user
  // notification records so the achievement is no longer shown as earned and
  // members are notified again if it unlocks a second time.
  const belowThresholdRows = progressRows.filter(
    (row) => row.progress.current < row.progress.threshold,
  );

  for (const row of belowThresholdRows) {
    let clearQuery = writeClient
      .from("family_achievement_progress")
      .update({ unlocked_at: null })
      .eq("family_id", familyId)
      .eq("family_achievement_id", row.family_achievement_id);

    if (seasonId) {
      clearQuery = clearQuery.eq("season_id", seasonId);
    }

    const { data: progressRow, error: clearError } = await clearQuery
      .select("id")
      .maybeSingle();

    if (clearError) {
      console.error(
        `Failed to clear unlock for family achievement ${row.family_achievement_id}:`,
        clearError,
      );
      continue;
    }

    if (progressRow?.id) {
      const { error: notifClearError } = await writeClient
        .from("family_achievement_user_notifications")
        .delete()
        .eq("family_achievement_progress_id", progressRow.id);

      if (notifClearError) {
        console.error(
          `Failed to clear notifications for family achievement ${row.family_achievement_id}:`,
          notifClearError,
        );
      }
    }
  }
}
