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
    if (error) throw new Error(`${label}: ${error.message}`);
    return data;
  };

  return {
    async listFamilies() {
      const { data, error } = await client
        .from("families")
        .select("id, name, active_season_id")
        .order("name", { ascending: true });
      return (requireNoError("Failed to list families", data, error) ?? []) as SeasonResetFamily[];
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
        .select("id, name, active_season_id")
        .eq("id", familyId)
        .maybeSingle();
      return requireNoError("Failed to load family", data, error) as SeasonResetFamily | null;
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
      requireNoError("Failed to update family active season", null, error);
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
