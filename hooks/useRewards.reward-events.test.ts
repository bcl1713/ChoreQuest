import { renderHook, waitFor } from "@testing-library/react";
import { useRewards } from "./useRewards";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { Tables } from "@/lib/types/database";

type Reward = Tables<"rewards">;

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: jest.fn(),
}));

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

import { RewardService as MockedRewardService } from "@/lib/reward-service";

const mockServiceInstance = new MockedRewardService();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;

const defaultRealtimeMock = () => ({
  onFamilyMemberUpdate: jest.fn(() => jest.fn()),
  onQuestUpdate: jest.fn(() => jest.fn()),
  onRewardUpdate: jest.fn(() => jest.fn()),
  onRedemptionUpdate: jest.fn(() => jest.fn()),
  onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
  onBossQuestUpdate: jest.fn(() => jest.fn()),
  onBossParticipantUpdate: jest.fn(() => jest.fn()),
});
const mockRealtimeWith = (overrides = {}) => {
  mockUseRealtime.mockReturnValue({ ...defaultRealtimeMock(), ...overrides });
};

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

  mockRealtimeWith();

  (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue(
    mockRewards,
  );
  (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockResolvedValue(
    mockRedemptions,
  );
});

describe("useRewards - reward realtime events", () => {
  it("should handle INSERT events for rewards", async () => {
    let updateCallback: (event: any) => void;

    const mockOnRewardUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onRewardUpdate: mockOnRewardUpdate });

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newReward: Reward = {
      ...mockRewards[0],
      id: "reward-3",
      name: "New Reward from Realtime",
    };

    updateCallback!({
      action: "INSERT",
      record: newReward,
    });

    await waitFor(() => {
      expect(result.current.rewards).toHaveLength(3);
      expect(result.current.rewards[0].id).toBe("reward-3");
    });
  });

  it("should handle UPDATE events for rewards", async () => {
    let updateCallback: (event: any) => void;

    const mockOnRewardUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onRewardUpdate: mockOnRewardUpdate });

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    updateCallback!({
      action: "UPDATE",
      record: {
        id: "reward-1",
        name: "Updated Reward Name",
        is_active: false,
      },
    });

    await waitFor(() => {
      const updatedReward = result.current.rewards.find(
        (r) => r.id === "reward-1",
      );
      expect(updatedReward?.name).toBe("Updated Reward Name");
      expect(updatedReward?.is_active).toBe(false);
    });
  });

  it("should handle DELETE events for rewards", async () => {
    let updateCallback: (event: any) => void;

    const mockOnRewardUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onRewardUpdate: mockOnRewardUpdate });

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rewards).toHaveLength(2);
    });

    updateCallback!({
      action: "DELETE",
      old_record: { id: "reward-1" },
    });

    await waitFor(() => {
      expect(result.current.rewards).toHaveLength(1);
      expect(result.current.rewards[0].id).toBe("reward-2");
    });
  });

  it("should ignore reward events with no action", async () => {
    let updateCallback: (event: any) => void;

    const mockOnRewardUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onRewardUpdate: mockOnRewardUpdate });

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalRewards = result.current.rewards;

    updateCallback!({
      action: null,
      record: { id: "reward-1" },
    });

    expect(result.current.rewards).toBe(originalRewards);
  });

  it("should handle DELETE with no old_record id gracefully", async () => {
    let updateCallback: (event: any) => void;

    const mockOnRewardUpdate = jest.fn((callback) => {
      updateCallback = callback;
      return jest.fn();
    });

    mockRealtimeWith({ onRewardUpdate: mockOnRewardUpdate });

    const { result } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalLength = result.current.rewards.length;

    updateCallback!({
      action: "DELETE",
      old_record: {},
    });

    expect(result.current.rewards).toHaveLength(originalLength);
  });
});
