/**
 * Recurring Quest Generator Service
 *
 * Handles the core logic for generating recurring quest instances
 * from quest templates.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database-generated";
import { calculateCycleDates } from "./recurring/cycle";
import { generateFamilyQuest } from "./recurring/generate-family";
import { generateIndividualQuests } from "./recurring/generate-individual";
import { expireQuests, ExpirationResult } from "./recurring/expiration";
import type { FamilyRow, GenerationResult, QuestTemplate } from "./recurring/types";

type QuestTemplateWithAssignments = QuestTemplate & {
  assigned_character_ids: string[];
  quest_type: "INDIVIDUAL" | "FAMILY";
  recurrence_pattern: "DAILY" | "WEEKLY" | "CUSTOM";
  family_id: string;
  created_at: string;
};

const buildFamilyConfigMaps = (families: FamilyRow[] | null) => {
  const weekStartMap = new Map((families || []).map((f) => [f.id, f.week_start_day ?? 0]));
  const timezoneMap = new Map((families || []).map((f) => [f.id, f.timezone ?? "UTC"]));
  return { weekStartMap, timezoneMap };
};

const resolveGmUserId = async (
  supabase: SupabaseClient<Database>,
  fallbackTemplate: QuestTemplateWithAssignments | undefined
) => {
  const { data: gmProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("role", "GUILD_MASTER")
    .limit(1)
    .single();

  return gmProfile?.id || fallbackTemplate?.created_at || "system";
};

export { expireQuests };
export type { ExpirationResult };

export async function generateRecurringQuests(
  supabase: SupabaseClient<Database>
): Promise<GenerationResult> {
  const result: GenerationResult = {
    success: true,
    generated: { individual: 0, family: 0, total: 0 },
    errors: [],
  };

  try {
    const { data: templates, error: templatesError } = await supabase
      .from("quest_templates")
      .select("*")
      .eq("is_active", true)
      .eq("is_paused", false)
      .not("recurrence_pattern", "is", null);

    if (templatesError) {
      result.success = false;
      result.errors.push(`Failed to fetch templates: ${templatesError.message}`);
      return result;
    }

    if (!templates || templates.length === 0) {
      return result;
    }

    const familyIds = [...new Set(templates.map((t) => t.family_id).filter(Boolean))] as string[];
    const { data: families } = await supabase
      .from("families")
      .select("*")
      .in("id", familyIds) as { data: FamilyRow[] | null };

    const { weekStartMap, timezoneMap } = buildFamilyConfigMaps(families || []);
    const gmUserId = await resolveGmUserId(
      supabase,
      (templates as QuestTemplateWithAssignments[])[0]
    );

    for (const template of templates as QuestTemplateWithAssignments[]) {
      const timezone = (timezoneMap.get(template.family_id || "") ?? "UTC") as string;
      const weekStartDay = (weekStartMap.get(template.family_id || "") ?? 0) as number;
      const { cycleStart, cycleEnd } = calculateCycleDates(
        template.recurrence_pattern || "DAILY",
        timezone,
        weekStartDay
      );

      if (template.quest_type === "INDIVIDUAL") {
        const { count, errors } = await generateIndividualQuests(
          supabase,
          template,
          cycleStart,
          cycleEnd,
          gmUserId
        );
        result.generated.individual += count;
        result.errors.push(...errors);
      } else if (template.quest_type === "FAMILY") {
        const { count, errors } = await generateFamilyQuest(
          supabase,
          template,
          cycleStart,
          cycleEnd,
          gmUserId
        );
        result.generated.family += count;
        result.errors.push(...errors);
      }
    }

    result.generated.total = result.generated.individual + result.generated.family;
    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error during quest generation");
  }

  return result;
}
