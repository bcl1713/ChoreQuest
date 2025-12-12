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
 * Relies on realtime subscriptions to update the UI (no manual reloads on success)
 */
export function useQuestHandlers({
  onError,
  loadData,
  characterId,
  setSelectedAssignees,
}: UseQuestHandlersProps) {
  // Note: We do NOT call loadData() after these actions - the realtime subscriptions
  // will automatically update the quests state when the database changes
  const handleStatusUpdate = useCallback(
    async (questId: string, status: QuestStatus) => {
      try {
        if (status === "APPROVED") {
          await questInstanceApiService.approveQuest(questId);
          // Realtime subscription will update the UI automatically
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
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to update quest");
        // Only reload on error
        await loadData();
      }
    },
    [onError],
  );

  const handleClaimQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.claimQuest(questId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to claim quest");
        // Only reload on error
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
        // Pass character ID for family quests so the character's active_family_quest_id is cleared
        await questInstanceApiService.releaseQuest(questId, characterId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to release quest");
        // Only reload on error
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
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to assign quest");
        // Only reload on error
        await loadData();
      }
    },
    [loadData, onError, setSelectedAssignees],
  );

  const handleApproveQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.approveQuest(questId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to approve quest");
        // Only reload on error
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleDenyQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.denyQuest(questId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to deny quest");
        // Only reload on error
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleCancelQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.cancelQuest(questId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to cancel quest");
        // Only reload on error
        await loadData();
      }
    },
    [loadData, onError],
  );

  const handleGmReleaseQuest = useCallback(
    async (questId: string) => {
      try {
        await questInstanceApiService.releaseQuest(questId);
        // Realtime subscription will update the UI automatically
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to release quest");
        // Only reload on error
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
