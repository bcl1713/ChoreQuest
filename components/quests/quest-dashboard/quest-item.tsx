import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { QuestInstance } from '@/lib/types/database';
import { getDifficultyColor, getStatusColor } from '@/lib/utils/colors';
import { formatDueDate, formatPercent, formatDateTime } from '@/lib/utils/formatting';
import { staggerItem } from '@/lib/animations/variants';

export interface AssignmentOption {
  id: string;
  label: string;
  disabled: boolean;
}

export interface QuestItemProps {
  quest: QuestInstance;
  variant?: 'default' | 'historical' | 'awaiting-approval' | 'available' | 'family-gm';

  // Action permissions
  canStart?: boolean;
  canComplete?: boolean;
  canApprove?: boolean;
  canRelease?: boolean;
  canPickup?: boolean;
  canCancel?: boolean;

  // Action handlers
  onStart?: (questId: string) => void;
  onComplete?: (questId: string) => void;
  onApprove?: (questId: string) => void;
  onRelease?: (questId: string) => void;
  onPickup?: (quest: QuestInstance) => void;
  onCancel?: (questId: string) => void;

  // Assignment controls (for GM)
  showAssignment?: boolean;
  assignmentOptions?: AssignmentOption[];
  selectedAssignee?: string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;
  onAssign?: (questId: string, assigneeId: string) => void;

  // Additional display info
  assignedHeroName?: string;
}

const QuestItem: React.FC<QuestItemProps> = memo(({
  quest,
  variant = 'default',
  canStart = false,
  canComplete = false,
  canApprove = false,
  canRelease = false,
  canPickup = false,
  canCancel = false,
  onStart,
  onComplete,
  onApprove,
  onRelease,
  onPickup,
  onCancel,
  showAssignment = false,
  assignmentOptions = [],
  selectedAssignee = '',
  onAssigneeChange,
  onAssign,
  assignedHeroName,
}) => {
  // Memoize computed values to prevent recalculation on every render
  const statusLabel = useMemo(
    () => (quest.status ?? 'PENDING').replace('_', ' '),
    [quest.status]
  );

  const volunteerBonusPercent = useMemo(
    () => formatPercent(quest.volunteer_bonus),
    [quest.volunteer_bonus]
  );

  const streakBonusPercent = useMemo(
    () => formatPercent(quest.streak_bonus),
    [quest.streak_bonus]
  );

  const recurrenceLabel = useMemo(
    () => quest.recurrence_pattern
      ? quest.recurrence_pattern.toLowerCase().charAt(0).toUpperCase() +
        quest.recurrence_pattern.toLowerCase().slice(1)
      : null,
    [quest.recurrence_pattern]
  );

  // Determine card styling based on variant (memoized)
  const cardClasses = useMemo(() => {
    const baseClasses = 'fantasy-card p-6';
    switch (variant) {
      case 'historical':
        return `${baseClasses} bg-dark-800/80 border border-gray-700`;
      case 'awaiting-approval':
        return `${baseClasses} border border-emerald-800/40 bg-dark-800/70 backdrop-blur-sm`;
      case 'available':
        return `${baseClasses} border-l-4 border-gold-500`;
      case 'family-gm':
        return `${baseClasses} border border-purple-800/40 bg-dark-800/70 backdrop-blur-sm`;
      default:
        return baseClasses;
    }
  }, [variant]);

  // Get completion timestamp for historical quests (memoized)
  const historyAction = useMemo(() => {
    switch (quest.status) {
      case 'APPROVED':
        return 'Approved';
      case 'COMPLETED':
        return 'Completed';
      case 'EXPIRED':
        return 'Expired';
      case 'MISSED':
        return 'Marked missed';
      default:
        return 'Updated';
    }
  }, [quest.status]);

  const completionTimestamp = useMemo(
    () => formatDateTime(quest.completed_at ?? quest.updated_at ?? quest.created_at),
    [quest.completed_at, quest.updated_at, quest.created_at]
  );

  return (
    <motion.div variants={staggerItem} className={cardClasses}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
          <p className="text-gray-300 text-sm">{quest.description}</p>

          <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
            <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
            <span>⚡ {quest.xp_reward} XP</span>
            <span>💰 {quest.gold_reward} Gold</span>
            {recurrenceLabel && <span>{recurrenceLabel}</span>}
            {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
            {volunteerBonusPercent && (
              <span className="text-emerald-300">+{volunteerBonusPercent} Volunteer Bonus</span>
            )}
            {streakBonusPercent && quest.streak_count && (
              <span className="text-amber-300">
                🔥 {quest.streak_count}-day streak (+{streakBonusPercent})
              </span>
            )}
            {assignedHeroName && <span>Hero: {assignedHeroName}</span>}
          </div>
        </div>

        {variant === 'awaiting-approval' && quest.quest_type === 'FAMILY' ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/70 text-emerald-200">
            Family Quest
          </span>
        ) : variant === 'awaiting-approval' && quest.quest_type === 'INDIVIDUAL' ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/70 text-emerald-200">
            Individual Quest
          </span>
        ) : (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Historical quest completion info */}
      {variant === 'historical' && completionTimestamp && (
        <p className="text-sm text-gray-400 mb-3">
          {historyAction} on {completionTimestamp}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canStart && onStart && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
            onClick={() => onStart(quest.id)}
            data-testid="start-quest-button"
          >
            Start Quest
          </button>
        )}

        {canComplete && onComplete && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-500 transition"
            onClick={() => onComplete(quest.id)}
            data-testid="complete-quest-button"
          >
            Complete Quest
          </button>
        )}

        {canApprove && onApprove && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
            onClick={() => onApprove(quest.id)}
            data-testid="approve-quest-button"
          >
            Approve Quest
          </button>
        )}

        {canRelease && onRelease && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-500 transition"
            onClick={() => onRelease(quest.id)}
          >
            Release Quest
          </button>
        )}

        {canPickup && onPickup && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
            onClick={() => onPickup(quest)}
            data-testid="pick-up-quest-button"
          >
            Pick Up Quest
          </button>
        )}

        {canCancel && onCancel && (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-rose-700 text-white hover:bg-rose-600 transition"
            onClick={() => onCancel(quest.id)}
          >
            Cancel Quest
          </button>
        )}
      </div>

      {/* Assignment controls for GM */}
      {showAssignment && assignmentOptions.length > 0 && (
        <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-gray-700">
          <label className="block text-xs font-medium text-gray-300 mb-2">
            👑 Assign to Hero
          </label>
          <div className="flex gap-2">
            <select
              data-testid="assign-quest-dropdown"
              value={selectedAssignee}
              onChange={(e) => onAssigneeChange?.(quest.id, e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
            >
              <option value="">Choose hero...</option>
              {assignmentOptions.map((option) => (
                <option key={option.id} value={option.id} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition disabled:bg-gray-600 disabled:text-gray-300"
              disabled={!selectedAssignee}
              onClick={() => onAssign?.(quest.id, selectedAssignee)}
            >
              Assign
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
});

QuestItem.displayName = 'QuestItem';

export default QuestItem;
