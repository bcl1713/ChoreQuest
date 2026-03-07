import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { questInstanceApiService } from "@/lib/quest-instance-api-service";
import type { QuestStatus, QuestInstance } from "@/lib/types/database";

interface UseQuestHandlersProps {
  onError: (error: string) => void;
  loadData: () => Promise<void>;
  characterId?: string;
  setSelectedAssignees?: (
    fn: (prev: Record<string, string>) => Record<string, string>,
  ) => void;
}

/**
 * Custom hook for quest action handlers
 * Manages quest status updates, claims, releases, assignments, and approvals
 * Calls loadData() after successful operations as a reliability fallback.
 * Realtime subscriptions may also trigger updates, but loadData() ensures
 * the UI always reflects the latest state even if realtime is delayed.
 */
export function useQuestHandlers({
  onError,
  loadData,
  characterId,
  setSelectedAssignees,
}: UseQuestHandlersProps) {
  const handleStatusUpdate = useCallback(
    async (questId: string, status: QuestStatus) => {
      try {
        if (status === "APPROVED") {
          await questInstanceApiService.approveQuest(questId);
          await loadData();
          return;
        }

        const updateData: Partial<QuestInstance> = { status };
        if (status === "COMPLETED")
          updateData.completed_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("quest_instances")
          .update(updateData)
          .eq("id", questId);
        if (updateError) throw new Error(updateError.message);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to update quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleClaimQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.claimQuest(questId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to claim quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleReleaseQuest = useCallback(
    async (questId: string) => {
      if (!window.confirm("Release this quest back to available quests?")) {
        return;
      }
      try {
        await questInstanceApiService.releaseQuest(questId, characterId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to release quest");
        await loadData();
      }
    },
    [loadData, onError, characterId],
  );

  const handleAssignQuest = useCallback(
    async (questId: string, assigneeId: string) => {
      if (!assigneeId) return;
      try {
        await questInstanceApiService.assignFamilyQuest(questId, assigneeId);
        setSelectedAssignees?.((prev) => ({ ...prev, [questId]: "" }));
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to assign quest");
        await loadData();
      }
    },
    [loadData, onError, setSelectedAssignees],
  );

  const handleApproveQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.approveQuest(questId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to approve quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleDenyQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.denyQuest(questId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to deny quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleCancelQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.cancelQuest(questId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to cancel quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleGmReleaseQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.releaseQuest(questId);
        await loadData();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to release quest");
        await loadData();
      }
    },
    [loadData, onError],
  );

  return {
    handleStatusUpdate,
    handleClaimQuest,
    handleReleaseQuest,
    handleAssignQuest,
    handleApproveQuest,
    handleDenyQuest,
    handleCancelQuest,
    handleGmReleaseQuest,
  };
}
