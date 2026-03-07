import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/hooks/useNotification';
import { userService } from '@/lib/user-service';
import { supabase } from '@/lib/supabase';
import { BasicInfoFields } from './template-form/BasicInfoFields';
import { CharacterAssignments } from './template-form/CharacterAssignments';
import { FormActions } from './template-form/FormActions';
import { QuestConfigFields } from './template-form/QuestConfigFields';
import { RewardFields } from './template-form/RewardFields';
import { TemplateModalShell } from './template-form/TemplateModalShell';
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
      <TemplateModalShell
        title={`${template ? 'Edit' : 'Create'} Quest Template`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <BasicInfoFields
            title={formData.title}
            description={formData.description}
            onChange={handleInputChange}
          />

          <QuestConfigFields
            questType={formData.quest_type}
            recurrencePattern={formData.recurrence_pattern}
            difficulty={formData.difficulty}
            onChange={handleInputChange}
          />

          <RewardFields
            xpReward={formData.xp_reward}
            goldReward={formData.gold_reward}
            onChange={handleInputChange}
          />

          {formData.quest_type === 'INDIVIDUAL' && (
            <CharacterAssignments
              characters={characterList}
              assignedIds={formData.assigned_character_ids}
              onToggle={handleCharacterSelection}
            />
          )}

          <FormActions onCancel={onCancel} />
        </form>
      </TemplateModalShell>
    </>
  );
});

TemplateForm.displayName = 'TemplateForm';

// Backwards compatibility export
export { TemplateForm as QuestTemplateForm };
