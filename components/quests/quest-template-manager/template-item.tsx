import React, { useMemo } from 'react';
import type { QuestTemplate, QuestInstance } from '@/lib/types/database';
import QuestCard from '@/components/quests/quest-card';

interface TemplateItemProps {
  template: QuestTemplate;
  onEdit: (template: QuestTemplate) => void;
  onDelete: (template: QuestTemplate) => void;
  onTogglePause: (template: QuestTemplate) => void;
}

/**
 * TemplateItem component - Individual quest template card
 *
 * Uses QuestCard with template-specific action props to display
 * template information and manage template-specific actions
 */
export const TemplateItem = React.memo<TemplateItemProps>(({
  template,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  // Map QuestTemplate to QuestInstance-like object for QuestCard display
  const questDisplay = useMemo((): Partial<QuestInstance> => ({
    id: template.id,
    title: template.title,
    description: template.description ?? '',
    difficulty: template.difficulty,
    xp_reward: template.xp_reward,
    gold_reward: template.gold_reward,
    recurrence_pattern: template.recurrence_pattern as 'DAILY' | 'WEEKLY' | 'CUSTOM',
    quest_type: template.quest_type as 'INDIVIDUAL' | 'FAMILY',
    status: 'AVAILABLE' as const,
  }), [template]);

  return (
    <QuestCard
      quest={questDisplay as QuestInstance}
      viewMode="gm"
      isPaused={template.is_paused ?? false}
      isTemplate={true}
      onEditTemplate={() => onEdit(template)}
      onTogglePauseTemplate={() => onTogglePause(template)}
      onDeleteTemplate={() => onDelete(template)}
    />
  );
});

TemplateItem.displayName = 'TemplateItem';
