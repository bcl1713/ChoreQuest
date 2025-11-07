'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Coins, Flame, User, Crown, Calendar, CalendarDays, Clock } from 'lucide-react';
import { QuestInstance } from '@/lib/types/database';
import { getDifficultyColor, getStatusColor } from '@/lib/utils/colors';
import { formatDueDate, formatPercent } from '@/lib/utils/formatting';
import { staggerItem } from '@/lib/animations/variants';
import { getButtonVisibility, getRecurrenceLabel } from './quest-card-helpers';
import { Button } from '@/components/ui';

export interface QuestCardProps {
  quest: QuestInstance;
  viewMode: 'hero' | 'gm';

  // GM action callbacks
  onAssign?: (questId: string, assigneeId: string) => void;
  onApprove?: (questId: string) => void;
  onDeny?: (questId: string) => void;
  onCancel?: (questId: string) => void;
  onRelease?: (questId: string) => void;

  // Hero action callbacks
  onStart?: (questId: string) => void;
  onComplete?: (questId: string) => void;
  onPickup?: (quest: QuestInstance) => void;

  // Assignment options (for GM view)
  familyMembers?: Array<{ id: string; name: string }>;

  // Additional display info
  assignedHeroName?: string;
  selectedAssignee?: string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;

  // Styling options
  isPaused?: boolean;
  hideAssignment?: boolean;

  // Template-specific actions (optional)
  isTemplate?: boolean;
  onEditTemplate?: (questId: string) => void;
  onTogglePauseTemplate?: (questId: string) => void;
  onDeleteTemplate?: (questId: string) => void;
}

const QuestCard: React.FC<QuestCardProps> = memo(({
  quest,
  viewMode,
  onAssign,
  onApprove,
  onDeny,
  onCancel,
  onRelease,
  onStart,
  onComplete,
  onPickup,
  familyMembers = [],
  assignedHeroName,
  selectedAssignee = '',
  onAssigneeChange,
  isPaused = false,
  hideAssignment = false,
  isTemplate = false,
  onEditTemplate,
  onTogglePauseTemplate,
  onDeleteTemplate,
}) => {
  // Helper function to get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ size: number; className: string }>> = {
      'Calendar': Calendar,
      'CalendarDays': CalendarDays,
      'Clock': Clock,
    };
    return iconMap[iconName];
  };

  // Get button visibility based on quest status and type
  const buttonVis = getButtonVisibility(quest.status, viewMode, quest.quest_type);

  // Format status label
  const statusLabel = (quest.status ?? 'PENDING').replace(/_/g, ' ');

  // Format volunteer and streak bonuses
  const volunteerBonusPercent = formatPercent(quest.volunteer_bonus);
  const streakBonusPercent = formatPercent(quest.streak_bonus);
  const recurrenceLabel = getRecurrenceLabel(quest.recurrence_pattern);

  // Determine card classes based on quest state
  const cardClasses = `fantasy-card p-6 transition-opacity duration-200 relative`;

  return (
    <motion.div
      variants={staggerItem}
      className={cardClasses}
    >
      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black opacity-25 rounded-lg pointer-events-none" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Unavailable badge */}
        {isPaused && (
          <div className="mb-3">
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
              Unavailable
            </span>
          </div>
        )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div>
            <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
            <p className="text-gray-300 text-sm">{quest.description}</p>
          </div>

          {/* Quest metadata */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
            <span className={getDifficultyColor(quest.difficulty)}>
              {quest.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Zap size={16} className="inline" /> {quest.xp_reward} XP
            </span>
            <span className="flex items-center gap-1">
              <Coins size={16} className="inline" /> {quest.gold_reward} Gold
            </span>
            {recurrenceLabel && (
              <span className="flex items-center gap-1">
                {(() => {
                  const IconComponent = getIconComponent(recurrenceLabel.icon);
                  return IconComponent ? <IconComponent size={16} className="inline" /> : null;
                })()}
                {recurrenceLabel.label}
              </span>
            )}
            {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
            {volunteerBonusPercent && (
              <span className="text-emerald-300">+{volunteerBonusPercent} Volunteer Bonus</span>
            )}
            {streakBonusPercent && quest.streak_count && (
              <span className="text-amber-300 flex items-center gap-1">
                <Flame size={16} className="inline" /> {quest.streak_count}-day streak (+{streakBonusPercent})
              </span>
            )}
            {assignedHeroName && (
              <span className="text-purple-300 flex items-center gap-1">
                <User size={16} className="inline" /> {assignedHeroName}
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
          {statusLabel}
        </span>
      </div>

      {/* Hero view action buttons */}
      {viewMode === 'hero' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {buttonVis.canStart && onStart && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onStart(quest.id)}
              data-testid="hero-start-quest"
            >
              Start Quest
            </Button>
          )}

          {buttonVis.canComplete && onComplete && (
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => onComplete(quest.id)}
              data-testid="hero-complete-quest"
            >
              Complete Quest
            </Button>
          )}

          {buttonVis.canPickup && onPickup && (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={() => onPickup(quest)}
              data-testid="hero-pickup-quest"
            >
              Pick Up Quest
            </Button>
          )}

          {/* Abandon button for family quests */}
          {buttonVis.canAbandon && onRelease && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onRelease(quest.id)}
              data-testid="hero-release-quest"
            >
              Abandon Quest
            </Button>
          )}
        </div>
      )}

      {/* GM view action controls */}
      {viewMode === 'gm' && (
        <div className="space-y-3">
          {/* Assignment dropdown */}
          {buttonVis.showAssignment && !hideAssignment && familyMembers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Crown size={16} /> Assign to Hero
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) => onAssigneeChange?.(quest.id, e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                  data-testid="gm-assign-dropdown"
                >
                  <option value="">Choose hero...</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!selectedAssignee}
                  onClick={() => onAssign?.(quest.id, selectedAssignee)}
                  data-testid="gm-assign-button"
                >
                  Assign
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            {buttonVis.canApprove && onApprove && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => onApprove(quest.id)}
                data-testid="gm-approve-quest"
              >
                Approve Quest
              </Button>
            )}

            {buttonVis.canDeny && onDeny && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeny(quest.id)}
                data-testid="gm-deny-quest"
              >
                Deny Quest
              </Button>
            )}

            {buttonVis.canCancel && onCancel && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onCancel(quest.id)}
                data-testid="gm-cancel-quest"
              >
                Cancel Quest
              </Button>
            )}

            {onRelease && quest.assigned_to_id && quest.status !== 'COMPLETED' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onRelease(quest.id)}
                data-testid="gm-release-quest"
              >
                Unassign Quest
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Template-specific action buttons */}
      {isTemplate && (
        <div className="flex flex-wrap gap-2 mt-3">
          {onEditTemplate && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onEditTemplate(quest.id)}
              data-testid="template-edit-button"
            >
              Edit
            </Button>
          )}

          {onTogglePauseTemplate && (
            <Button
              type="button"
              variant={isPaused ? 'success' : 'gold'}
              size="sm"
              onClick={() => onTogglePauseTemplate(quest.id)}
              data-testid="template-pause-button"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}

          {onDeleteTemplate && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteTemplate(quest.id)}
              data-testid="template-delete-button"
            >
              Delete
            </Button>
          )}
        </div>
      )}
      </div>
    </motion.div>
  );
});

QuestCard.displayName = 'QuestCard';

export default QuestCard;
