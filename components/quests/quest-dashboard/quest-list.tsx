import React from 'react';
import { motion } from 'framer-motion';
import { QuestInstance } from '@/lib/types/database';
import { staggerContainer } from '@/lib/animations/variants';
import QuestItem, { QuestItemProps, AssignmentOption } from './quest-item';

export interface QuestListProps {
  quests: QuestInstance[] | null | undefined;
  variant?: QuestItemProps['variant'];

  // Empty state messages
  emptyMessage?: string;
  emptyHint?: string;

  // Quest action handlers (forwarded to QuestItem)
  onStartQuest?: (questId: string) => void;
  onCompleteQuest?: (questId: string) => void;
  onApproveQuest?: (questId: string) => void;
  onReleaseQuest?: (questId: string) => void;
  onPickupQuest?: (quest: QuestInstance) => void;
  onCancelQuest?: (questId: string) => void;

  // Assignment handlers (forwarded to QuestItem)
  onAssignQuest?: (questId: string, assigneeId: string) => void;

  // Functions to determine quest item capabilities
  canStart?: (quest: QuestInstance) => boolean;
  canComplete?: (quest: QuestInstance) => boolean;
  canApprove?: (quest: QuestInstance) => boolean;
  canRelease?: (quest: QuestInstance) => boolean;
  canPickup?: (quest: QuestInstance) => boolean;
  canCancel?: (quest: QuestInstance) => boolean;

  // Functions to provide additional data
  getAssignedHeroName?: (quest: QuestInstance) => string | undefined;
  getAssignmentOptions?: (quest: QuestInstance) => AssignmentOption[];
  getSelectedAssignee?: (questId: string) => string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;
  showAssignment?: (quest: QuestInstance) => boolean;
}

const QuestList: React.FC<QuestListProps> = ({
  quests,
  variant = 'default',
  emptyMessage = 'No quests available.',
  emptyHint,
  onStartQuest,
  onCompleteQuest,
  onApproveQuest,
  onReleaseQuest,
  onPickupQuest,
  onCancelQuest,
  onAssignQuest,
  canStart,
  canComplete,
  canApprove,
  canRelease,
  canPickup,
  canCancel,
  getAssignedHeroName,
  getAssignmentOptions,
  getSelectedAssignee,
  onAssigneeChange,
  showAssignment,
}) => {
  // Handle null/undefined quest arrays
  const validQuests = (quests || []).filter((quest) => quest && quest.id);

  // Empty state
  if (validQuests.length === 0) {
    return (
      <div className="fantasy-card p-6 text-center text-gray-300">
        {emptyMessage}
        {emptyHint && (
          <p className="text-xs text-gray-500 mt-2">
            {emptyHint}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {validQuests.map((quest) => (
        <QuestItem
          key={quest.id}
          quest={quest}
          variant={variant}
          canStart={canStart?.(quest)}
          canComplete={canComplete?.(quest)}
          canApprove={canApprove?.(quest)}
          canRelease={canRelease?.(quest)}
          canPickup={canPickup?.(quest)}
          canCancel={canCancel?.(quest)}
          onStart={onStartQuest}
          onComplete={onCompleteQuest}
          onApprove={onApproveQuest}
          onRelease={onReleaseQuest}
          onPickup={onPickupQuest}
          onCancel={onCancelQuest}
          assignedHeroName={getAssignedHeroName?.(quest)}
          showAssignment={showAssignment?.(quest)}
          assignmentOptions={getAssignmentOptions?.(quest)}
          selectedAssignee={getSelectedAssignee?.(quest.id)}
          onAssigneeChange={onAssigneeChange}
          onAssign={onAssignQuest}
        />
      ))}
    </motion.div>
  );
};

export default QuestList;
