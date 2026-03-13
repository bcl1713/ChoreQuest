"use client";
import { useCallback, useState } from "react";
import { questInstanceApiService } from "@/lib/quest-instance-api-service";

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  action: string;
  questId: string;
}

const CLOSED_MODAL: ConfirmModalState = {
  isOpen: false,
  title: "",
  message: "",
  action: "",
  questId: "",
};

interface UseQuestManagementActionsProps {
  reload: () => Promise<void>;
  success: (message: string) => void;
  error: (message: string) => void;
}

export function useQuestManagementActions({
  reload,
  success,
  error,
}: UseQuestManagementActionsProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<
    Record<string, string>
  >({});
  const [confirmModal, setConfirmModal] =
    useState<ConfirmModalState>(CLOSED_MODAL);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAssigneeChange = useCallback(
    (questId: string, userId: string) => {
      setSelectedAssignee((prev) => ({ ...prev, [questId]: userId }));
    },
    [],
  );

  const handleAssignQuest = useCallback(
    async (questId: string, characterId: string) => {
      if (!characterId) return;
      try {
        setIsProcessing(true);
        await questInstanceApiService.assignFamilyQuest(questId, characterId);
        setSelectedAssignee((prev) => ({ ...prev, [questId]: "" }));
        success("Quest assigned successfully!");
        await reload();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to assign quest. Please try again.";
        console.error("Failed to assign quest:", err);
        error(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [reload, success, error],
  );

  const handleApproveQuest = useCallback(
    async (questId: string) => {
      try {
        setIsProcessing(true);
        await questInstanceApiService.approveQuest(questId);
        success("Quest approved!");
        await reload();
      } catch (err) {
        console.error("Failed to approve quest:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to approve quest. Please try again.";
        error(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [reload, success, error],
  );

  const handleDenyQuest = useCallback((questId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Send Quest Back to Pending?",
      message: "The hero can then work on it or abandon it.",
      action: "deny",
      questId,
    });
  }, []);

  const handleCancelQuest = useCallback((questId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Quest?",
      message: "Are you sure you want to cancel this quest?",
      action: "cancel",
      questId,
    });
  }, []);

  const handleReleaseQuest = useCallback((questId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Release Quest?",
      message: "Release this quest back to available quests?",
      action: "release",
      questId,
    });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    const { action, questId } = confirmModal;
    try {
      setIsProcessing(true);
      if (action === "deny") {
        await questInstanceApiService.denyQuest(questId);
        success("Quest sent back to pending.");
      } else if (action === "cancel") {
        await questInstanceApiService.cancelQuest(questId);
        success("Quest cancelled.");
      } else if (action === "release") {
        await questInstanceApiService.releaseQuest(questId);
        success("Quest released back to available quests.");
      }
      setConfirmModal(CLOSED_MODAL);
      await reload();
    } catch (err) {
      console.error(`Failed to ${action} quest:`, err);
      const actionText =
        action === "deny" ? "deny" : action === "cancel" ? "cancel" : "release";
      error(`Failed to ${actionText} quest. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  }, [confirmModal, reload, success, error]);

  const handleDismissModal = useCallback(() => {
    setConfirmModal(CLOSED_MODAL);
  }, []);

  return {
    selectedAssignee,
    handleAssigneeChange,
    confirmModal,
    isProcessing,
    handleAssignQuest,
    handleApproveQuest,
    handleDenyQuest,
    handleCancelQuest,
    handleReleaseQuest,
    handleConfirmAction,
    handleDismissModal,
  };
}
