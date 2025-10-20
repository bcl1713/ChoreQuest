import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/hooks/useNotification';
import { userService } from '@/lib/user-service';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import type {
  QuestTemplate,
  QuestType,
  RecurrencePattern,
  QuestDifficulty,
  ClassBonuses,
  Tables,
} from '@/lib/types/database';
import type { TemplateFormData } from '@/lib/types/quest-templates';
import type { User } from '@/types';

type QuestTemplateFormTemplate = Partial<TemplateFormData>;

interface TemplateFormProps {
  template?: (QuestTemplate | QuestTemplateFormTemplate) | null;
  onSave: (formData: TemplateFormData) => void;
  onCancel: () => void;
}

const toStringArray = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is string => typeof value === 'string');
};

/**
 * TemplateForm component - Form for creating and editing quest templates
 *
 * Handles all template fields including:
 * - Basic info (title, description)
 * - Quest configuration (type, recurrence, difficulty)
 * - Rewards (XP, gold)
 * - Character assignments (for individual quests)
 * - Class bonuses (optional)
 */
export const TemplateForm = React.memo<TemplateFormProps>(({
  template,
  onSave,
  onCancel,
}) => {
  const { profile } = useAuth();
  const { notifications, dismiss, error: showError } = useNotification();
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [familyCharacters, setFamilyCharacters] = useState<Tables<'characters'>[]>([]);
  const [formData, setFormData] = useState<TemplateFormData>({
    title: template?.title ?? '',
    description: template?.description ?? '',
    category: (template?.category as QuestTemplate['category']) ?? 'DAILY',
    quest_type: (template?.quest_type as QuestType) ?? 'INDIVIDUAL',
    recurrence_pattern: (template?.recurrence_pattern as RecurrencePattern) ?? 'DAILY',
    difficulty: (template?.difficulty as QuestDifficulty) ?? 'MEDIUM',
    xp_reward: template?.xp_reward ?? 50,
    gold_reward: template?.gold_reward ?? 25,
    assigned_character_ids: toStringArray(
      (template as { assigned_character_ids?: unknown })?.assigned_character_ids
    ),
    class_bonuses: (template?.class_bonuses as ClassBonuses | null) ?? null,
  });

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!profile?.family_id) return;
      try {
        const members = await userService.getFamilyMembers(profile.family_id);
        setFamilyMembers(members);
        const memberIds = members.map((member) => member.id);
        if (memberIds.length > 0) {
          const { data: charactersData, error: charactersError } = await supabase
            .from('characters')
            .select('*')
            .in('user_id', memberIds);

          if (charactersError) {
            throw charactersError;
          }

          setFamilyCharacters(charactersData || []);
        } else {
          setFamilyCharacters([]);
        }
      } catch (err) {
        console.error('Failed to load family members', err);
      }
    };
    loadFamilyMembers();
  }, [profile?.family_id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      switch (name) {
        case 'title':
        case 'description':
        case 'quest_type':
        case 'difficulty':
          return { ...prev, [name]: value } as TemplateFormData;
        case 'recurrence_pattern': {
          const nextCategory = value === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
          return {
            ...prev,
            recurrence_pattern: value as RecurrencePattern,
            category: nextCategory as QuestTemplate['category'],
          };
        }
        case 'xp_reward':
        case 'gold_reward':
          return { ...prev, [name]: Number(value) } as TemplateFormData;
        default:
          return prev;
      }
    });
  };

  const handleCharacterSelection = useCallback((characterId: string) => {
    setFormData((prev) => {
      const currentlyAssigned = prev.assigned_character_ids;
      if (currentlyAssigned.includes(characterId)) {
        return {
          ...prev,
          assigned_character_ids: currentlyAssigned.filter((id) => id !== characterId),
        };
      } else {
        return {
          ...prev,
          assigned_character_ids: [...currentlyAssigned, characterId],
        };
      }
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quest_type === 'INDIVIDUAL' && formData.assigned_character_ids.length === 0) {
      showError('Individual quests must be assigned to at least one character.');
      return;
    }
    onSave(formData);
  }, [formData, onSave, showError]);

  const characterList = useMemo(
    () =>
      familyCharacters.map((character) => {
        const owner = familyMembers.find((member) => member.id === character.user_id);
        return {
          id: character.id,
          name: character.name,
          ownerName: owner ? owner.name : '',
        };
      }),
    [familyCharacters, familyMembers]
  );

  return (
    <>
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-gray-800 text-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-6">
            {template ? 'Edit' : 'Create'} Quest Template
          </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Title"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              rows={3}
              required
            ></textarea>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quest_type" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
                Quest Type
              </label>
              <select
                id="quest_type"
                name="quest_type"
                value={formData.quest_type}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="FAMILY">Family</option>
              </select>
            </div>
            <div>
              <label htmlFor="recurrence_pattern" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
                Recurrence
              </label>
              <select
                id="recurrence_pattern"
                name="recurrence_pattern"
                value={formData.recurrence_pattern}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="xp_reward" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
                XP Reward
              </label>
              <input
                id="xp_reward"
                type="number"
                name="xp_reward"
                value={formData.xp_reward}
                onChange={handleInputChange}
                placeholder="XP Reward"
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                min={0}
              />
            </div>
            <div>
              <label htmlFor="gold_reward" className="block text-sm font-semibold uppercase text-gray-300 mb-1">
                Gold Reward
              </label>
              <input
                id="gold_reward"
                type="number"
                name="gold_reward"
                value={formData.gold_reward}
                onChange={handleInputChange}
                placeholder="Gold Reward"
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
                min={0}
              />
            </div>
          </div>

          {formData.quest_type === 'INDIVIDUAL' && (
            <div>
              <label className="block text-sm font-semibold uppercase text-gray-300 mb-2">
                Assign to Characters
              </label>
              {familyCharacters.length === 0 ? (
                <p className="text-sm text-gray-400">No characters found for this family.</p>
              ) : (
                <div className="space-y-2">
                  {characterList.map((character) => (
                    <div key={character.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        id={character.id}
                        checked={formData.assigned_character_ids.includes(character.id)}
                        onChange={() => handleCharacterSelection(character.id)}
                        className="form-checkbox h-4 w-4 text-purple-500"
                      />
                      <label htmlFor={character.id}>
                        {character.name}
                        {character.ownerName ? ` (${character.ownerName})` : ''}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
});

TemplateForm.displayName = 'TemplateForm';

// Backwards compatibility export
export { TemplateForm as QuestTemplateForm };
