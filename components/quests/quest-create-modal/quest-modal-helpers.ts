import { supabase } from "@/lib/supabase";
import { questTemplateService } from "@/lib/quest-template-service";
import type { TemplateFormData } from "@/lib/types/quest-templates";
import { validateFutureDate } from "@/lib/utils/validation";

export interface CreateQuestFromTemplateParams {
  selectedTemplateId: string;
  userId: string;
  assignedToId: string;
  dueDate: string;
}

export interface CreateRecurringTemplateParams {
  formData: TemplateFormData;
  familyId: string;
}

export interface CreateAdhocQuestParams {
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: string;
  category: string;
  familyId: string | null;
  userId: string;
  assignedToId: string;
  dueDate: string;
}

export async function createQuestFromTemplate(
  params: CreateQuestFromTemplateParams
): Promise<void> {
  const { selectedTemplateId, userId, assignedToId, dueDate } = params;

  if (!selectedTemplateId) {
    throw new Error("Please select a quest template");
  }

  await questTemplateService.createQuestFromTemplate(
    selectedTemplateId,
    userId,
    {
      assignedToId: assignedToId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    }
  );
}

export async function createRecurringTemplate(
  params: CreateRecurringTemplateParams
): Promise<void> {
  const { formData, familyId } = params;

  if (!familyId) {
    throw new Error("Family context not found");
  }

  if (!formData.title.trim() || !formData.description.trim()) {
    throw new Error("Please fill in all required fields");
  }

  if (
    formData.quest_type === "INDIVIDUAL" &&
    formData.assigned_character_ids.length === 0
  ) {
    throw new Error("Select at least one hero for individual recurring quests");
  }

  const payload = {
    ...formData,
    title: formData.title.trim(),
    description: formData.description.trim(),
    category: formData.recurrence_pattern === "WEEKLY" ? "WEEKLY" : "DAILY",
    family_id: familyId,
    is_active: true,
    is_paused: false,
  };

  const { error: templateError } = await supabase
    .from("quest_templates")
    .insert(payload);

  if (templateError) {
    throw templateError;
  }
}

export async function createAdhocQuest(
  params: CreateAdhocQuestParams
): Promise<void> {
  const {
    title,
    description,
    xpReward,
    goldReward,
    difficulty,
    category,
    familyId,
    userId,
    assignedToId,
    dueDate,
  } = params;

  if (!title.trim() || !description.trim()) {
    throw new Error("Please fill in all required fields");
  }

  const questData = {
    title: title.trim(),
    description: description.trim(),
    xp_reward: xpReward,
    gold_reward: goldReward,
    difficulty,
    category,
    status: assignedToId ? "CLAIMED" : "AVAILABLE",
    family_id: familyId,
    created_by_id: userId,
    assigned_to_id: assignedToId || null,
    due_date: dueDate ? new Date(dueDate).toISOString() : null,
    quest_type: "FAMILY",
  };

  const { error: insertError } = await supabase
    .from("quest_instances")
    .insert(questData);

  if (insertError) {
    throw insertError;
  }
}

export function validateDueDate(dueDate: string): { isValid: boolean; error: string | null } {
  const validation = validateFutureDate(dueDate, "Due date");
  return {
    isValid: validation.isValid,
    error: validation.error ?? "Due date must be in the future",
  };
}
