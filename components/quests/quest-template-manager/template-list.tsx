import React, { useMemo } from 'react';
import type { QuestTemplate } from '@/lib/types/database';
import { TemplateItem } from './template-item';

interface TemplateListProps {
  templates: QuestTemplate[];
  onEdit: (template: QuestTemplate) => void;
  onDelete: (template: QuestTemplate) => void;
  onTogglePause: (template: QuestTemplate) => void;
}

/**
 * TemplateList component - Displays quest templates grouped by type
 *
 * Separates templates into individual and family categories with appropriate
 * icons and styling for each group.
 */
export const TemplateList = React.memo<TemplateListProps>(({
  templates,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  const individualQuests = useMemo(
    () => templates.filter(t => t.quest_type === 'INDIVIDUAL'),
    [templates]
  );

  const familyQuests = useMemo(
    () => templates.filter(t => t.quest_type === 'FAMILY'),
    [templates]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-fantasy text-gray-200 mb-6">
          👤 Individual Quest Templates
        </h3>
        <div className="space-y-4">
          {individualQuests.length === 0 ? (
            <p className="text-gray-400 text-sm">No individual quest templates yet.</p>
          ) : (
            individualQuests.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePause={onTogglePause}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-fantasy text-gray-200 mb-6">
          👥 Family Quest Templates
        </h3>
        <div className="space-y-4">
          {familyQuests.length === 0 ? (
            <p className="text-gray-400 text-sm">No family quest templates yet.</p>
          ) : (
            familyQuests.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePause={onTogglePause}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

TemplateList.displayName = 'TemplateList';
