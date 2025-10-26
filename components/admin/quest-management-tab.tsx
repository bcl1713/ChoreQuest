'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuests } from '@/hooks/useQuests';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/hooks/useNotification';
import QuestCard from '@/components/quests/quest-card';
import PendingApprovalsSection from '@/components/quests/pending-approvals-section';
import {
  filterPendingApprovalQuests,
  filterUnassignedActiveQuests,
  filterInProgressQuests,
  getAssignedHeroName,
  mapFamilyCharactersToAssignmentDisplay,
} from '@/components/quests/quest-dashboard/quest-helpers';
import { staggerContainer } from '@/lib/animations/variants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NotificationContainer } from '@/components/ui/NotificationContainer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { questInstanceApiService } from '@/lib/quest-instance-api-service';
import type { QuestInstance } from '@/lib/types/database';

interface QuestSection {
  title: string;
  quests: QuestInstance[];
  emptyMessage: string;
  count: number;
}

export function QuestManagementTab() {
  const { quests, loading, error, reload } = useQuests();
  const { familyCharacters } = useFamilyMembers();
  useAuth();
  const { notifications, dismiss, success, error: showError } = useNotification();
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: string;
    questId: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: '',
    questId: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Action handlers with error handling
  const handleAssignQuest = useCallback(
    async (questId: string, characterId: string) => {
      if (!characterId) return;
      try {
        setIsProcessing(true);
        await questInstanceApiService.assignFamilyQuest(questId, characterId);
        setSelectedAssignee((prev) => ({ ...prev, [questId]: '' }));
        success('Quest assigned successfully!');
        await reload();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to assign quest. Please try again.';
        console.error('Failed to assign quest:', err);
        showError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [reload, success, showError]
  );

  const handleApproveQuest = useCallback(
    async (questId: string) => {
      try {
        setIsProcessing(true);
        await questInstanceApiService.approveQuest(questId);
        success('Quest approved!');
        await reload();
      } catch (err) {
        console.error('Failed to approve quest:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to approve quest. Please try again.';
        showError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [reload, success, showError]
  );

  const handleDenyQuest = useCallback(
    async (questId: string) => {
      setConfirmModal({
        isOpen: true,
        title: 'Send Quest Back to Pending?',
        message: 'The hero can then work on it or abandon it.',
        action: 'deny',
        questId,
      });
    },
    []
  );

  const handleCancelQuest = useCallback(
    async (questId: string) => {
      setConfirmModal({
        isOpen: true,
        title: 'Cancel Quest?',
        message: 'Are you sure you want to cancel this quest?',
        action: 'cancel',
        questId,
      });
    },
    []
  );

  const handleReleaseQuest = useCallback(
    async (questId: string) => {
      setConfirmModal({
        isOpen: true,
        title: 'Release Quest?',
        message: 'Release this quest back to available quests?',
        action: 'release',
        questId,
      });
    },
    []
  );

  const handleConfirmAction = useCallback(
    async (action: string, questId: string) => {
      try {
        setIsProcessing(true);
        if (action === 'deny') {
          await questInstanceApiService.denyQuest(questId);
          success('Quest sent back to pending.');
        } else if (action === 'cancel') {
          await questInstanceApiService.cancelQuest(questId);
          success('Quest cancelled.');
        } else if (action === 'release') {
          await questInstanceApiService.releaseQuest(questId);
          success('Quest released back to available quests.');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
        await reload();
      } catch (err) {
        console.error(`Failed to ${action} quest:`, err);
        const actionText =
          action === 'deny' ? 'deny' : action === 'cancel' ? 'cancel' : 'release';
        showError(`Failed to ${actionText} quest. Please try again.`);
      } finally {
        setIsProcessing(false);
      }
    },
    [confirmModal, reload, success, showError]
  );

  const handleAssigneeChange = useCallback((questId: string, userId: string) => {
    setSelectedAssignee((prev) => ({ ...prev, [questId]: userId }));
  }, []);

  // Memoized characters for assignment (map to { id, name } format)
  const assignableCharacters = useMemo(
    () => mapFamilyCharactersToAssignmentDisplay(familyCharacters),
    [familyCharacters]
  );

  // Memoized quest grouping
  const questSections = useMemo(() => {
    const pendingApproval = filterPendingApprovalQuests(quests);
    const unassigned = filterUnassignedActiveQuests(quests);
    const inProgress = filterInProgressQuests(quests);

    return {
      pendingApproval: {
        title: 'Pending Approval',
        quests: pendingApproval,
        emptyMessage: 'No quests awaiting approval',
        count: pendingApproval.length,
      },
      unassigned: {
        title: 'Unassigned',
        quests: unassigned,
        emptyMessage: 'All quests have been assigned',
        count: unassigned.length,
      },
      inProgress: {
        title: 'In Progress',
        quests: inProgress,
        emptyMessage: 'No quests currently in progress',
        count: inProgress.length,
      },
    };
  }, [quests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
        <h3 className="text-red-200 font-semibold mb-2">Error Loading Quests</h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  // Section renderer
  const renderSection = (section: QuestSection, hideAssignment: boolean = false) => {
    const sectionQuests = section.quests;

    return (
      <motion.div key={section.title} className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{section.title}</h3>
          <span className="px-3 py-1 rounded-full bg-gold-600/20 text-gold-200 text-sm font-medium">
            {section.count}
          </span>
        </div>

        {/* Section Content */}
        {sectionQuests.length === 0 ? (
          <div className="p-6 bg-dark-700/50 border border-dark-600 rounded-lg text-center">
            <p className="text-gray-400">{section.emptyMessage}</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            {sectionQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                viewMode="gm"
                familyMembers={assignableCharacters}
                assignedHeroName={getAssignedHeroName(quest, familyCharacters)}
                selectedAssignee={selectedAssignee[quest.id] || ''}
                onAssigneeChange={handleAssigneeChange}
                onAssign={handleAssignQuest}
                onApprove={handleApproveQuest}
                onDeny={handleDenyQuest}
                onCancel={handleCancelQuest}
                onRelease={handleReleaseQuest}
                hideAssignment={hideAssignment}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isProcessing}
        onConfirm={() => handleConfirmAction(confirmModal.action, confirmModal.questId)}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      <div className="space-y-8" data-testid="quest-management-tab">
        {/* Pending Approval Section */}
        <PendingApprovalsSection
          quests={questSections.pendingApproval.quests}
          assignmentOptions={assignableCharacters}
          selectedAssignees={selectedAssignee}
          onAssigneeChange={handleAssigneeChange}
          onAssign={handleAssignQuest}
          onApprove={handleApproveQuest}
          onDeny={handleDenyQuest}
          onCancel={handleCancelQuest}
          onRelease={handleReleaseQuest}
          getAssignedHeroName={(quest) => getAssignedHeroName(quest, familyCharacters)}
        />

        <hr className="border-dark-600" />

        {/* Unassigned Section */}
        {renderSection(questSections.unassigned)}

        <hr className="border-dark-600" />

        {/* In Progress Section */}
        {renderSection(questSections.inProgress, true)}
      </div>
    </>
  );
}
