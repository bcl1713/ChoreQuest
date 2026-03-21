import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import {
  EVENT_CRITERIA_MAP,
  ALL_CRITERIA_TYPES,
  EVALUATOR_REGISTRY,
} from "./achievement-progress/evaluators";
import {
  runUnlockEvaluation,
  buildProgressValue,
} from "./achievement-progress/unlock-engine";
import type {
  AchievementEvent,
  AchievementProgressRecord,
  AchievementProgressValue,
  CriteriaConfig,
} from "./achievement-progress/types";
import type { FetchedAchievement } from "./achievement-progress/unlock-engine";

export type {
  AchievementEventType,
  AchievementEvent,
  AchievementProgressRecord,
  CriteriaConfig,
  EvaluatorFn,
} from "./achievement-progress/types";
export {
  EVENT_CRITERIA_MAP,
  ALL_CRITERIA_TYPES,
} from "./achievement-progress/evaluators";

// ─── Service class ───────────────────────────────────────────────────────────

export class AchievementProgressService {
  private readonly readClient: SupabaseClient<Database>;
  private readonly writeClient: SupabaseClient<Database>;

  constructor(readClient?: SupabaseClient<Database>) {
    this.writeClient = createServiceSupabaseClient();
    this.readClient = readClient ?? this.writeClient;
  }

  private async resolveCharacterContext(
    characterId: string,
  ): Promise<{ userId: string; familyId: string | null }> {
    const { data, error } = await this.readClient
      .from("characters")
      .select("user_id, user_profiles!characters_user_id_fkey(family_id)")
      .eq("id", characterId)
      .single();

    if (error || !data) {
      throw new Error(
        `Character not found: ${characterId}${error ? ` (${error.message})` : ""}`,
      );
    }

    if (!data.user_id) {
      throw new Error(`Character ${characterId} has no associated user`);
    }

    const userProfile = data.user_profiles as {
      family_id?: string | null;
    } | null;
    return {
      userId: data.user_id,
      familyId: userProfile?.family_id ?? null,
    };
  }

  private async fetchAchievements(
    familyId: string | null,
  ): Promise<FetchedAchievement[]> {
    let query = this.readClient
      .from("achievements")
      .select(
        "id, name, criteria_type, criteria_config, xp_reward, gold_reward",
      );

    if (familyId) {
      query = query.or(`family_id.eq.${familyId},family_id.is.null`);
    } else {
      query = query.is("family_id", null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch achievements: ${error.message}`);
    }

    return (data ?? []) as FetchedAchievement[];
  }

  private async fetchExistingAchievementIds(
    characterId: string,
  ): Promise<Set<string>> {
    const { data, error } = await this.readClient
      .from("character_achievements")
      .select("achievement_id")
      .eq("character_id", characterId);

    if (error) {
      throw new Error(`Failed to check progress: ${error.message}`);
    }

    return new Set((data ?? []).map((row) => row.achievement_id));
  }

  async updateProgress(
    characterId: string,
    event: AchievementEvent,
  ): Promise<void> {
    const { userId, familyId } =
      await this.resolveCharacterContext(characterId);
    const achievements = await this.fetchAchievements(familyId);
    const existingAchievementIds =
      await this.fetchExistingAchievementIds(characterId);
    // Backfill when any achievement row is missing, not just on zero rows.
    // This handles both first-call and post-deployment cases where new
    // achievements are added after a character's initial backfill.
    const needsBackfill = achievements.some(
      (a) => !existingAchievementIds.has(a.id),
    );

    const criteriaTypesToEvaluate = needsBackfill
      ? ALL_CRITERIA_TYPES.slice()
      : (EVENT_CRITERIA_MAP[event.type] ?? []);

    for (const a of achievements) {
      if (!EVALUATOR_REGISTRY[a.criteria_type]) {
        console.warn(
          `Unknown criteria type: ${a.criteria_type} — skipping achievement ${a.id}`,
        );
      }
    }

    const relevantAchievements = achievements.filter(
      (a) =>
        criteriaTypesToEvaluate.includes(a.criteria_type) &&
        EVALUATOR_REGISTRY[a.criteria_type],
    );

    if (relevantAchievements.length === 0) return;

    const upsertRows: {
      character_id: string;
      achievement_id: string;
      progress: AchievementProgressValue;
    }[] = [];

    for (const achievement of relevantAchievements) {
      const evaluator = EVALUATOR_REGISTRY[achievement.criteria_type];
      if (!evaluator) {
        console.warn(
          `Unknown criteria type: ${achievement.criteria_type} — skipping achievement ${achievement.id}`,
        );
        continue;
      }

      const config = achievement.criteria_config as CriteriaConfig;
      const result = await evaluator(
        this.readClient,
        characterId,
        userId,
        config,
      );

      upsertRows.push({
        character_id: characterId,
        achievement_id: achievement.id,
        progress: buildProgressValue(achievement.criteria_type, result, config),
      });
    }

    if (upsertRows.length === 0) return;

    const { error } = await this.writeClient
      .from("character_achievements")
      .upsert(upsertRows, {
        onConflict: "character_id,achievement_id",
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to upsert progress: ${error.message}`);
    }

    // 8.1 Wire unlock evaluation as post-step; 8.2 wrap so failures are non-blocking
    try {
      const allAchievementsMap = new Map(achievements.map((a) => [a.id, a]));
      await runUnlockEvaluation(
        characterId,
        upsertRows,
        allAchievementsMap,
        this.readClient,
        this.writeClient,
      );
    } catch (unlockErr) {
      console.error(
        `Unlock evaluation failed for character ${characterId}:`,
        unlockErr,
      );
    }
  }

  async getProgress(characterId: string): Promise<AchievementProgressRecord[]> {
    const { data, error } = await this.readClient
      .from("character_achievements")
      .select(
        `
        character_id,
        achievement_id,
        unlocked_at,
        progress,
        notified,
        achievements (
          id,
          name,
          description,
          criteria_type,
          criteria_config
        )
      `,
      )
      .eq("character_id", characterId);

    if (error) {
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    if (!data) return [];

    return data.map((row) => {
      const achievement = Array.isArray(row.achievements)
        ? row.achievements[0]
        : row.achievements;
      return {
        character_id: row.character_id,
        achievement_id: row.achievement_id,
        unlocked_at: row.unlocked_at,
        progress: row.progress as AchievementProgressValue | null,
        notified: row.notified,
        achievement: achievement as AchievementProgressRecord["achievement"],
      };
    });
  }
}
