import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestInstance } from "@/lib/types/database";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

type AssignQuestDeps = {
  client: SupabaseClient<Database>;
};

export const assignQuest = async (
  deps: AssignQuestDeps,
  questId: string,
  characterId: string
): Promise<QuestInstance> => {
  const { client } = deps;

  const { data: quest, error: fetchError } = await client
    .from("quest_instances")
    .select("*")
    .eq("id", questId)
    .single();

  if (fetchError || !quest) {
    throw new NotFoundError(
      `Failed to fetch quest: ${fetchError?.message || "Quest not found"}`,
      "QUEST_NOT_FOUND",
    );
  }

  if (quest.status !== "AVAILABLE") {
    throw new ConflictError(
      `Quest is not available for assignment (status: ${quest.status})`,
      "QUEST_NOT_ASSIGNABLE",
    );
  }

  if (quest.quest_type !== "FAMILY") {
    throw new ValidationError(
      "Only FAMILY quests can be assigned",
      "QUEST_TYPE_INVALID",
    );
  }

  const { data: character, error: characterError } = await client
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (characterError || !character) {
    throw new NotFoundError(
      `Failed to fetch character: ${characterError?.message || "Character not found"}`,
      "CHARACTER_NOT_FOUND",
    );
  }

  if (character.active_family_quest_id) {
    throw new ConflictError(
      "Hero already has an active family quest. Release the current quest before assigning another.",
      "ACTIVE_FAMILY_QUEST_EXISTS",
    );
  }

  const { data: updatedQuest, error: updateError } = await client
    .from("quest_instances")
    .update({
      assigned_to_id: character.user_id,
      volunteered_by: characterId,
      volunteer_bonus: null,
      status: "PENDING",
    })
    .eq("id", questId)
    .select()
    .single();

  if (updateError) {
    throw new ConflictError(
      `Failed to assign quest: ${updateError.message}`,
      "QUEST_ASSIGN_FAILED",
    );
  }

  const { error: characterUpdateError } = await client
    .from("characters")
    .update({ active_family_quest_id: questId })
    .eq("id", characterId);

  if (characterUpdateError) {
    await client
      .from("quest_instances")
      .update({
        assigned_to_id: null,
        volunteered_by: null,
        volunteer_bonus: null,
        status: "AVAILABLE",
      })
      .eq("id", questId);

    throw new ConflictError(
      `Failed to update character: ${characterUpdateError.message}`,
      "CHARACTER_UPDATE_FAILED",
    );
  }

  return updatedQuest as QuestInstance;
};
