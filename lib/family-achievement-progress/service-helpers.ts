import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { FAMILY_EVALUATOR_REGISTRY } from "./family-evaluators";
import type {
  FetchedFamilyAchievement,
  FamilyCriteriaConfig,
  FamilyAchievementProgressRecord,
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
    totalMemberCount: number;
    membersWithCharCount: number;
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
  const mode = config.family_evaluation_mode ?? "sum";
  const threshold = config.threshold ?? 0;

  const { userIds, characterIds, totalMemberCount, membersWithCharCount } =
    familyContext;

  const result = await evaluator(
    readClient,
    familyId,
    userIds,
    characterIds,
    mode,
  );

  const current =
    mode === "all" && membersWithCharCount < totalMemberCount
      ? 0
      : result.current;

  const { error: upsertError } = await writeClient
    .from("family_achievement_progress")
    .upsert(
      {
        family_id: familyId,
        family_achievement_id: achievementId,
        progress: { current, threshold },
      },
      {
        onConflict: "family_id,family_achievement_id",
        ignoreDuplicates: false,
      },
    );

  if (upsertError) {
    throw new Error(`Failed to upsert family progress: ${upsertError.message}`);
  }

  if (current >= threshold) {
    const { error: unlockError } = await writeClient
      .from("family_achievement_progress")
      .update({ unlocked_at: new Date().toISOString() })
      .eq("family_id", familyId)
      .eq("family_achievement_id", achievementId)
      .is("unlocked_at", null);

    if (unlockError) {
      console.error(
        `Failed to unlock family achievement ${achievementId}:`,
        unlockError,
      );
    }
  } else {
    const { data: progressRow, error: clearError } = await writeClient
      .from("family_achievement_progress")
      .update({ unlocked_at: null })
      .eq("family_id", familyId)
      .eq("family_achievement_id", achievementId)
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

// ─── getProgress ─────────────────────────────────────────────────────────────

export async function getProgressImpl(
  readClient: ReadClient,
  familyId: string,
): Promise<FamilyAchievementProgressRecord[]> {
  const { data, error } = await readClient
    .from("family_achievement_progress")
    .select(
      `
      family_id,
      family_achievement_id,
      unlocked_at,
      progress,
      notified,
      family_achievements (
        id,
        name,
        description,
        criteria_type,
        criteria_config
      )
    `,
    )
    .eq("family_id", familyId);

  if (error) {
    throw new Error(`Failed to fetch family progress: ${error.message}`);
  }

  if (!data) return [];

  return data.map((row) => {
    const achievement = Array.isArray(row.family_achievements)
      ? row.family_achievements[0]
      : row.family_achievements;
    return {
      family_id: row.family_id,
      family_achievement_id: row.family_achievement_id,
      unlocked_at: row.unlocked_at,
      progress: row.progress as { current: number; threshold: number } | null,
      notified: row.notified,
      family_achievement:
        achievement as FamilyAchievementProgressRecord["family_achievement"],
    };
  });
}
