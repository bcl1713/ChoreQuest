'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { QuestInstance } from '@/lib/types/database';
import { getDifficultyColor, getStatusColor } from '@/lib/utils/colors';
import { formatDueDate, formatPercent } from '@/lib/utils/formatting';
import { staggerItem } from '@/lib/animations/variants';
import { getButtonVisibility, getRecurrenceLabel } from './quest-card-helpers';

export interface QuestCardProps {
  quest: QuestInstance;
  viewMode: 'hero' | 'gm';

  // GM action callbacks
  onAssign?: (questId: string, assigneeId: string) => void;
  onApprove?: (questId: string) => void;
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
}

const QuestCard: React.FC<QuestCardProps> = memo(({
  quest,
  viewMode,
  onAssign,
  onApprove,
  onCancel,
  onRelease,
  onStart,
  onComplete,
  onPickup,
  familyMembers = [],
  assignedHeroName,
  selectedAssignee = '',
  onAssigneeChange,
}) => {
  // Get button visibility based on quest status
  const buttonVis = getButtonVisibility(quest.status, viewMode);

  // Format status label
  const statusLabel = (quest.status ?? 'PENDING').replace(/_/g, ' ');

  // Format volunteer and streak bonuses
  const volunteerBonusPercent = formatPercent(quest.volunteer_bonus);
  const streakBonusPercent = formatPercent(quest.streak_bonus);
  const recurrenceLabel = getRecurrenceLabel(quest.recurrence_pattern);

  // Determine card classes based on quest state
  const cardClasses = 'fantasy-card p-6 transition-opacity duration-200';

  return (
    <motion.div
      variants={staggerItem}
      className={cardClasses}
    >
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
            {assignedHeroName && <span className="text-purple-300">👤 {assignedHeroName}</span>}
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
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
              onClick={() => onStart(quest.id)}
              data-testid="hero-start-quest"
            >
              Start Quest
            </button>
          )}

          {buttonVis.canComplete && onComplete && (
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-500 transition"
              onClick={() => onComplete(quest.id)}
              data-testid="hero-complete-quest"
            >
              Complete Quest
            </button>
          )}

          {buttonVis.canPickup && onPickup && (
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition"
              onClick={() => onPickup(quest)}
              data-testid="hero-pickup-quest"
            >
              Pick Up Quest
            </button>
          )}

          {/* Release button for family quests */}
          {quest.quest_type === 'FAMILY' && onRelease && (
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-600 transition"
              onClick={() => onRelease(quest.id)}
              data-testid="hero-release-quest"
            >
              Release to Pool
            </button>
          )}
        </div>
      )}

      {/* GM view action controls */}
      {viewMode === 'gm' && (
        <div className="space-y-3">
          {/* Assignment dropdown */}
          {buttonVis.showAssignment && familyMembers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                👑 Assign to Hero
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
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition disabled:bg-gray-600 disabled:text-gray-300"
                  disabled={!selectedAssignee}
                  onClick={() => onAssign?.(quest.id, selectedAssignee)}
                  data-testid="gm-assign-button"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            {buttonVis.canApprove && onApprove && (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
                onClick={() => onApprove(quest.id)}
                data-testid="gm-approve-quest"
              >
                Approve Quest
              </button>
            )}

            {buttonVis.canCancel && onCancel && (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-rose-700 text-white hover:bg-rose-600 transition"
                onClick={() => onCancel(quest.id)}
                data-testid="gm-cancel-quest"
              >
                Cancel Quest
              </button>
            )}

            {onRelease && quest.assigned_to_id && (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-600 transition"
                onClick={() => onRelease(quest.id)}
                data-testid="gm-release-quest"
              >
                Release to Pool
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});

QuestCard.displayName = 'QuestCard';

export default QuestCard;
