import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database-generated";

export type ActiveSeason = {
  id: string;
  family_id: string;
  name: string;
  theme: string | null;
  starts_at: string;
  ends_at: string | null;
};

type SeasonRow = Database["public"]["Tables"]["seasons"]["Row"];

type FamilyActiveSeasonRow = Pick<
  Database["public"]["Tables"]["families"]["Row"],
  "active_season_id"
>;

function toActiveSeason(row: SeasonRow): ActiveSeason {
  return {
    id: row.id,
    family_id: row.family_id,
    name: row.name,
    theme: row.theme,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  };
}

export async function getActiveSeasonForFamily(
  client: SupabaseClient<Database>,
  familyId: string,
): Promise<ActiveSeason | null> {
  const { data: family, error: familyError } = await client
    .from("families")
    .select("active_season_id")
    .eq("id", familyId)
    .maybeSingle<FamilyActiveSeasonRow>();

  if (familyError) {
    throw new Error(`Failed to load family active season: ${familyError.message}`);
  }

  if (family?.active_season_id) {
    const { data: season, error: seasonError } = await client
      .from("seasons")
      .select("id, family_id, name, theme, starts_at, ends_at")
      .eq("id", family.active_season_id)
      .eq("family_id", familyId)
      .maybeSingle<SeasonRow>();

    if (seasonError) {
      throw new Error(`Failed to load active season: ${seasonError.message}`);
    }

    return season ? toActiveSeason(season) : null;
  }

  const { data: fallbackSeason, error: fallbackError } = await client
    .from("seasons")
    .select("id, family_id, name, theme, starts_at, ends_at")
    .eq("family_id", familyId)
    .eq("is_active", true)
    .maybeSingle<SeasonRow>();

  if (fallbackError) {
    throw new Error(`Failed to load active season: ${fallbackError.message}`);
  }

  return fallbackSeason ? toActiveSeason(fallbackSeason) : null;
}
