/**
 * Quest Template Service
 * Handles all CRUD operations for quest templates with family-scoped RLS compliance
 */

import { supabase } from "@/lib/supabase";
import {
  QuestTemplate,
  CreateQuestTemplateInput,
  UpdateQuestTemplateInput,
  QuestInstance,
} from "@/lib/types/database";

export class QuestTemplateService {
  /**
   * Get all active quest templates for a family
   * @param familyId - The family ID to fetch templates for
   * @returns Array of active quest templates
   */
  async getTemplatesForFamily(familyId: string): Promise<QuestTemplate[]> {
    const { data, error } = await supabase
      .from("quest_templates")
      .select("*")
      .eq("family_id", familyId)
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to fetch quest templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new quest template
   * @param input - Template creation data
   * @returns The created quest template
   */
  async createTemplate(input: CreateQuestTemplateInput): Promise<QuestTemplate> {
    const { data, error } = await supabase
      .from("quest_templates")
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create quest template: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing quest template
   * @param templateId - The template ID to update
   * @param input - Template update data
   * @returns The updated quest template
   */
  async updateTemplate(
    templateId: string,
    input: UpdateQuestTemplateInput
  ): Promise<QuestTemplate> {
    const { data, error } = await supabase
      .from("quest_templates")
      .update(input)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update quest template: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a quest template by setting is_active to false
   * @param templateId - The template ID to delete
   * @returns The deleted quest template
   */
  async deleteTemplate(templateId: string): Promise<QuestTemplate> {
    const { data, error } = await supabase
      .from("quest_templates")
      .update({ is_active: false })
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete quest template: ${error.message}`);
    }

    return data;
  }

  /**
   * Reactivate a soft-deleted quest template
   * @param templateId - The template ID to activate
   * @returns The activated quest template
   */
  async activateTemplate(templateId: string): Promise<QuestTemplate> {
    const { data, error } = await supabase
      .from("quest_templates")
      .update({ is_active: true })
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate quest template: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a quest instance from a template
   * @param templateId - The template ID to use
   * @param createdById - The user ID creating the quest
   * @param options - Optional overrides for assigned_to and due_date
   * @returns The created quest instance
   */
  async createQuestFromTemplate(
    templateId: string,
    createdById: string,
    options?: {
      assignedToId?: string;
      dueDate?: string;
    }
  ): Promise<QuestInstance> {
    // Fetch the template
    const { data: template, error: fetchError } = await supabase
      .from("quest_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (fetchError || !template) {
      throw new Error(`Failed to fetch template: ${fetchError?.message || "Template not found"}`);
    }

    // Create quest instance from template
    // Note: template_id is stored for tracking/analytics only, not as a foreign key
    // Templates are blueprints - quests remain independent after creation
    const questData = {
      title: template.title,
      description: template.description,
      xp_reward: template.xp_reward,
      gold_reward: template.gold_reward,
      difficulty: template.difficulty,
      category: template.category,
      family_id: template.family_id,
      template_id: templateId, // For tracking which template was used (not a FK)
      created_by_id: createdById,
      assigned_to_id: options?.assignedToId || null,
      due_date: options?.dueDate || null,
      status: "PENDING" as const,
    };

    const { data: questInstance, error: createError } = await supabase
      .from("quest_instances")
      .insert(questData)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create quest from template: ${createError.message}`);
    }

    return questInstance;
  }
}

// Export a singleton instance
export const questTemplateService = new QuestTemplateService();
