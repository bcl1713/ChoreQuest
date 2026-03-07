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

  mockUseRealtime.mockReturnValue({
    onFamilyMemberUpdate: jest.fn(() => jest.fn()),
    onQuestUpdate: jest.fn(() => jest.fn()),
    onRewardUpdate: jest.fn(() => jest.fn()),
    onRedemptionUpdate: jest.fn(() => jest.fn()),
    onRewardRedemptionUpdate: jest.fn(() => jest.fn()),

    onBossQuestUpdate: jest.fn(() => jest.fn()),
    onBossParticipantUpdate: jest.fn(() => jest.fn()),
  });

  (mockServiceInstance.getRewardsForFamily as jest.Mock).mockResolvedValue(mockRewards);
  (mockServiceInstance.getRedemptionsForFamily as jest.Mock).mockResolvedValue(mockRedemptions);
});

describe("useRewards - lifecycle and reward realtime", () => {
  it("should reload when family_id changes", async () => {
    const { result, rerender } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

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

    rerender();

    await waitFor(() => {
      expect(result.current.rewards).toEqual(newRewards);
    });
  });

  it("should subscribe to reward updates", async () => {
    const mockUnsubscribe = jest.fn();
    const mockOnRewardUpdate = jest.fn(() => mockUnsubscribe);

    mockUseRealtime.mockReturnValue({
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onQuestUpdate: jest.fn(() => jest.fn()),
      onRewardUpdate: mockOnRewardUpdate,
      onRedemptionUpdate: jest.fn(() => jest.fn()),
      onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
  
      onBossQuestUpdate: jest.fn(() => jest.fn()),
      onBossParticipantUpdate: jest.fn(() => jest.fn()),
  });

    const { unmount } = renderHook(() => useRewards());

    await waitFor(() => {
      expect(mockOnRewardUpdate).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
