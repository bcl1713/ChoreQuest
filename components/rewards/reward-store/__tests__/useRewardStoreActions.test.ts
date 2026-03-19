import { renderHook, act, waitFor } from "@testing-library/react";
import { useRewardStoreActions } from "../useRewardStoreActions";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { RewardRedemption } from "@/lib/types/database";

jest.mock("@/lib/reward-service", () => {
  const mockUpdateRedemptionStatus = jest.fn();
  const mockRefundGold = jest.fn();
  return {
    RewardService: jest.fn().mockImplementation(() => ({
      updateRedemptionStatus: mockUpdateRedemptionStatus,
      refundGold: mockRefundGold,
    })),
  };
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

// Mock global fetch for the achievement-progress evaluate route
const mockFetch = jest.fn().mockResolvedValue({ ok: true });
global.fetch = mockFetch;

import { RewardService as MockedRewardService } from "@/lib/reward-service";

const mockServiceInstance = new MockedRewardService();
const mockUpdateRedemptionStatus =
  mockServiceInstance.updateRedemptionStatus as jest.Mock;
const mockRefundGold = mockServiceInstance.refundGold as jest.Mock;

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

const approvedRow: RewardRedemption = {
  ...pendingRedemption,
  status: "APPROVED",
  approved_at: "2024-01-02T00:00:00Z",
  approved_by: "user-1",
};

const deniedRow: RewardRedemption = { ...pendingRedemption, status: "DENIED" };
const fulfilledRow: RewardRedemption = {
  ...pendingRedemption,
  status: "FULFILLED",
  fulfilled_at: "2024-01-03T00:00:00Z",
};

function makeArgs(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    character: null,
    refreshCharacter: jest.fn().mockResolvedValue(undefined),
    mergeRedemption: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useRewardStoreActions - mergeRedemption integration", () => {
  it("calls mergeRedemption with updated row after APPROVED mutation", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    expect(args.mergeRedemption).toHaveBeenCalledWith(approvedRow);
  });

  it("calls mergeRedemption with updated row after DENIED mutation", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(deniedRow);
    mockRefundGold.mockResolvedValue(undefined);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(pendingRedemption, "DENIED");
    });

    expect(args.mergeRedemption).toHaveBeenCalledWith(deniedRow);
  });

  it("calls mergeRedemption with updated row after FULFILLED mutation", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(fulfilledRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        { ...pendingRedemption, status: "APPROVED" },
        "FULFILLED",
      );
    });

    expect(args.mergeRedemption).toHaveBeenCalledWith(fulfilledRow);
  });

  it("does NOT call mergeRedemption when mutation throws", async () => {
    mockUpdateRedemptionStatus.mockRejectedValue(new Error("Network error"));
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    expect(args.mergeRedemption).not.toHaveBeenCalled();
  });

  it("clears updatingId after mutation regardless of success or failure", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    await waitFor(() => expect(result.current.updatingId).toBeNull());
  });
});

// ─── Task 11.4: Reward hook → achievement evaluate route integration ──────────

describe("useRewardStoreActions - achievement progress evaluate integration (task 11.4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("calls /api/achievement-progress/evaluate after APPROVED status update", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/achievement-progress/evaluate",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: expect.stringContaining("REWARD_APPROVED"),
        }),
      );
    });
  });

  it("does NOT call evaluate route when status is DENIED", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(deniedRow);
    mockRefundGold.mockResolvedValue(undefined);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(pendingRedemption, "DENIED");
    });

    // fetch should not have been called with the evaluate route
    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/achievement-progress/evaluate",
      expect.anything(),
    );
  });

  it("does NOT call evaluate route when status is FULFILLED", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(fulfilledRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        { ...pendingRedemption, status: "APPROVED" },
        "FULFILLED",
      );
    });

    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/achievement-progress/evaluate",
      expect.anything(),
    );
  });

  it("does not block redemption approval when evaluate route fetch fails", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    // mergeRedemption was still called — redemption approval succeeded
    expect(args.mergeRedemption).toHaveBeenCalledWith(approvedRow);
  });

  it("does not block redemption approval when evaluate route returns non-ok response", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    // mergeRedemption was still called — redemption approval succeeded
    expect(args.mergeRedemption).toHaveBeenCalledWith(approvedRow);
  });

  it("sends the redeemer userId in the evaluate route body", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(approvedRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/achievement-progress/evaluate",
        expect.objectContaining({
          body: expect.stringContaining(pendingRedemption.user_id!),
        }),
      );
    });
  });
});
