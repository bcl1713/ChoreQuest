'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import QuestCard from '@/components/quests/quest-card';
import type { QuestInstance } from '@/lib/types/database';
import { staggerContainer } from '@/lib/animations/variants';

interface PendingApprovalsSectionProps {
  quests: QuestInstance[];
  assignmentOptions: Array<{ id: string; name: string }>;
  selectedAssignees: Record<string, string>;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;
  onAssign?: (questId: string, assigneeId: string) => void;
  onApprove?: (questId: string) => void;
  onDeny?: (questId: string) => void;
  onCancel?: (questId: string) => void;
  onRelease?: (questId: string) => void;
  getAssignedHeroName?: (quest: QuestInstance) => string | undefined;
  title?: string;
  emptyMessage?: string;
}

/**
 * Shared Guild Master pending approvals section.
 * Reuses the existing QuestCard component in GM view mode.
 */
const PendingApprovalsSection: React.FC<PendingApprovalsSectionProps> = ({
  quests,
  assignmentOptions,
  selectedAssignees,
  onAssigneeChange,
  onAssign,
  onApprove,
  onDeny,
  onCancel,
  onRelease,
  getAssignedHeroName,
  title = 'Pending Approval',
  emptyMessage = 'No quests awaiting approval',
}) => {
  const pendingQuests = useMemo(
    () => (quests || []).filter((quest): quest is QuestInstance => Boolean(quest && quest.id)),
    [quests]
  );

  const questCount = pendingQuests.length;

  return (
    <motion.div className="space-y-4" data-testid="pending-approvals-section">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <span className="px-3 py-1 rounded-full bg-gold-600/20 text-gold-200 text-sm font-medium">
          {questCount}
        </span>
      </div>

      {questCount === 0 ? (
        <div className="p-6 bg-dark-700/50 border border-dark-600 rounded-lg text-center">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4"
        >
          {pendingQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              viewMode="gm"
              familyMembers={assignmentOptions}
              assignedHeroName={getAssignedHeroName?.(quest)}
              selectedAssignee={selectedAssignees[quest.id] ?? ''}
              onAssigneeChange={onAssigneeChange}
              onAssign={onAssign}
              onApprove={onApprove}
              onDeny={onDeny}
              onCancel={onCancel}
              onRelease={onRelease}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PendingApprovalsSection;
