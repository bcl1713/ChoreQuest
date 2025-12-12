import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { ExpiredQuest, TemplateRow } from "./types";

const resetStreak = async (
  supabase: SupabaseClient<Database>,
  characterId: string,
  templateId: string
) => {
  const { error } = await supabase
    .from("character_quest_streaks")
    .update({ current_streak: 0 })
    .eq("character_id", characterId)
    .eq("template_id", templateId);

  if (error) {
    console.error(
      `Failed to reset streak for character ${characterId}, template ${templateId}:`,
      error
    );
  }
};

export interface ExpirationResult {
  success: boolean;
  expired: {
    individual: number;
    family: number;
    total: number;
  };
  streaksBroken: number;
  errors: string[];
}

export const expireQuests = async (
  supabase: SupabaseClient<Database>
): Promise<ExpirationResult> => {
  const result: ExpirationResult = {
    success: true,
    expired: { individual: 0, family: 0, total: 0 },
    streaksBroken: 0,
    errors: [],
  };

  try {
    const now = new Date().toISOString();
    const { data: expiredQuests, error: fetchError } = await supabase
      .from("quest_instances")
      .select("id, template_id, assigned_to_id, quest_type, status")
      .not("template_id", "is", null)
      .lt("cycle_end_date", now)
      .in("status", ["PENDING", "IN_PROGRESS", "AVAILABLE", "CLAIMED"]) as { data: ExpiredQuest[] | null; error: { message: string } | null };

    if (fetchError) {
      result.success = false;
      result.errors.push(`Failed to fetch expired quests: ${fetchError.message}`);
      return result;
    }

    if (!expiredQuests || expiredQuests.length === 0) {
      return result;
    }

    const templateIds = [...new Set(expiredQuests.map((q) => q.template_id).filter(Boolean))] as string[];
    const { data: templates } = await supabase
      .from("quest_templates")
      .select("*")
      .in("id", templateIds) as { data: TemplateRow[] | null };

    const pausedTemplateIds = new Set((templates || []).filter((t) => t.is_paused).map((t) => t.id));

    const questIds = expiredQuests.map((q) => q.id);
    const { error: updateError } = await supabase.from("quest_instances").update({ status: "MISSED" }).in("id", questIds);

    if (updateError) {
      result.success = false;
      result.errors.push(`Failed to mark quests as MISSED: ${updateError.message}`);
      return result;
    }

    const familyQuestIdsWithActiveHeroes = expiredQuests
      .filter((q) => q.quest_type === "FAMILY" && Boolean(q.assigned_to_id))
      .map((q) => q.id);

    if (familyQuestIdsWithActiveHeroes.length > 0) {
      const { error: clearError } = await supabase
        .from("characters")
        .update({ active_family_quest_id: null })
        .in("active_family_quest_id", familyQuestIdsWithActiveHeroes);

      if (clearError) {
        result.errors.push(`Failed to clear active_family_quest_id: ${clearError.message}`);
      }
    }

    for (const quest of expiredQuests) {
      if (quest.quest_type === "INDIVIDUAL") {
        result.expired.individual++;
      } else if (quest.quest_type === "FAMILY") {
        result.expired.family++;
      }
    }
    result.expired.total = expiredQuests.length;

    for (const quest of expiredQuests) {
      if (
        quest.quest_type === "INDIVIDUAL" &&
        quest.assigned_to_id &&
        quest.template_id &&
        !pausedTemplateIds.has(quest.template_id)
      ) {
        const { data: character } = await supabase
          .from("characters")
          .select("id")
          .eq("user_id", quest.assigned_to_id)
          .single();

        if (character) {
          await resetStreak(supabase, character.id, quest.template_id);
          result.streaksBroken++;
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error during quest expiration");
  }

  return result;
};
