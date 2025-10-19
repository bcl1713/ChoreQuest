import { renderHook, waitFor } from "@testing-library/react";
import { useRewards } from "./useRewards";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { Tables } from "@/lib/types/database";

type Reward = Tables<"rewards">;

// Mock dependencies
jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: jest.fn(),
}));

// Mock the RewardService class
jest.mock("@/lib/reward-service", () => {
  const mockGetRewards = jest.fn();
  const mockGetRedemptions = jest.fn();

  return {
    RewardService: jest.fn().mockImplementation(() => ({
      getRewardsForFamily: mockGetRewards,
      getRedemptionsForFamily: mockGetRedemptions,
    })),
    RewardRedemptionWithUser: {},
  };
});

// Import after mocking to get access to mocked functions
import { RewardService as MockedRewardService } from "@/lib/reward-service";
const mockServiceInstance = new MockedRewardService();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;

describe("useRewards", () => {
  const mockProfile = {
    id: "user-1",
    family_id: "family-1",
    role: "HERO" as const,
    name: "Test User",
    email: "test@example.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockRewards: Reward[] = [
    {
      id: "reward-1",
      family_id: "family-1",
      name: "Extra Screen Time",
      description: "30 minutes of screen time",
      type: "SCREEN_TIME",
      cost: 100,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "reward-2",
      family_id: "family-1",
      name: "Ice Cream",
      description: "A scoop of ice cream",
      type: "TREAT",
      cost: 50,
      is_active: true,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ];

  const mockRedemptions: RewardRedemptionWithUser[] = [
    {
      id: "redemption-1",
      reward_id: "reward-1",
      user_id: "user-1",
      status: "PENDING",
      redeemed_at: "2024-01-03T00:00:00Z",
      approved_at: null,
      rejected_at: null,
      user_name: "Test User",
      user_email: "test@example.com",
      reward_name: "Extra Screen Time",
      reward_cost: 100,
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
      onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
    });

    // Default mock implementation for RewardService methods
    (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue(mockRewards);
    (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockResolvedValue(mockRedemptions);
  });

  describe("successful data loading", () => {
    it("should load rewards and redemptions successfully", async () => {
      const { result } = renderHook(() => useRewards());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should be loaded
      expect(result.current.rewards).toEqual(mockRewards);
      expect(result.current.redemptions).toEqual(mockRedemptions);
      expect(result.current.error).toBeNull();
      expect(mockServiceInstance.getRewardsForFamily).toHaveBeenCalledWith("family-1");
      expect(mockServiceInstance.getRedemptionsForFamily).toHaveBeenCalledWith("family-1");
    });

    it("should load rewards and redemptions in parallel", async () => {
      renderHook(() => useRewards());

      await waitFor(() => {
        expect(mockServiceInstance.getRewardsForFamily).toHaveBeenCalled();
        expect(mockServiceInstance.getRedemptionsForFamily).toHaveBeenCalled();
      });

      // Both should be called once (in parallel via Promise.all)
      expect(mockServiceInstance.getRewardsForFamily).toHaveBeenCalledTimes(1);
      expect(mockServiceInstance.getRedemptionsForFamily).toHaveBeenCalledTimes(1);
    });

    it("should handle empty rewards and redemptions", async () => {
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue([]);
      (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle errors when loading rewards", async () => {
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch rewards")
      );

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBe("Failed to fetch rewards");
    });

    it("should handle errors when loading redemptions", async () => {
      (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockRejectedValue(
        new Error("Failed to fetch redemptions")
      );

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBe("Failed to fetch redemptions");
    });

    it("should handle non-Error exceptions", async () => {
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockRejectedValue("String error");

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBe("Failed to load rewards and redemptions");
    });

    it("should clear data when error occurs", async () => {
      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.rewards).toEqual(mockRewards);
      });

      // Make reload fail
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockRejectedValue(new Error("Reload failed"));

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.rewards).toEqual([]);
        expect(result.current.redemptions).toEqual([]);
        expect(result.current.error).toBe("Reload failed");
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

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any service calls
      expect(mockServiceInstance.getRewardsForFamily).not.toHaveBeenCalled();
      expect(mockServiceInstance.getRedemptionsForFamily).not.toHaveBeenCalled();
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

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.redemptions).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should not make any service calls
      expect(mockServiceInstance.getRewardsForFamily).not.toHaveBeenCalled();
      expect(mockServiceInstance.getRedemptionsForFamily).not.toHaveBeenCalled();
    });
  });

  describe("reload functionality", () => {
    it("should reload data when reload is called", async () => {
      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call history
      jest.clearAllMocks();

      // Update mock data for reload
      const updatedRewards = [
        ...mockRewards,
        {
          ...mockRewards[0],
          id: "reward-3",
          name: "New Reward",
        } as Reward,
      ];

      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue(updatedRewards);

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.rewards).toHaveLength(3);
      });

      // Verify service was called again
      expect(mockServiceInstance.getRewardsForFamily).toHaveBeenCalledWith("family-1");
    });

    it("should handle errors during reload", async () => {
      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make reload fail
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockRejectedValue(new Error("Reload failed"));

      // Call reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe("Reload failed");
      });
    });
  });

  describe("React lifecycle", () => {
    it("should reload when family_id changes", async () => {
      const { result, rerender } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change family_id
      const newRewards = [mockRewards[0]];
      (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue(newRewards);

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
        expect(result.current.rewards).toEqual(newRewards);
      });
    });
  });

  describe("realtime subscriptions - rewards", () => {
    it("should subscribe to reward updates", async () => {
      const mockUnsubscribe = jest.fn();
      const mockOnRewardUpdate = jest.fn(() => mockUnsubscribe);

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { unmount } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(mockOnRewardUpdate).toHaveBeenCalled();
      });

      // Unmount to trigger cleanup
      unmount();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should handle INSERT events for rewards", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnRewardUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger INSERT event
      const newReward: Reward = {
        ...mockRewards[0],
        id: "reward-3",
        name: "New Reward from Realtime",
      };

      updateCallback!({
        action: "INSERT",
        record: newReward,
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.rewards).toHaveLength(3);
        expect(result.current.rewards[0].id).toBe("reward-3");
      });
    });

    it("should handle UPDATE events for rewards", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnRewardUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger UPDATE event
      updateCallback!({
        action: "UPDATE",
        record: {
          id: "reward-1",
          name: "Updated Reward Name",
          is_active: false,
        },
      });

      // Wait for state to update
      await waitFor(() => {
        const updatedReward = result.current.rewards.find(r => r.id === "reward-1");
        expect(updatedReward?.name).toBe("Updated Reward Name");
        expect(updatedReward?.is_active).toBe(false);
      });
    });

    it("should handle DELETE events for rewards", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnRewardUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.rewards).toHaveLength(2);
      });

      // Trigger DELETE event
      updateCallback!({
        action: "DELETE",
        old_record: { id: "reward-1" },
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.rewards).toHaveLength(1);
        expect(result.current.rewards[0].id).toBe("reward-2");
      });
    });

    it("should ignore reward events with no action", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnRewardUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalRewards = result.current.rewards;

      // Trigger event with no action
      updateCallback!({
        action: null,
        record: { id: "reward-1" },
      });

      // Rewards should remain unchanged
      expect(result.current.rewards).toBe(originalRewards);
    });

    it("should handle DELETE with no old_record id gracefully", async () => {
      let updateCallback: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

      const mockOnRewardUpdate = jest.fn((callback) => {
        updateCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: mockOnRewardUpdate,
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLength = result.current.rewards.length;

      // Trigger DELETE event with no id
      updateCallback!({
        action: "DELETE",
        old_record: {},
      });

      // Rewards should remain unchanged
      expect(result.current.rewards).toHaveLength(originalLength);
    });
  });

  describe("realtime subscriptions - redemptions", () => {
    it("should subscribe to redemption updates", async () => {
      const mockUnsubscribe = jest.fn();
      const mockOnRewardRedemptionUpdate = jest.fn(() => mockUnsubscribe);

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
      });

      const { unmount } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(mockOnRewardRedemptionUpdate).toHaveBeenCalled();
      });

      // Unmount to trigger cleanup
      unmount();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should reload redemptions when redemption update occurs", async () => {
      let redemptionCallback: () => void;

      const mockOnRewardRedemptionUpdate = jest.fn((callback) => {
        redemptionCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
      });

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock call history
      jest.clearAllMocks();

      // Update mock data for redemptions
      const updatedRedemptions: RewardRedemptionWithUser[] = [
        ...mockRedemptions,
        {
          ...mockRedemptions[0],
          id: "redemption-2",
          status: "APPROVED",
        },
      ];

      (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockResolvedValue(updatedRedemptions);

      // Trigger redemption update
      redemptionCallback!();

      // Wait for redemptions to reload
      await waitFor(() => {
        expect(result.current.redemptions).toHaveLength(2);
      });

      // Verify service was called
      expect(mockServiceInstance.getRedemptionsForFamily).toHaveBeenCalledWith("family-1");
    });

    it("should not subscribe to redemptions when profile has no family_id", async () => {
      const mockOnRewardRedemptionUpdate = jest.fn(() => jest.fn());

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
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

      renderHook(() => useRewards());

      await waitFor(() => {
        // Should not subscribe when no profile
        expect(mockOnRewardRedemptionUpdate).not.toHaveBeenCalled();
      });
    });

    it("should handle errors during redemption reload gracefully", async () => {
      let redemptionCallback: () => void;

      const mockOnRewardRedemptionUpdate = jest.fn((callback) => {
        redemptionCallback = callback;
        return jest.fn();
      });

      mockUseRealtime.mockReturnValue({
        onFamilyMemberUpdate: jest.fn(() => jest.fn()),
        onQuestUpdate: jest.fn(() => jest.fn()),
        onRewardUpdate: jest.fn(() => jest.fn()),
        onRedemptionUpdate: jest.fn(() => jest.fn()),
        onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
      });

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make redemption reload fail
      (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockRejectedValue(new Error("Redemption load failed"));

      // Trigger redemption update
      redemptionCallback!();

      // Wait a bit for the async error to be handled
      await new Promise(resolve => setTimeout(resolve, 100));

      // Error should be logged but not set in state
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to reload redemptions:",
        expect.any(Error)
      );
      expect(result.current.error).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("return value structure", () => {
    it("should return all expected properties", async () => {
      const { result } = renderHook(() => useRewards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify structure
      expect(result.current).toHaveProperty("rewards");
      expect(result.current).toHaveProperty("redemptions");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("reload");

      // Verify types
      expect(Array.isArray(result.current.rewards)).toBe(true);
      expect(Array.isArray(result.current.redemptions)).toBe(true);
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.reload).toBe("function");
    });
  });
});
