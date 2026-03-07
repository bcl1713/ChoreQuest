import type { Database } from "@/lib/types/database-generated";

export type QuestTemplate = Database["public"]["Tables"]["quest_templates"]["Row"];

export interface ExpiredQuest {
  id: string;
  template_id: string | null;
  assigned_to_id: string | null;
  quest_type: "INDIVIDUAL" | "FAMILY";
  status: string;
}

export interface FamilyRow {
  id: string;
  week_start_day: number | null;
  timezone: string | null;
}

export interface TemplateRow {
  id: string;
  is_paused: boolean;
}

export interface GenerationResult {
  success: boolean;
  generated: {
    individual: number;
    family: number;
    total: number;
  };
  errors: string[];
}
