import { QuestTemplateService } from "../quest-template-service";
import { supabase } from "../supabase";

export const mockTemplateId = "template-123";
export const mockFamilyId = "family-123";

export const mockTemplate = {
  id: mockTemplateId,
  title: "Clean Your Room",
  description: "Make your bed and tidy up",
  difficulty: "EASY",
  category: "DAILY",
  xp_reward: 50,
  gold_reward: 10,
  quest_type: "INDIVIDUAL",
  recurrence_pattern: "DAILY",
  is_active: true,
  is_paused: false,
  family_id: mockFamilyId,
  assigned_character_ids: ["char-1", "char-2"],
  created_at: "2025-01-01T10:00:00Z",
  updated_at: "2025-01-01T10:00:00Z",
};

export const mockFamilyTemplate = {
  ...mockTemplate,
  id: "template-456",
  title: "Take Out Trash",
  quest_type: "FAMILY",
  assigned_character_ids: null,
};

export const setupQuestTemplateService = () => {
  const service = new QuestTemplateService();
  const mockFrom = jest.fn();
  (supabase.from as jest.Mock) = mockFrom;
  return { service, mockFrom };
};
