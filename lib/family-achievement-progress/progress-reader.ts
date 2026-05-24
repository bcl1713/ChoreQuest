import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { FamilyAchievementProgressRecord } from "./types";

type ReadClient = SupabaseClient<Database>;

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
