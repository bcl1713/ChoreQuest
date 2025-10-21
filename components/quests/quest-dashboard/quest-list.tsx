import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { QuestInstance } from '@/lib/types/database';
import { staggerContainer } from '@/lib/animations/variants';
import QuestCard from '../quest-card';

export interface QuestListProps {
  quests: QuestInstance[] | null | undefined;
  viewMode?: 'hero' | 'gm'; // Explicit view mode for QuestCard (overrides variant-based detection)

  // Empty state messages
  emptyMessage?: string;
  emptyHint?: string;

  // Quest action handlers (forwarded to QuestCard)
  onStartQuest?: (questId: string) => void;
  onCompleteQuest?: (questId: string) => void;
  onApproveQuest?: (questId: string) => void;
  onReleaseQuest?: (questId: string) => void;
  onPickupQuest?: (quest: QuestInstance) => void;
  onCancelQuest?: (questId: string) => void;

  // Assignment handlers (forwarded to QuestCard)
  onAssignQuest?: (questId: string, assigneeId: string) => void;

  // Functions to provide additional data
  getAssignedHeroName?: (quest: QuestInstance) => string | undefined;
  getSelectedAssignee?: (questId: string) => string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;

  // QuestCard specific props
  familyMembers?: Array<{ id: string; name: string }>;
}

const QuestList: React.FC<QuestListProps> = memo(({
  quests,
  viewMode: explicitViewMode = 'hero',
  emptyMessage = 'No quests available.',
  emptyHint,
  onStartQuest,
  onCompleteQuest,
  onApproveQuest,
  onReleaseQuest,
  onPickupQuest,
  onCancelQuest,
  onAssignQuest,
  getAssignedHeroName,
  getSelectedAssignee,
  onAssigneeChange,
  familyMembers = [],
}) => {
  // Handle null/undefined quest arrays (memoized to prevent re-filtering on every render)
  const validQuests = useMemo(
    () => (quests || []).filter((quest) => quest && quest.id),
    [quests]
  );

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
        <QuestCard
          key={quest.id}
          quest={quest}
          viewMode={explicitViewMode}
          onStart={onStartQuest}
          onComplete={onCompleteQuest}
          onApprove={onApproveQuest}
          onPickup={onPickupQuest}
          onCancel={onCancelQuest}
          onRelease={onReleaseQuest}
          onAssign={onAssignQuest}
          familyMembers={familyMembers}
          assignedHeroName={getAssignedHeroName?.(quest)}
          selectedAssignee={getSelectedAssignee?.(quest.id)}
          onAssigneeChange={onAssigneeChange}
        />
      ))}
    </motion.div>
  );
});

QuestList.displayName = 'QuestList';

export default QuestList;
