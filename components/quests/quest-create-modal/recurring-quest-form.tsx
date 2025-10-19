"use client";

import React from "react";
import type { TemplateFormData } from "@/lib/types/quest-templates";

export interface RecurringQuestFormProps {
  formData: TemplateFormData;
  familyMembers: Array<{ id: string; name: string | null; email: string }>;
  familyCharacters: Array<{ id: string; name: string; user_id: string | null }>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onToggleCharacter: (characterId: string) => void;
}

const RecurringQuestForm = React.memo(function RecurringQuestForm({
  formData,
  familyMembers,
  familyCharacters,
  onInputChange,
  onToggleCharacter,
}: RecurringQuestFormProps) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Template Title</label>
          <input
            type="text"
            name="title"
            data-testid="recurring-title-input"
            value={formData.title}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            placeholder="e.g., Make Bed"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Recurrence</label>
          <select
            name="recurrence_pattern"
            data-testid="recurring-pattern-select"
            value={formData.recurrence_pattern}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Custom intervals coming soon. Choose daily or weekly for now.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
        <textarea
          name="description"
          data-testid="recurring-description-input"
          value={formData.description}
          onChange={onInputChange}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          rows={3}
          placeholder="Describe what heroes should do each time this repeats"
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Quest Type</label>
          <select
            name="quest_type"
            data-testid="recurring-quest-type-select"
            value={formData.quest_type}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="FAMILY">Family (claimable by any hero)</option>
            <option value="INDIVIDUAL">Individual (auto-assigned)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Difficulty</label>
          <select
            name="difficulty"
            data-testid="recurring-difficulty-select"
            value={formData.difficulty}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">XP Reward</label>
          <input
            type="number"
            name="xp_reward"
            data-testid="recurring-xp-input"
            min={0}
            value={formData.xp_reward}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">Gold Reward</label>
          <input
            type="number"
            name="gold_reward"
            data-testid="recurring-gold-input"
            min={0}
            value={formData.gold_reward}
            onChange={onInputChange}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-3 text-sm text-gray-300">
          <p>Volunteer heroes receive a +20% bonus automatically when they claim family quests.</p>
        </div>
      </div>

      {formData.quest_type === "INDIVIDUAL" && (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">
            Assign to Heroes
          </h4>
          {familyCharacters.length === 0 ? (
            <p className="text-sm text-gray-400" data-testid="no-characters-message">
              No hero characters available yet. Have heroes create their characters first.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3" data-testid="character-list">
              {familyCharacters.map((familyCharacter) => {
                const owner = familyMembers.find((member) => member.id === familyCharacter.user_id);
                return (
                  <label
                    key={familyCharacter.id}
                    className="flex items-center gap-2 text-sm text-gray-200"
                    data-testid={`character-checkbox-${familyCharacter.id}`}
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-gold-500"
                      checked={formData.assigned_character_ids.includes(familyCharacter.id)}
                      onChange={() => onToggleCharacter(familyCharacter.id)}
                    />
                    <span>
                      {familyCharacter.name}
                      {owner ? ` (${owner.name || owner.email})` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Individual recurring quests generate one task per selected hero each cycle.
          </p>
        </div>
      )}
    </>
  );
});

export default RecurringQuestForm;
