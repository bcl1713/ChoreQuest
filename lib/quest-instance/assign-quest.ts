import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestInstance } from "@/lib/types/database";

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
    throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
  }

  if (quest.status !== "AVAILABLE") {
    throw new Error(`Quest is not available for assignment (status: ${quest.status})`);
  }

  if (quest.quest_type !== "FAMILY") {
    throw new Error("Only FAMILY quests can be assigned");
  }

  const { data: character, error: characterError } = await client
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (characterError || !character) {
    throw new Error(`Failed to fetch character: ${characterError?.message || "Character not found"}`);
  }

  if (character.active_family_quest_id) {
    throw new Error("Hero already has an active family quest. Release the current quest before assigning another.");
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
    throw new Error(`Failed to assign quest: ${updateError.message}`);
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

    throw new Error(`Failed to update character: ${characterUpdateError.message}`);
  }

  return updatedQuest as QuestInstance;
};
