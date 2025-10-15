import type {
  QuestDifficulty,
  QuestType,
  RecurrencePattern,
  QuestCategory,
} from "@/lib/types/database";

export interface PresetTemplateDefinition {
  name: string;
  description: string;
  category: QuestCategory;
  quest_type: QuestType;
  recurrence_pattern: RecurrencePattern;
  difficulty: QuestDifficulty;
  xp_reward: number;
  gold_reward: number;
}

export type PresetTemplateCollection = Record<string, PresetTemplateDefinition[]>;

export const presetTemplates: PresetTemplateCollection = {
  'Personal Hygiene': [
    {
      name: 'Brush Teeth',
      description: 'Brush your teeth for two minutes.',
      category: 'DAILY',
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 10,
      gold_reward: 5,
    },
    {
      name: 'Take a Shower',
      description: 'Take a shower or bath.',
      category: 'DAILY',
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 15,
      gold_reward: 5,
    },
  ],
  'Bedroom Chores': [
    {
      name: 'Make Bed',
      description: 'Make your bed every morning.',
      category: 'DAILY',
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 10,
      gold_reward: 5,
    },
    {
      name: 'Clean Room',
      description: 'Clean and tidy your room.',
      category: 'WEEKLY',
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'WEEKLY',
      difficulty: 'MEDIUM',
      xp_reward: 50,
      gold_reward: 25,
    },
  ],
  'Kitchen Chores': [
    {
      name: 'Load Dishwasher',
      description: 'Load the dishwasher with dirty dishes.',
      category: 'DAILY',
      quest_type: 'FAMILY',
      recurrence_pattern: 'DAILY',
      difficulty: 'EASY',
      xp_reward: 20,
      gold_reward: 10,
    },
    {
        name: 'Unload Dishwasher',
        description: 'Unload the clean dishes from the dishwasher.',
        category: 'DAILY',
        quest_type: 'FAMILY',
        recurrence_pattern: 'DAILY',
        difficulty: 'EASY',
        xp_reward: 20,
        gold_reward: 10,
    },
  ],
};
