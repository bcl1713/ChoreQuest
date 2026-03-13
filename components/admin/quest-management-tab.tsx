"use client";
import React, { useMemo } from "react";
import { useQuests } from "@/hooks/useQuests";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useNotification } from "@/hooks/useNotification";
import PendingApprovalsSection from "@/components/quests/pending-approvals-section";
import {
  filterPendingApprovalQuests,
  filterUnassignedActiveQuests,
  filterInProgressQuests,
  getAssignedHeroName,
  mapFamilyCharactersToAssignmentDisplay,
} from "@/components/quests/quest-dashboard/quest-helpers";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useQuestManagementActions } from "./useQuestManagementActions";
import { QuestManagementSection } from "./quest-management-section";

export function QuestManagementTab() {
  const { quests, loading, error, reload } = useQuests();
  const { familyCharacters } = useFamilyMembers();
  const {
    notifications,
    dismiss,
    success,
    error: showError,
  } = useNotification();

  const actions = useQuestManagementActions({
    reload,
    success,
    error: showError,
  });

  const assignableCharacters = useMemo(
    () => mapFamilyCharactersToAssignmentDisplay(familyCharacters),
    [familyCharacters],
  );

  const questSections = useMemo(() => {
    const pendingApproval = filterPendingApprovalQuests(quests);
    const unassigned = filterUnassignedActiveQuests(quests);
    const inProgress = filterInProgressQuests(quests);
    return { pendingApproval, unassigned, inProgress };
  }, [quests]);

  const resolveHeroName = (quest: (typeof quests)[0]) =>
    getAssignedHeroName(quest, familyCharacters);

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
        <h3 className="text-red-200 font-semibold mb-2">
          Error Loading Quests
        </h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const sectionProps = {
    familyMembers: assignableCharacters,
    selectedAssignee: actions.selectedAssignee,
    getAssignedHeroName: resolveHeroName,
    onAssigneeChange: actions.handleAssigneeChange,
    onAssign: actions.handleAssignQuest,
    onApprove: actions.handleApproveQuest,
    onDeny: actions.handleDenyQuest,
    onCancel: actions.handleCancelQuest,
    onRelease: actions.handleReleaseQuest,
  };

  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
      />
      <ConfirmationModal
        isOpen={actions.confirmModal.isOpen}
        title={actions.confirmModal.title}
        message={actions.confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={actions.isProcessing}
        onConfirm={actions.handleConfirmAction}
        onCancel={actions.handleDismissModal}
      />
      <div className="space-y-8" data-testid="quest-management-tab">
        <PendingApprovalsSection
          quests={questSections.pendingApproval}
          assignmentOptions={assignableCharacters}
          selectedAssignees={actions.selectedAssignee}
          onAssigneeChange={actions.handleAssigneeChange}
          onAssign={actions.handleAssignQuest}
          onApprove={actions.handleApproveQuest}
          onDeny={actions.handleDenyQuest}
          onCancel={actions.handleCancelQuest}
          onRelease={actions.handleReleaseQuest}
          getAssignedHeroName={(quest) =>
            getAssignedHeroName(quest, familyCharacters)
          }
        />

        <hr className="border-dark-600" />

        <QuestManagementSection
          title="Unassigned"
          count={questSections.unassigned.length}
          quests={questSections.unassigned}
          emptyMessage="All quests have been assigned"
          {...sectionProps}
        />

        <hr className="border-dark-600" />

        <QuestManagementSection
          title="In Progress"
          count={questSections.inProgress.length}
          quests={questSections.inProgress}
          emptyMessage="No quests currently in progress"
          hideAssignment
          {...sectionProps}
        />
      </div>
    </>
  );
}
