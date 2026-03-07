import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { QuestTemplate } from "./types";
import { questExistsForCycle } from "./quest-exists";

export const generateFamilyQuest = async (
  supabase: SupabaseClient<Database>,
  template: QuestTemplate,
  cycleStart: Date,
  cycleEnd: Date,
  gmUserId: string
): Promise<{ count: number; errors: string[] }> => {
  const errors: string[] = [];

  const exists = await questExistsForCycle(supabase, template.id, cycleStart, cycleEnd);
  if (exists) {
    return { count: 0, errors };
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
    assigned_to_id: null,
    status: "AVAILABLE" as const,
    quest_type: "FAMILY" as const,
    cycle_start_date: cycleStart.toISOString(),
    cycle_end_date: cycleEnd.toISOString(),
    volunteer_bonus: 0,
    streak_count: 0,
    streak_bonus: 0,
  };

  const { error: insertError } = await supabase.from("quest_instances").insert(questInstance);

  if (insertError) {
    errors.push(`Failed to create family quest: ${insertError.message}`);
    return { count: 0, errors };
  }

  return { count: 1, errors };
};
