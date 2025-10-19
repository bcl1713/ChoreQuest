import React, { useState } from 'react';
import type { QuestInstance } from '@/lib/types/database';
import type { TemplateFormData } from '@/lib/types/quest-templates';

interface QuestConversionWizardProps {
  quest: QuestInstance;
  onConvert: (templateData: TemplateFormData, deleteOriginal: boolean) => void;
  onCancel: () => void;
}

const QuestConversionWizard: React.FC<QuestConversionWizardProps> = ({ quest, onConvert, onCancel }) => {
  const [templateData, setTemplateData] = useState<TemplateFormData>({
    title: quest.title,
    description: quest.description ?? '',
    category: quest.category,
    difficulty: quest.difficulty,
    xp_reward: quest.xp_reward,
    gold_reward: quest.gold_reward,
    quest_type: quest.quest_type ?? 'INDIVIDUAL',
    recurrence_pattern: quest.recurrence_pattern ?? 'DAILY',
    assigned_character_ids: [],
    class_bonuses: null,
  });
  const [deleteOriginal, setDeleteOriginal] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setTemplateData((prev) => {
      if (name === 'xp_reward' || name === 'gold_reward') {
        return { ...prev, [name]: Number(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConvert(templateData, deleteOriginal);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Convert Quest to Template</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="title">Template Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={templateData.title}
              onChange={handleInputChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={templateData.description}
              onChange={handleInputChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col text-sm font-semibold">
              Quest Type
              <select
                name="quest_type"
                value={templateData.quest_type}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="FAMILY">Family</option>
              </select>
            </label>

            <label className="flex flex-col text-sm font-semibold">
              Recurrence
              <select
                name="recurrence_pattern"
                value={templateData.recurrence_pattern}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label className="flex flex-col text-sm font-semibold">
              Category
              <select
                name="category"
                value={templateData.category}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BOSS_BATTLE">Boss Battle</option>
              </select>
            </label>

            <label className="flex flex-col text-sm font-semibold">
              Difficulty
              <select
                name="difficulty"
                value={templateData.difficulty}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </label>

            <label className="flex flex-col text-sm font-semibold">
              XP Reward
              <input
                name="xp_reward"
                type="number"
                min={0}
                value={templateData.xp_reward}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              />
            </label>

            <label className="flex flex-col text-sm font-semibold">
              Gold Reward
              <input
                name="gold_reward"
                type="number"
                min={0}
                value={templateData.gold_reward}
                onChange={handleInputChange}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              />
            </label>
          </div>

          <p className="text-sm text-gray-400">Quest: {quest.title}</p>
          
          <div>
            <label className="flex items-center">
              <input type="checkbox" checked={deleteOriginal} onChange={(e) => setDeleteOriginal(e.target.checked)} />
              <span className="ml-2">Delete original quest after conversion</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Convert</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestConversionWizard;
