import { renderHook, waitFor } from "@testing-library/react";
import { useQuests } from "./useQuests";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { QuestInstance } from "@/lib/types/database";

// Mock dependencies
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("useQuests", () => {
  const mockProfile = {
    id: "user-1",
    family_id: "family-1",
    role: "HERO" as const,
    name: "Test User",
    email: "test@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockQuests: QuestInstance[] = [
    {
      id: "quest-1",
      family_id: "family-1",
      title: "Test Quest 1",
      description: "Description 1",
      status: "PENDING",
      difficulty: "EASY",
      category: "DAILY",
      xp_reward: 50,
      gold_reward: 10,
      quest_type: "INDIVIDUAL",
      created_by_id: "user-1",
      assigned_to_id: "user-2",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      due_date: null,
      completed_at: null,
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: null,
      streak_bonus: null,
      streak_count: null,
    },
    {
      id: "quest-2",
      family_id: "family-1",
      title: "Test Quest 2",
      description: "Description 2",
      status: "IN_PROGRESS",
      difficulty: "MEDIUM",
      category: "WEEKLY",
      xp_reward: 100,
      gold_reward: 25,
      quest_type: "FAMILY",
      created_by_id: "user-1",
      assigned_to_id: null,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      due_date: null,
      completed_at: null,
      recurrence_pattern: null,
      parent_template_id: null,
      volunteer_bonus: 0.2,
      streak_bonus: null,
      streak_count: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useAuth
    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
    });

    // Default mock implementation for useRealtime
    mockUseRealtime.mockReturnValue({
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onQuestUpdate: jest.fn(() => jest.fn()),
      onRewardUpdate: jest.fn(() => jest.fn()),
      onRedemptionUpdate: jest.fn(() => jest.fn()),
    });
  });

  describe("successful data loading", () => {
    it("should load quests successfully", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should be loaded
      expect(result.current.quests).toEqual(mockQuests);
      expect(result.current.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("quest_instances");
    });

    it("should call Supabase with correct parameters", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockQuery.select).toHaveBeenCalledWith("*");
        expect(mockQuery.eq).toHaveBeenCalledWith("family_id", mockProfile.family_id);
        expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      });
    });

    it("should handle empty quest list", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should deduplicate quests with same id", async () => {
      const duplicateQuests = [
        mockQuests[0],
        mockQuests[1],
        { ...mockQuests[0], title: "Updated Title" }, // Duplicate with different data
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: duplicateQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should only have 2 unique quests
      expect(result.current.quests).toHaveLength(2);
      expect(result.current.quests.map(q => q.id)).toEqual(["quest-1", "quest-2"]);
    });
  });

  describe("error handling", () => {
    it("should handle database errors", async () => {
      const mockError = {
        message: "Database connection failed",
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBe("Failed to fetch quest instances: Database connection failed");
    });

    it("should handle non-Error exceptions", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue("String error"),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBe("Failed to load quests");
    });

    it("should clear quests when error occurs", async () => {
      // First load successfully
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.quests).toEqual(mockQuests);
      });

      // Now make reload fail
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: "Failed" },
      });

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.quests).toEqual([]);
        expect(result.current.error).toBe("Failed to fetch quest instances: Failed");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle missing profile gracefully", async () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
      });

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any Supabase calls
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle missing family_id gracefully", async () => {
      mockUseAuth.mockReturnValue({
        profile: { ...mockProfile, family_id: null },
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
      });

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any Supabase calls
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle null data response from Supabase", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quests).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("reload functionality", () => {
    it("should reload data when reload is called", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call history
      jest.clearAllMocks();

      // Update mock data for reload
      const updatedQuests = [
        ...mockQuests,
        {
          ...mockQuests[0],
          id: "quest-3",
          title: "New Quest",
        } as QuestInstance,
      ];

      mockQuery.order.mockResolvedValue({
        data: updatedQuests,
        error: null,
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.quests).toHaveLength(3);
      });

      // Verify Supabase was called again
      expect(mockSupabase.from).toHaveBeenCalledWith("quest_instances");
    });

    it("should handle errors during reload", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make reload fail
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: "Reload failed" },
      });

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch quest instances: Reload failed");
      });
    });
  });

  describe("React lifecycle", () => {
    it("should reload when family_id changes", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result, rerender } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change family_id
      const newQuests = [mockQuests[0]];
      mockQuery.order.mockResolvedValue({
        data: newQuests,
        error: null,
      });

      mockUseAuth.mockReturnValue({
        profile: { ...mockProfile, family_id: "family-2" },
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
      });

      // Trigger re-render
      rerender();

      await waitFor(() => {
        expect(result.current.quests).toEqual(newQuests);
      });
    });
  });

  describe("realtime subscriptions", () => {
    it("should subscribe to quest updates", async () => {
      const mockUnsubscribe = jest.fn();
      const mockOnQuestUpdate = jest.fn(() => mockUnsubscribe);

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { unmount } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockOnQuestUpdate).toHaveBeenCalled();
      });

      // Unmount to trigger cleanup
      unmount();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should handle INSERT events", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnQuestUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger INSERT event
      const newQuest: QuestInstance = {
        ...mockQuests[0],
        id: "quest-3",
        title: "New Quest from Realtime",
      };

      updateCallback!({
        action: "INSERT",
        record: newQuest,
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.quests).toHaveLength(3);
        expect(result.current.quests[0].id).toBe("quest-3");
      });
    });

    it("should handle UPDATE events", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnQuestUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger UPDATE event
      updateCallback!({
        action: "UPDATE",
        record: {
          id: "quest-1",
          status: "COMPLETED",
          title: "Updated Quest Title",
        },
      });

      // Wait for state to update
      await waitFor(() => {
        const updatedQuest = result.current.quests.find(q => q.id === "quest-1");
        expect(updatedQuest?.status).toBe("COMPLETED");
        expect(updatedQuest?.title).toBe("Updated Quest Title");
      });
    });

    it("should handle DELETE events", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnQuestUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.quests).toHaveLength(2);
      });

      // Trigger DELETE event
      updateCallback!({
        action: "DELETE",
        old_record: { id: "quest-1" },
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.quests).toHaveLength(1);
        expect(result.current.quests[0].id).toBe("quest-2");
      });
    });

    it("should deduplicate on INSERT", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnQuestUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to insert a quest that already exists
      updateCallback!({
        action: "INSERT",
        record: {
          ...mockQuests[0],
          title: "Updated via realtime",
        },
      });

      // Should still have 2 quests, not 3
      await waitFor(() => {
        expect(result.current.quests).toHaveLength(2);
      });
    });

    it("should not subscribe when profile has no family_id", async () => {
      const mockOnQuestUpdate = jest.fn(() => jest.fn());

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      mockUseAuth.mockReturnValue({
        profile: null,
        user: null,
        session: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
      });

      renderHook(() => useQuests());

      await waitFor(() => {
        // Should not subscribe when no profile
        expect(mockOnQuestUpdate).not.toHaveBeenCalled();
      });
    });

    it("should ignore events with no action", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnQuestUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: mockOnQuestUpdate,
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalQuests = result.current.quests;

      // Trigger event with no action
      updateCallback!({
        action: null,
        record: { id: "quest-1" },
      });

      // Quests should remain unchanged
      expect(result.current.quests).toBe(originalQuests);
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockQuests,
          error: null,
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue(mockQuery as any);

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify structure
      expect(result.current).toHaveProperty("quests");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("reload");

      // Verify types
      expect(Array.isArray(result.current.quests)).toBe(true);
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.reload).toBe("function");
    });
  });
});
