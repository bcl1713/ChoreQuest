import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";

export const questExistsForCycle = async (
  supabase: SupabaseClient<Database>,
  templateId: string,
  cycleStart: Date,
  cycleEnd: Date,
  characterId?: string
): Promise<boolean> => {
  let query = supabase
    .from("quest_instances")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId)
    .gte("cycle_start_date", cycleStart.toISOString())
    .lte("cycle_start_date", cycleEnd.toISOString());

  if (characterId) {
    query = query.eq("assigned_to_id", characterId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error checking for existing quest:", error);
    return false;
  }

  return (count ?? 0) > 0;
};
