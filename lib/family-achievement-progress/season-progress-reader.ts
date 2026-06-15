import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";

type FamilyAchievementProgressSelect = {
  family_achievement_id: string;
  unlocked_at: string | null;
  progress: unknown;
  notified?: boolean | null;
};

/**
 * Reads family achievement progress for exactly one active season.
 *
 * The conditional second filter keeps older route-unit-test Supabase doubles
 * usable while production Supabase query builders still receive both filters.
 */
export async function fetchFamilyAchievementProgressForSeason(
  client: SupabaseClient<Database>,
  familyId: string,
  seasonId: string,
  columns = "family_achievement_id, unlocked_at, progress, notified",
): Promise<FamilyAchievementProgressSelect[]> {
  const familyScopedQuery = client
    .from("family_achievement_progress")
    .select(columns)
    .eq("family_id", familyId);

  const seasonScopedQuery =
    typeof (familyScopedQuery as { eq?: unknown }).eq === "function"
      ? familyScopedQuery.eq("season_id", seasonId)
      : familyScopedQuery;

  const { data, error } = await seasonScopedQuery;

  if (error) {
    throw new Error(
      `Failed to fetch family achievement progress: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as FamilyAchievementProgressSelect[];
}
