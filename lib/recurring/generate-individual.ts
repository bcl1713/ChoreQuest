import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestTemplate } from "./types";
import { questExistsForCycle } from "./quest-exists";

export const generateIndividualQuests = async (
  supabase: SupabaseClient<Database>,
  template: QuestTemplate & { assigned_character_ids: string[] },
  cycleStart: Date,
  cycleEnd: Date,
  gmUserId: string
): Promise<{ count: number; errors: string[] }> => {
  let count = 0;
  const errors: string[] = [];

  const characterIds = template.assigned_character_ids || [];
  if (characterIds.length === 0) {
    return { count, errors };
  }

  const { data: characters, error: charError } = await supabase
    .from("characters")
    .select("id, user_id")
    .in("id", characterIds);

  if (charError) {
    errors.push(`Failed to fetch characters for template ${template.id}: ${charError.message}`);
    return { count, errors };
  }

  for (const character of characters || []) {
    if (!character.user_id) {
      errors.push(`Character ${character.id} has no user_id`);
      continue;
    }

    const exists = await questExistsForCycle(
      supabase,
      template.id,
      cycleStart,
      cycleEnd,
      character.user_id
    );

    if (exists) {
      continue;
    }

    const questInstance = {
      template_id: template.id,
      recurrence_pattern: template.recurrence_pattern,
      title: template.title,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      xp_reward: template.xp_reward,
      gold_reward: template.gold_reward,
      family_id: template.family_id,
      created_by_id: gmUserId,
      assigned_to_id: character.user_id,
      status: "PENDING" as const,
      quest_type: "INDIVIDUAL" as const,
      cycle_start_date: cycleStart.toISOString(),
      cycle_end_date: cycleEnd.toISOString(),
      volunteer_bonus: 0,
      streak_count: 0,
      streak_bonus: 0,
    };

    const { error: insertError } = await supabase.from("quest_instances").insert(questInstance);

    if (insertError) {
      errors.push(`Failed to create individual quest: ${insertError.message}`);
      continue;
    }

    count++;
  }

  return { count, errors };
};
