import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestInstance } from "@/lib/types/database";

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

  if (fetchError || !quest) {
    throw new Error(`Failed to fetch quest: ${fetchError?.message || "Quest not found"}`);
  }

  if (quest.status !== "PENDING" && quest.status !== "CLAIMED" && quest.status !== "IN_PROGRESS" && quest.status !== "AVAILABLE") {
    throw new Error(`Quest cannot be released (status: ${quest.status})`);
  }

  if (quest.quest_type !== "FAMILY") {
    throw new Error("Only FAMILY quests can be released");
  }

  if (quest.volunteered_by !== characterId && quest.volunteered_by !== null) {
    throw new Error("Only the hero who claimed this quest can release it");
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
    throw new Error(`Failed to release quest: ${updateError.message}`);
  }

  if (quest.volunteered_by) {
    const { error: characterUpdateError } = await client
      .from("characters")
      .update({ active_family_quest_id: null })
      .eq("id", quest.volunteered_by);

    if (characterUpdateError) {
      throw new Error(`Failed to update character: ${characterUpdateError.message}`);
    }
  }

  return updatedQuest as QuestInstance;
};
