import { renderHook, act, waitFor } from "@testing-library/react";
import { useRewards } from "./useRewards";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { RealtimeEvent } from "@/lib/realtime/types";

jest.mock("@/lib/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/realtime-context", () => ({ useRealtime: jest.fn() }));
jest.mock("@/lib/reward-service", () => {
  const mockGetRewardsForFamily = jest.fn();
  const mockGetRedemptionsForFamily = jest.fn();
  return {
    RewardService: jest.fn().mockImplementation(() => ({
      getRewardsForFamily: mockGetRewardsForFamily,
      getRedemptionsForFamily: mockGetRedemptionsForFamily,
    })),
  };
});

import { RewardService as MockedRewardService } from "@/lib/reward-service";

const mockServiceInstance = new MockedRewardService();
const mockGetRewardsForFamily =
  mockServiceInstance.getRewardsForFamily as jest.Mock;
const mockGetRedemptionsForFamily =
  mockServiceInstance.getRedemptionsForFamily as jest.Mock;

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;

const mockProfile = {
  id: "user-1",
  family_id: "family-1",
  role: "GUILD_MASTER" as const,
  name: "GM",
  email: "gm@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const baseUser = {
  id: "user-2",
  name: "Hero",
  family_id: "family-1",
  email: "hero@example.com",
  role: "CHILD" as const,
  created_at: "2024-01-01T00:00:00Z",
};

const pendingRedemption: RewardRedemptionWithUser = {
  id: "r-1",
  user_id: "user-2",
  reward_id: "reward-1",
  reward_name: "Dragon Plush",
  reward_description: "A plush",
  reward_type: "PURCHASE",
  cost: 200,
  status: "PENDING",
  requested_at: "2024-01-01T00:00:00Z",
  approved_at: null,
  approved_by: null,
  fulfilled_at: null,
  family_id: "family-1",
  notes: null,
  user_profiles: baseUser,
};

function makeRealtimeSetup() {
  let redemptionCallback: ((event: RealtimeEvent) => void) | undefined;

  const mockOnRewardRedemptionUpdate = jest.fn(
    (cb: (event: RealtimeEvent) => void) => {
      redemptionCallback = cb;
      return jest.fn();
    },
  );

  mockUseRealtime.mockReturnValue({
    onQuestUpdate: jest.fn(() => jest.fn()),
    onQuestTemplateUpdate: jest.fn(() => jest.fn()),
    onCharacterUpdate: jest.fn(() => jest.fn()),
    onRewardUpdate: jest.fn(() => jest.fn()),
    onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
    onFamilyMemberUpdate: jest.fn(() => jest.fn()),
    onBossQuestUpdate: jest.fn(() => jest.fn()),
    onBossParticipantUpdate: jest.fn(() => jest.fn()),
    refreshQuests: jest.fn(),
    refreshQuestTemplates: jest.fn(),
    refreshCharacters: jest.fn(),
    refreshRewards: jest.fn(),
    isConnected: true,
    connectionError: null,
  });

  return { getRedemptionCallback: () => redemptionCallback };
}

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

  mockGetRewardsForFamily.mockResolvedValue([]);
  mockGetRedemptionsForFamily.mockResolvedValue([pendingRedemption]);
});

describe("useRewards - in-place merge", () => {
  it("exposes mergeRedemption callback", async () => {
    makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.mergeRedemption).toBe("function");
  });

  it("mergeRedemption updates matching redemption in state without a network call", async () => {
    makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const serviceCallCount = mockGetRedemptionsForFamily.mock.calls.length;

    const updatedRow = {
      ...pendingRedemption,
      status: "APPROVED",
      approved_at: "2024-01-02T00:00:00Z",
      approved_by: "user-1",
    };

    act(() => {
      result.current.mergeRedemption(updatedRow);
    });

    expect(result.current.redemptions[0].status).toBe("APPROVED");
    expect(result.current.redemptions[0].approved_at).toBe(
      "2024-01-02T00:00:00Z",
    );
    expect(result.current.redemptions[0].user_profiles).toEqual(baseUser);
    // No additional network call
    expect(mockGetRedemptionsForFamily.mock.calls.length).toBe(
      serviceCallCount,
    );
  });

  it("realtime event merges in-place without a network reload", async () => {
    const { getRedemptionCallback } = makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const serviceCallCount = mockGetRedemptionsForFamily.mock.calls.length;

    const updatedRecord = {
      ...pendingRedemption,
      status: "APPROVED",
      approved_at: "2024-01-02T00:00:00Z",
      approved_by: "user-1",
    };

    act(() => {
      getRedemptionCallback()!({
        type: "reward_redemption_updated",
        table: "reward_redemptions",
        action: "UPDATE",
        record: updatedRecord as unknown as Record<string, unknown>,
      });
    });

    expect(result.current.redemptions[0].status).toBe("APPROVED");
    expect(result.current.redemptions[0].user_profiles).toEqual(baseUser);
    expect(mockGetRedemptionsForFamily.mock.calls.length).toBe(
      serviceCallCount,
    );
  });

  it("exposes glowingRedemptionIds set", async () => {
    makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.glowingRedemptionIds).toBeInstanceOf(Set);
  });

  it("adds ID to glowingRedemptionIds on realtime UPDATE event", async () => {
    const { getRedemptionCallback } = makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedRecord = { ...pendingRedemption, status: "APPROVED" };

    act(() => {
      getRedemptionCallback()!({
        type: "reward_redemption_updated",
        table: "reward_redemptions",
        action: "UPDATE",
        record: updatedRecord as unknown as Record<string, unknown>,
      });
    });

    expect(result.current.glowingRedemptionIds.has("r-1")).toBe(true);
  });

  it("does NOT add ID to glowingRedemptionIds when mergeRedemption is called directly", async () => {
    makeRealtimeSetup();
    const { result } = renderHook(() => useRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedRow = { ...pendingRedemption, status: "APPROVED" };

    act(() => {
      result.current.mergeRedemption(updatedRow);
    });

    expect(result.current.glowingRedemptionIds.has("r-1")).toBe(false);
  });
});
