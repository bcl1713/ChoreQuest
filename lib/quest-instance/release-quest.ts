import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestInstance } from "@/lib/types/database";
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

type ReleaseQuestDeps = {
  client: SupabaseClient<Database>;
};

export const releaseQuest = async (
  deps: ReleaseQuestDeps,
  questId: string,
  characterId: string
): Promise<QuestInstance> => {
  const { client } = deps;

  const { data: quest, error: fetchError } = await client
    .from("quest_instances")
    .select("*")
    .eq("id", questId)
    .single();

  if (fetchError) {
    throw new AppError(
      `Failed to fetch quest: ${fetchError.message}`,
      500,
      "QUEST_FETCH_FAILED",
    );
  }

  if (!quest) {
    throw new NotFoundError(
      "Quest not found",
      "QUEST_NOT_FOUND",
    );
  }

  if (quest.status !== "PENDING" && quest.status !== "CLAIMED" && quest.status !== "IN_PROGRESS" && quest.status !== "AVAILABLE") {
    throw new ConflictError(
      `Quest cannot be released (status: ${quest.status})`,
      "QUEST_NOT_RELEASABLE",
    );
  }

  if (quest.quest_type !== "FAMILY") {
    throw new ValidationError(
      "Only FAMILY quests can be released",
      "QUEST_TYPE_INVALID",
    );
  }

  if (quest.volunteered_by !== characterId && quest.volunteered_by !== null) {
    throw new ConflictError(
      "Only the hero who claimed this quest can release it",
      "QUEST_RELEASE_FORBIDDEN",
    );
  }

  const { data: updatedQuest, error: updateError } = await client
    .from("quest_instances")
    .update({
      assigned_to_id: null,
      volunteered_by: null,
      volunteer_bonus: null,
      status: "AVAILABLE",
    })
    .eq("id", questId)
    .select()
    .single();

  if (updateError) {
    throw new ConflictError(
      `Failed to release quest: ${updateError.message}`,
      "QUEST_RELEASE_FAILED",
    );
  }

  if (quest.volunteered_by) {
    const { error: characterUpdateError } = await client
      .from("characters")
      .update({ active_family_quest_id: null })
      .eq("id", quest.volunteered_by);

    if (characterUpdateError) {
      throw new ConflictError(
        `Failed to update character: ${characterUpdateError.message}`,
        "CHARACTER_UPDATE_FAILED",
      );
    }
  }

  return updatedQuest as QuestInstance;
};
