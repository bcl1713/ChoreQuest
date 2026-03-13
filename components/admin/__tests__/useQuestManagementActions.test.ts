import { renderHook, act } from "@testing-library/react";
import { useQuestManagementActions } from "../useQuestManagementActions";
import { questInstanceApiService } from "@/lib/quest-instance-api-service";

jest.mock("@/lib/quest-instance-api-service", () => ({
  questInstanceApiService: {
    assignFamilyQuest: jest.fn(),
    approveQuest: jest.fn(),
    denyQuest: jest.fn(),
    cancelQuest: jest.fn(),
    releaseQuest: jest.fn(),
  },
}));

const mockApi = jest.mocked(questInstanceApiService);

const makeProps = () => ({
  reload: jest.fn().mockResolvedValue(undefined),
  success: jest.fn(),
  error: jest.fn(),
});

describe("useQuestManagementActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleAssignQuest", () => {
    it("assigns quest, clears assignee, shows success, and reloads", async () => {
      const props = makeProps();
      mockApi.assignFamilyQuest.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useQuestManagementActions(props));

      await act(async () => {
        await result.current.handleAssignQuest("quest-1", "char-1");
      });

      expect(mockApi.assignFamilyQuest).toHaveBeenCalledWith(
        "quest-1",
        "char-1",
      );
      expect(props.success).toHaveBeenCalledWith(
        "Quest assigned successfully!",
      );
      expect(props.reload).toHaveBeenCalled();
      expect(result.current.selectedAssignee["quest-1"]).toBe("");
    });

    it("does nothing when characterId is empty", async () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      await act(async () => {
        await result.current.handleAssignQuest("quest-1", "");
      });

      expect(mockApi.assignFamilyQuest).not.toHaveBeenCalled();
    });

    it("shows error notification on failure", async () => {
      const props = makeProps();
      mockApi.assignFamilyQuest.mockRejectedValueOnce(new Error("API error"));
      const { result } = renderHook(() => useQuestManagementActions(props));

      await act(async () => {
        await result.current.handleAssignQuest("quest-1", "char-1");
      });

      expect(props.error).toHaveBeenCalledWith("API error");
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("handleApproveQuest", () => {
    it("approves quest, shows success, and reloads", async () => {
      const props = makeProps();
      mockApi.approveQuest.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useQuestManagementActions(props));

      await act(async () => {
        await result.current.handleApproveQuest("quest-1");
      });

      expect(mockApi.approveQuest).toHaveBeenCalledWith("quest-1");
      expect(props.success).toHaveBeenCalledWith("Quest approved!");
      expect(props.reload).toHaveBeenCalled();
    });

    it("shows error notification on failure", async () => {
      const props = makeProps();
      mockApi.approveQuest.mockRejectedValueOnce(new Error("Approve failed"));
      const { result } = renderHook(() => useQuestManagementActions(props));

      await act(async () => {
        await result.current.handleApproveQuest("quest-1");
      });

      expect(props.error).toHaveBeenCalledWith("Approve failed");
    });
  });

  describe("confirmation modal flow", () => {
    it("handleDenyQuest opens modal with deny action", () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleDenyQuest("quest-1");
      });

      expect(result.current.confirmModal.isOpen).toBe(true);
      expect(result.current.confirmModal.action).toBe("deny");
      expect(result.current.confirmModal.questId).toBe("quest-1");
      expect(result.current.confirmModal.title).toBe(
        "Send Quest Back to Pending?",
      );
    });

    it("handleCancelQuest opens modal with cancel action", () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleCancelQuest("quest-2");
      });

      expect(result.current.confirmModal.isOpen).toBe(true);
      expect(result.current.confirmModal.action).toBe("cancel");
      expect(result.current.confirmModal.questId).toBe("quest-2");
    });

    it("handleReleaseQuest opens modal with release action", () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleReleaseQuest("quest-3");
      });

      expect(result.current.confirmModal.isOpen).toBe(true);
      expect(result.current.confirmModal.action).toBe("release");
      expect(result.current.confirmModal.questId).toBe("quest-3");
    });

    it("handleConfirmAction executes deny and closes modal", async () => {
      const props = makeProps();
      mockApi.denyQuest.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleDenyQuest("quest-1");
      });

      await act(async () => {
        await result.current.handleConfirmAction();
      });

      expect(mockApi.denyQuest).toHaveBeenCalledWith("quest-1");
      expect(props.success).toHaveBeenCalledWith("Quest sent back to pending.");
      expect(result.current.confirmModal.isOpen).toBe(false);
      expect(props.reload).toHaveBeenCalled();
    });

    it("handleConfirmAction executes cancel and closes modal", async () => {
      const props = makeProps();
      mockApi.cancelQuest.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleCancelQuest("quest-1");
      });

      await act(async () => {
        await result.current.handleConfirmAction();
      });

      expect(mockApi.cancelQuest).toHaveBeenCalledWith("quest-1");
      expect(props.success).toHaveBeenCalledWith("Quest cancelled.");
    });

    it("handleConfirmAction executes release and closes modal", async () => {
      const props = makeProps();
      mockApi.releaseQuest.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleReleaseQuest("quest-1");
      });

      await act(async () => {
        await result.current.handleConfirmAction();
      });

      expect(mockApi.releaseQuest).toHaveBeenCalledWith("quest-1");
      expect(props.success).toHaveBeenCalledWith(
        "Quest released back to available quests.",
      );
    });

    it("handleConfirmAction shows error on failure", async () => {
      const props = makeProps();
      mockApi.denyQuest.mockRejectedValueOnce(new Error("Deny failed"));
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleDenyQuest("quest-1");
      });

      await act(async () => {
        await result.current.handleConfirmAction();
      });

      expect(props.error).toHaveBeenCalledWith(
        "Failed to deny quest. Please try again.",
      );
      expect(result.current.isProcessing).toBe(false);
    });

    it("handleDismissModal closes modal without acting", () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleDenyQuest("quest-1");
      });
      expect(result.current.confirmModal.isOpen).toBe(true);

      act(() => {
        result.current.handleDismissModal();
      });
      expect(result.current.confirmModal.isOpen).toBe(false);
      expect(mockApi.denyQuest).not.toHaveBeenCalled();
    });
  });

  describe("handleAssigneeChange", () => {
    it("updates selectedAssignee state", () => {
      const props = makeProps();
      const { result } = renderHook(() => useQuestManagementActions(props));

      act(() => {
        result.current.handleAssigneeChange("quest-1", "char-42");
      });

      expect(result.current.selectedAssignee["quest-1"]).toBe("char-42");
    });
  });
});
