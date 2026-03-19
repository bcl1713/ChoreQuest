import { renderHook, act } from "@testing-library/react";
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
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "refreshed-token" } },
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

const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ redemption: {} }),
});
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

// ─── Reward approval → server-side route integration ─────────────────────────

describe("useRewardStoreActions - APPROVED calls server-side approve route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ redemption: approvedRow }),
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("calls /api/reward-redemptions/[id]/approve after APPROVED status update", async () => {
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/reward-redemptions/${pendingRedemption.id}/approve`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("does NOT call the approve route when status is DENIED", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(deniedRow);
    mockRefundGold.mockResolvedValue(undefined);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(pendingRedemption, "DENIED");
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does NOT call the approve route when status is FULFILLED", async () => {
    mockUpdateRedemptionStatus.mockResolvedValue(fulfilledRow);
    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        { ...pendingRedemption, status: "APPROVED" },
        "FULFILLED",
      );
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not call mergeRedemption when approve route fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
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

  it("does not call mergeRedemption when approve route returns non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: "Forbidden" }),
    });
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

  it("merges the redemption returned by the approve route", async () => {
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

  it("falls back to refreshSession when getSession returns no access_token", async () => {
    const { supabase: mockSupabase } = jest.requireMock("@/lib/supabase");
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const args = makeArgs();
    const { result } = renderHook(() => useRewardStoreActions(args));

    await act(async () => {
      await result.current.updateRedemptionStatus(
        pendingRedemption,
        "APPROVED",
      );
    });

    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/reward-redemptions/${pendingRedemption.id}/approve`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer refreshed-token",
        }),
      }),
    );
  });
});
