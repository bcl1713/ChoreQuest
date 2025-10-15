import type {
  QuestType,
  RecurrencePattern,
  QuestDifficulty,
  QuestCategory,
  ClassBonuses,
} from '@/lib/types/database';

export interface TemplateFormData {
  title: string;
  description: string;
  category: QuestCategory;
  quest_type: QuestType;
  recurrence_pattern: RecurrencePattern;
  difficulty: QuestDifficulty;
  xp_reward: number;
  gold_reward: number;
  assigned_character_ids: string[];
  class_bonuses?: ClassBonuses | null;
}
