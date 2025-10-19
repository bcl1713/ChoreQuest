import React from 'react';
import { User as UserIcon, Users, Repeat, Settings, Trash2 } from 'lucide-react';
import type { QuestTemplate } from '@/lib/types/database';

interface TemplateItemProps {
  template: QuestTemplate;
  onEdit: (template: QuestTemplate) => void;
  onDelete: (template: QuestTemplate) => void;
  onTogglePause: (template: QuestTemplate) => void;
}

/**
 * TemplateItem component - Individual quest template card
 *
 * Displays template information including:
 * - Title and metadata (type, recurrence, status)
 * - Assignment info (individual or family)
 * - Action buttons (edit, pause/resume, delete)
 */
export const TemplateItem = React.memo<TemplateItemProps>(({
  template,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  return (
    <div
      className={`p-4 rounded-lg ${
        template.is_paused ? 'bg-gray-700 opacity-60' : 'bg-gray-900'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Repeat className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-xl">{template.title}</span>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {template.recurrence_pattern}
            </span>
            {template.quest_type === 'INDIVIDUAL' ? (
              <UserIcon className="h-5 w-5 text-purple-400" />
            ) : (
              <Users className="h-5 w-5 text-green-400" />
            )}
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
              {template.quest_type}
            </span>
            {template.is_paused && (
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                PAUSED
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {template.quest_type === 'INDIVIDUAL'
              ? `Assigned to: ${(template.assigned_character_ids ?? []).join(', ')}`
              : 'Claimable by: Any hero'}
          </p>
        </div>
        <button className="text-gray-400 hover:text-white">
          <Settings className="h-6 w-6" />
        </button>
      </div>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => onEdit(template)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md"
        >
          Edit
        </button>
        <button
          onClick={() => onTogglePause(template)}
          className={`text-sm text-white py-1 px-3 rounded-md ${
            template.is_paused
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          {template.is_paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => onDelete(template)}
          className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md flex items-center"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </button>
      </div>
    </div>
  );
});

TemplateItem.displayName = 'TemplateItem';
