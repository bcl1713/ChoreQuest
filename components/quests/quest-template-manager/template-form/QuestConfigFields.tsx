import { ChangeEvent } from 'react';
import { QuestDifficulty, QuestType, RecurrencePattern } from '@/lib/types/database';

interface QuestConfigFieldsProps {
  questType: QuestType;
  recurrencePattern: RecurrencePattern;
  difficulty: QuestDifficulty;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export function QuestConfigFields({
  questType,
  recurrencePattern,
  difficulty,
  onChange,
}: QuestConfigFieldsProps) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="quest_type"
            className="block text-sm font-semibold uppercase text-gray-300 mb-1"
          >
            Quest Type
          </label>
          <select
            id="quest_type"
            name="quest_type"
            value={questType}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="FAMILY">Family</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="recurrence_pattern"
            className="block text-sm font-semibold uppercase text-gray-300 mb-1"
          >
            Recurrence
          </label>
          <select
            id="recurrence_pattern"
            name="recurrence_pattern"
            value={recurrencePattern}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-semibold uppercase text-gray-300 mb-1"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={difficulty}
            onChange={onChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div className="flex items-end text-xs text-gray-400">
          <p>Category automatically follows the recurrence pattern.</p>
        </div>
      </div>
    </>
  );
}
