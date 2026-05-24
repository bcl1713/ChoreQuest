import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreatedSeason,
  SeasonResetActiveSeason,
  SeasonResetCharacter,
  SeasonResetFamily,
  SeasonResetFamilyUser,
  SeasonResetStore,
} from "./start-season-reset";

export function createSupabaseSeasonResetStore(client: SupabaseClient): SeasonResetStore {
  const requireNoError = <T>(label: string, data: T, error: { message: string } | null): T => {
    if (isMissingSeasonsTableError(error)) {
      throw new Error(
        "Seasons table is missing; apply Supabase migration " +
          "supabase/migrations/20260326000001_add_seasons.sql before running admin start-season discovery/reset.",
      );
    }
    if (error) throw new Error(`${label}: ${error.message}`);
    return data;
  };

  return {
    async listFamilies() {
      const { data: familiesData, error: familiesError } = await client
        .from("families")
        .select("id, name")
        .order("name", { ascending: true });
      const families = (requireNoError("Failed to list families", familiesData, familiesError) ?? []) as Array<{
        id: string;
        name: string | null;
      }>;

      const { data: seasonsData, error: seasonsError } = await client
        .from("seasons")
        .select("id, family_id")
        .eq("is_active", true);
      const activeSeasonByFamilyId = new Map(
        ((requireNoError("Failed to list active seasons", seasonsData, seasonsError) ?? []) as Array<{
          id: string;
          family_id: string;
        }>).map((season) => [season.family_id, season.id]),
      );

      return families.map((family): SeasonResetFamily => ({
        ...family,
        active_season_id: activeSeasonByFamilyId.get(family.id) ?? null,
      }));
    },
    async listFamilyUsers(familyId) {
      const { data, error } = await client
        .from("user_profiles")
        .select("id, name, email, characters(id, name)")
        .eq("family_id", familyId)
        .order("name", { ascending: true });
      const rows = (requireNoError("Failed to list family users", data, error) ?? []) as Array<{
        id: string;
        name: string | null;
        email: string | null;
        characters?: Array<{ id: string; name: string | null }> | { id: string; name: string | null } | null;
      }>;
      return rows.map((row): SeasonResetFamilyUser => {
        const character = Array.isArray(row.characters) ? row.characters[0] : row.characters;
        return {
          user_id: row.id,
          user_name: row.name,
          user_email: row.email,
          character_id: character?.id ?? null,
          character_name: character?.name ?? null,
        };
      });
    },
    async loadFamily(familyId) {
      const { data, error } = await client
        .from("families")
        .select("id, name")
        .eq("id", familyId)
        .maybeSingle();
      const family = requireNoError("Failed to load family", data, error) as {
        id: string;
        name: string | null;
      } | null;
      return family ? { ...family, active_season_id: null } : null;
    },
    async loadActiveSeasons(familyId) {
      const { data, error } = await client
        .from("seasons")
        .select("id, name")
        .eq("family_id", familyId)
        .eq("is_active", true);
      return (requireNoError("Failed to load active seasons", data, error) ?? []) as SeasonResetActiveSeason[];
    },
    async loadCharacters(familyId, userIds, allUsers) {
      let query = client
        .from("characters")
        .select("id, user_id, name, xp, level, gold, gems, honor_points, active_family_quest_id, user_profiles!inner(family_id)")
        .eq("user_profiles.family_id", familyId);

      if (!allUsers) {
        query = query.in("user_id", userIds);
      }

      const { data, error } = await query;
      return (requireNoError("Failed to load target characters", data, error) ?? []) as SeasonResetCharacter[];
    },
    async deactivateActiveSeasons(familyId, endsAt) {
      const { error } = await client
        .from("seasons")
        .update({ is_active: false, ends_at: endsAt })
        .eq("family_id", familyId)
        .eq("is_active", true);
      requireNoError("Failed to deactivate current seasons", null, error);
    },
    async createSeason(input) {
      const { data, error } = await client
        .from("seasons")
        .insert(input)
        .select("id")
        .single();
      return requireNoError("Failed to create season", data, error) as CreatedSeason;
    },
    async activateSeason(seasonId) {
      const { error } = await client.from("seasons").update({ is_active: true }).eq("id", seasonId);
      requireNoError("Failed to activate new season", null, error);
    },
    async setFamilyActiveSeason(familyId, seasonId) {
      const { error } = await client
        .from("families")
        .update({ active_season_id: seasonId })
        .eq("id", familyId);
      if (isMissingFamilyActiveSeasonColumnError(error)) {
        return false;
      }
      requireNoError("Failed to update family active season", null, error);
      return true;
    },
    async resetCharacter(characterId, patch) {
      const { error } = await client.from("characters").update(patch).eq("id", characterId);
      requireNoError("Failed to reset character", null, error);
    },
    async deleteCharacterQuestStreaks(characterId) {
      const { count, error } = await client
        .from("character_quest_streaks")
        .delete({ count: "exact" })
        .eq("character_id", characterId);
      requireNoError("Failed to delete character quest streaks", null, error);
      return count ?? 0;
    },
    async countCharacterAchievementsForSeason(seasonId) {
      const { count, error } = await client
        .from("character_achievements")
        .select("id", { count: "exact", head: true })
        .eq("season_id", seasonId);
      requireNoError("Failed to count new-season character achievements", null, error);
      return count ?? 0;
    },
    async countFamilyAchievementProgressForSeason(seasonId) {
      const { count, error } = await client
        .from("family_achievement_progress")
        .select("id", { count: "exact", head: true })
        .eq("season_id", seasonId);
      requireNoError("Failed to count new-season family achievement progress", null, error);
      return count ?? 0;
    },
  };
}

function isMissingFamilyActiveSeasonColumnError(error: { message: string } | null): boolean {
  if (!error) return false;
  return error.message.includes("active_season_id") && error.message.toLowerCase().includes("does not exist");
}

function isMissingSeasonsTableError(error: { message: string } | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes("public.seasons") && (message.includes("schema cache") || message.includes("does not exist"));
}
