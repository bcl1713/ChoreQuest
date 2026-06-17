import { RewardService, RewardRedemptionWithUser } from "@/lib/reward-service";
import { supabase } from "@/lib/supabase";
import { RewardRedemption, UserProfile } from "@/lib/types/database";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe("RewardService - redemptions", () => {
  let service: RewardService;
  let mockFrom: jest.Mock;
  let mockRpc: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  const mockFamilyId = "family-123";
  const mockRewardId = "reward-456";

  beforeEach(() => {
    service = new RewardService();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockEq = jest.fn();
    mockSingle = jest.fn();
    mockFrom = jest.fn();
    mockRpc = jest.fn();
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
    (supabase.from as jest.Mock) = mockFrom;
    (supabase.rpc as jest.Mock) = mockRpc;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRedemptionsForFamily", () => {
    let mockOrder: jest.Mock;

    beforeEach(() => {
      mockOrder = jest.fn();
    });

    it("fetches all redemptions for a family with user details", async () => {
      const mockUserProfile: UserProfile = {
        id: "user-123",
        name: "Test Hero",
        email: "hero@test.com",
        role: "HERO",
        family_id: mockFamilyId,
        created_at: "2025-10-02T00:00:00Z",
        last_active: "2025-10-02T00:00:00Z",
      };
      const mockRedemption: RewardRedemptionWithUser = {
        id: "redemption-123",
        user_id: "user-123",
        reward_id: mockRewardId,
        cost: 50,
        reward_name: "Test Reward",
        reward_description: "Test description",
        reward_type: "SCREEN_TIME",
        status: "PENDING",
        requested_at: "2025-10-02T00:00:00Z",
        approved_at: null,
        approved_by: null,
        fulfilled_at: null,
        notes: null,
        user_profiles: mockUserProfile,
      };
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: [mockRedemption], error: null });

      const result = await service.getRedemptionsForFamily(mockFamilyId);

      expect(mockFrom).toHaveBeenCalledWith("reward_redemptions");
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("user_profiles:user_id(*)"));
      expect(mockEq).toHaveBeenCalledWith("user_profiles.family_id", mockFamilyId);
      expect(mockOrder).toHaveBeenCalledWith("requested_at", { ascending: false });
      expect(result).toEqual([mockRedemption]);
    });

    it("returns empty array when no redemptions exist", async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await service.getRedemptionsForFamily(mockFamilyId);

      expect(result).toEqual([]);
    });

    it("throws when query fails", async () => {
      const mockError = { message: "Database error" };
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(service.getRedemptionsForFamily(mockFamilyId)).rejects.toThrow(
        "Failed to fetch redemptions: Database error",
      );
    });
  });

  describe("updateRedemptionStatus", () => {
    const mockRedemptionId = "redemption-123";
    const mockUserId = "user-123";

    it("updates redemption status to APPROVED", async () => {
      const updatedRedemption: RewardRedemption = {
        id: mockRedemptionId,
        user_id: mockUserId,
        reward_id: mockRewardId,
        cost: 50,
        reward_name: "Test Reward",
        reward_description: "Test description",
        reward_type: "SCREEN_TIME",
        status: "APPROVED",
        requested_at: "2025-10-02T00:00:00Z",
        approved_at: "2025-10-02T01:00:00Z",
        approved_by: "gm-123",
        fulfilled_at: null,
        notes: null,
      };
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updatedRedemption, error: null });

      const result = await service.updateRedemptionStatus(mockRedemptionId, "APPROVED", "gm-123");

      expect(mockFrom).toHaveBeenCalledWith("reward_redemptions");
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "APPROVED", approved_by: "gm-123" }));
      expect(mockEq).toHaveBeenCalledWith("id", mockRedemptionId);
      expect(result).toEqual(updatedRedemption);
    });

    it("updates redemption status to DENIED", async () => {
      const updatedRedemption: RewardRedemption = {
        id: mockRedemptionId,
        user_id: mockUserId,
        reward_id: mockRewardId,
        cost: 50,
        reward_name: "Test Reward",
        reward_description: "Test description",
        reward_type: "SCREEN_TIME",
        status: "DENIED",
        requested_at: "2025-10-02T00:00:00Z",
        approved_at: null,
        approved_by: null,
        fulfilled_at: null,
        notes: "Not available",
      };
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updatedRedemption, error: null });

      const result = await service.updateRedemptionStatus(mockRedemptionId, "DENIED", undefined, "Not available");

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "DENIED", notes: "Not available" }));
      expect(result).toEqual(updatedRedemption);
    });

    it("updates redemption status to FULFILLED", async () => {
      const updatedRedemption: RewardRedemption = {
        id: mockRedemptionId,
        user_id: mockUserId,
        reward_id: mockRewardId,
        cost: 50,
        reward_name: "Test Reward",
        reward_description: "Test description",
        reward_type: "SCREEN_TIME",
        status: "FULFILLED",
        requested_at: "2025-10-02T00:00:00Z",
        approved_at: "2025-10-02T01:00:00Z",
        approved_by: "gm-123",
        fulfilled_at: "2025-10-02T02:00:00Z",
        notes: null,
      };
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updatedRedemption, error: null });

      const result = await service.updateRedemptionStatus(mockRedemptionId, "FULFILLED");

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "FULFILLED" }));
      expect(result).toEqual(updatedRedemption);
    });

    it("throws when update fails", async () => {
      const mockError = { message: "Update failed" };
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(service.updateRedemptionStatus(mockRedemptionId, "APPROVED")).rejects.toThrow(
        "Failed to update redemption status: Update failed",
      );
    });
  });

  describe("refundGold", () => {
    const mockUserId = "user-123";
    const mockGoldAmount = 50;
    const mockRedemptionId = "redemption-123";

    it("refunds gold through an atomic database RPC", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await service.refundGold(mockUserId, mockGoldAmount, mockRedemptionId);

      expect(mockRpc).toHaveBeenCalledWith("fn_refund_reward_gold", {
        p_user_id: mockUserId,
        p_amount: mockGoldAmount,
        p_redemption_id: mockRedemptionId,
      });
      expect(mockFrom).not.toHaveBeenCalledWith("characters");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("passes a null redemption id when one is not provided", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await service.refundGold(mockUserId, mockGoldAmount);

      expect(mockRpc).toHaveBeenCalledWith("fn_refund_reward_gold", {
        p_user_id: mockUserId,
        p_amount: mockGoldAmount,
        p_redemption_id: null,
      });
    });

    it("throws when the atomic refund fails", async () => {
      const mockError = { message: "Update failed" };
      mockRpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(service.refundGold(mockUserId, mockGoldAmount)).rejects.toThrow(
        "Failed to refund gold: Update failed",
      );
    });
  });
});
