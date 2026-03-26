import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import {
  FAMILY_EVALUATOR_REGISTRY,
  FAMILY_EVENT_CRITERIA_MAP,
  ALL_FAMILY_CRITERIA_TYPES,
  isCharBased,
} from "./family-achievement-progress/family-evaluators";
import type {
  AchievementEvent,
  FetchedFamilyAchievement,
  FamilyCriteriaConfig,
  FamilyAchievementProgressRecord,
} from "./family-achievement-progress/types";
import {
  recomputeAchievementImpl,
  getProgressImpl,
  evaluateUnlocksImpl,
} from "./family-achievement-progress/service-helpers";

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
    allUserIds: string[];
    totalMemberCount: number;
    membersWithCharCount: number;
    memberPairs: import("./family-achievement-progress/types").FamilyMemberPair[];
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
    const allUserIds: string[] = [];
    const usersWithChars = new Set<string>();
    const memberPairs: import("./family-achievement-progress/types").FamilyMemberPair[] =
      [];

    for (const profile of data) {
      allUserIds.push(profile.id);
      const chars = Array.isArray(profile.characters)
        ? profile.characters
        : profile.characters
          ? [profile.characters]
          : [];
      const charIds: string[] = [];
      for (const char of chars) {
        const charId = (char as { id: string }).id;
        userIds.push(profile.id);
        characterIds.push(charId);
        usersWithChars.add(profile.id);
        charIds.push(charId);
      }
      memberPairs.push({ userId: profile.id, characterIds: charIds });
    }

    return {
      userIds,
      characterIds,
      allUserIds,
      totalMemberCount: data.length,
      membersWithCharCount: usersWithChars.size,
      memberPairs,
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

  async backfillProgress(familyId: string): Promise<void> {
    await this.updateProgress(familyId, null);
  }

  // Returns true if progress was stale (missing rows or roster changed) and a backfill ran.
  async backfillIfStale(
    familyId: string,
    hasMissingProgress: boolean,
    storedMemberCounts: number[],
    storedMembersWithCharCounts: number[],
    hasLegacyRows: boolean,
  ): Promise<boolean> {
    let rosterChanged = false;

    if (hasLegacyRows) {
      rosterChanged = true;
    } else if (
      storedMemberCounts.length > 0 ||
      storedMembersWithCharCounts.length > 0
    ) {
      const { count, error: ce } = await this.readClient
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("family_id", familyId);
      if (ce)
        throw new Error(`Failed to fetch family member count: ${ce.message}`);
      const current = count ?? 0;
      rosterChanged = storedMemberCounts.some((mc) => mc !== current);

      if (!rosterChanged && storedMembersWithCharCounts.length > 0) {
        const { data: withChars, error: wce } = await this.readClient
          .from("user_profiles")
          .select("id, characters!inner(id)")
          .eq("family_id", familyId);
        if (wce)
          throw new Error(
            `Failed to fetch members with characters: ${wce.message}`,
          );
        const currentWithChars = (withChars ?? []).length;
        rosterChanged = storedMembersWithCharCounts.some(
          (mc) => mc !== currentWithChars,
        );
      }
    }

    if (!hasMissingProgress && !rosterChanged) return false;
    await this.backfillProgress(familyId);
    return true;
  }

  async updateProgress(
    familyId: string,
    event: AchievementEvent | null,
  ): Promise<void> {
    const {
      userIds,
      characterIds,
      allUserIds,
      totalMemberCount,
      membersWithCharCount,
      memberPairs,
    } = await this.resolveFamilyCharacters(familyId);
    const achievements = await this.fetchFamilyAchievements(familyId);
    const existingProgressIds = await this.fetchExistingProgressIds(familyId);

    if (achievements.length === 0) return;

    // null event means explicit backfill — always evaluate all criteria
    const criteriaTypesToEvaluate =
      event === null || achievements.some((a) => !existingProgressIds.has(a.id))
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
      progress: { current: number; threshold: number } & Record<string, number>;
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
        allUserIds,
        mode,
        memberPairs,
        config,
      );
      const guardFails =
        mode === "all" &&
        membersWithCharCount < totalMemberCount &&
        isCharBased(achievement.criteria_type);
      const current = guardFails ? 0 : result.current;

      upsertRows.push({
        family_id: familyId,
        family_achievement_id: achievement.id,
        progress: {
          current,
          threshold,
          member_count: totalMemberCount,
          members_with_char_count: membersWithCharCount,
        },
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

    await evaluateUnlocksImpl(
      this.readClient,
      this.writeClient,
      familyId,
      upsertRows,
    );
  }

  async recomputeAchievement(
    familyId: string,
    achievementId: string,
  ): Promise<void> {
    const familyContext = await this.resolveFamilyCharacters(familyId);
    await recomputeAchievementImpl(
      this.readClient,
      this.writeClient,
      familyId,
      achievementId,
      familyContext,
    );
  }

  async getProgress(
    familyId: string,
  ): Promise<FamilyAchievementProgressRecord[]> {
    return getProgressImpl(this.readClient, familyId);
  }
}
