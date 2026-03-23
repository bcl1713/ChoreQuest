import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import {
  FAMILY_EVALUATOR_REGISTRY,
  FAMILY_EVENT_CRITERIA_MAP,
  ALL_FAMILY_CRITERIA_TYPES,
} from "./family-achievement-progress/family-evaluators";
import type {
  AchievementEvent,
  FetchedFamilyAchievement,
  FamilyCriteriaConfig,
  FamilyAchievementProgressRecord,
} from "./family-achievement-progress/types";

export type {
  AchievementEvent,
  FetchedFamilyAchievement,
  FamilyCriteriaConfig,
  FamilyAchievementProgressRecord,
} from "./family-achievement-progress/types";

// ─── Service class ───────────────────────────────────────────────────────────

export class FamilyAchievementProgressService {
  private readonly readClient: SupabaseClient<Database>;
  private readonly writeClient: SupabaseClient<Database>;

  constructor(readClient?: SupabaseClient<Database>) {
    this.writeClient = createServiceSupabaseClient();
    this.readClient = readClient ?? this.writeClient;
  }

  private async resolveFamilyCharacters(familyId: string): Promise<{
    userIds: string[];
    characterIds: string[];
    totalMemberCount: number;
    membersWithCharCount: number;
  }> {
    const { data, error } = await this.readClient
      .from("user_profiles")
      .select("id, characters(id)")
      .eq("family_id", familyId);

    if (error) {
      throw new Error(`Failed to resolve family characters: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`No members found for family: ${familyId}`);
    }

    const userIds: string[] = [];
    const characterIds: string[] = [];
    const usersWithChars = new Set<string>();

    for (const profile of data) {
      const chars = Array.isArray(profile.characters)
        ? profile.characters
        : profile.characters
          ? [profile.characters]
          : [];
      for (const char of chars) {
        userIds.push(profile.id);
        characterIds.push((char as { id: string }).id);
        usersWithChars.add(profile.id);
      }
    }

    return {
      userIds,
      characterIds,
      totalMemberCount: data.length,
      membersWithCharCount: usersWithChars.size,
    };
  }

  private async fetchFamilyAchievements(
    familyId: string,
  ): Promise<FetchedFamilyAchievement[]> {
    const { data, error } = await this.readClient
      .from("family_achievements")
      .select(
        "id, name, criteria_type, criteria_config, xp_reward, gold_reward",
      )
      .eq("family_id", familyId);

    if (error) {
      throw new Error(`Failed to fetch family achievements: ${error.message}`);
    }

    return (data ?? []) as FetchedFamilyAchievement[];
  }

  private async fetchExistingProgressIds(
    familyId: string,
  ): Promise<Set<string>> {
    const { data, error } = await this.readClient
      .from("family_achievement_progress")
      .select("family_achievement_id")
      .eq("family_id", familyId);

    if (error) {
      throw new Error(`Failed to check family progress: ${error.message}`);
    }

    return new Set((data ?? []).map((row) => row.family_achievement_id));
  }

  async updateProgress(
    familyId: string,
    event: AchievementEvent,
  ): Promise<void> {
    const { userIds, characterIds, totalMemberCount, membersWithCharCount } =
      await this.resolveFamilyCharacters(familyId);
    const achievements = await this.fetchFamilyAchievements(familyId);
    const existingProgressIds = await this.fetchExistingProgressIds(familyId);

    if (achievements.length === 0) return;

    // Backfill when any achievement is missing a progress row
    const needsBackfill = achievements.some(
      (a) => !existingProgressIds.has(a.id),
    );

    const criteriaTypesToEvaluate = needsBackfill
      ? ALL_FAMILY_CRITERIA_TYPES.slice()
      : (FAMILY_EVENT_CRITERIA_MAP[event.type] ?? []);

    // Warn about unknown criteria types
    for (const a of achievements) {
      if (!FAMILY_EVALUATOR_REGISTRY[a.criteria_type]) {
        console.warn(
          `Unknown family criteria type: ${a.criteria_type} — skipping family achievement ${a.id}`,
        );
      }
    }

    const relevantAchievements = achievements.filter(
      (a) =>
        criteriaTypesToEvaluate.includes(a.criteria_type) &&
        FAMILY_EVALUATOR_REGISTRY[a.criteria_type],
    );

    if (relevantAchievements.length === 0) return;

    const upsertRows: {
      family_id: string;
      family_achievement_id: string;
      progress: { current: number; threshold: number };
    }[] = [];

    for (const achievement of relevantAchievements) {
      const evaluator = FAMILY_EVALUATOR_REGISTRY[achievement.criteria_type];
      if (!evaluator) continue;

      const config = achievement.criteria_config as FamilyCriteriaConfig;
      const mode = config.family_evaluation_mode ?? "sum";
      const threshold = config.threshold ?? 0;

      const result = await evaluator(
        this.readClient,
        familyId,
        userIds,
        characterIds,
        mode,
      );

      // "all"-mode: members without characters haven't met any threshold.
      const current =
        mode === "all" && membersWithCharCount < totalMemberCount
          ? 0
          : result.current;

      upsertRows.push({
        family_id: familyId,
        family_achievement_id: achievement.id,
        progress: { current, threshold },
      });
    }

    if (upsertRows.length === 0) return;

    const { error } = await this.writeClient
      .from("family_achievement_progress")
      .upsert(upsertRows, {
        onConflict: "family_id,family_achievement_id",
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to upsert family progress: ${error.message}`);
    }

    // Unlock evaluation: detect newly met criteria
    await this.evaluateUnlocks(familyId, upsertRows);
  }

  private async evaluateUnlocks(
    familyId: string,
    progressRows: {
      family_id: string;
      family_achievement_id: string;
      progress: { current: number; threshold: number };
    }[],
  ): Promise<void> {
    // Find rows that meet their threshold
    const eligibleRows = progressRows.filter(
      (row) => row.progress.current >= row.progress.threshold,
    );

    if (eligibleRows.length === 0) return;

    const achievementIds = eligibleRows.map((row) => row.family_achievement_id);

    // Fetch existing progress to check unlocked_at
    const { data: existingProgress, error: fetchError } = await this.readClient
      .from("family_achievement_progress")
      .select("family_achievement_id, unlocked_at")
      .eq("family_id", familyId)
      .in("family_achievement_id", achievementIds);

    if (fetchError) {
      throw new Error(`Failed to check unlock state: ${fetchError.message}`);
    }

    // Filter to only those not yet unlocked
    const alreadyUnlocked = new Set(
      (existingProgress ?? [])
        .filter((row) => row.unlocked_at != null)
        .map((row) => row.family_achievement_id),
    );

    const toUnlock = achievementIds.filter((id) => !alreadyUnlocked.has(id));

    if (toUnlock.length === 0) return;

    // Set unlocked_at for newly eligible achievements
    for (const achievementId of toUnlock) {
      const { error: unlockError } = await this.writeClient
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
    }
  }

  async getProgress(
    familyId: string,
  ): Promise<FamilyAchievementProgressRecord[]> {
    const { data, error } = await this.readClient
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
}
