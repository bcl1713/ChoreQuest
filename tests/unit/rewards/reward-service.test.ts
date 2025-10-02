/**
 * Unit tests for RewardService
 * Tests all CRUD operations for reward management
 */

import { RewardService, RewardRedemptionWithUser } from "@/lib/reward-service";
import { supabase } from "@/lib/supabase";
import { Reward, RewardRedemption, UserProfile } from "@/lib/types/database";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("RewardService", () => {
  let service: RewardService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  const mockFamilyId = "family-123";
  const mockRewardId = "reward-456";
  const mockReward: Reward = {
    id: mockRewardId,
    name: "Extra Screen Time",
    description: "30 minutes of extra screen time",
    type: "SCREEN_TIME",
    cost: 100,
    family_id: mockFamilyId,
    is_active: true,
    created_at: "2025-10-02T00:00:00Z",
    updated_at: "2025-10-02T00:00:00Z",
  };

  beforeEach(() => {
    service = new RewardService();

    // Reset all mocks
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockEq = jest.fn();
    mockSingle = jest.fn();
    mockFrom = jest.fn();

    // Setup default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });

    (supabase.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRewardsForFamily", () => {
    it("should fetch all rewards for a family (active and inactive)", async () => {
      const mockRewards = [mockReward, { ...mockReward, id: "reward-789", is_active: false }];

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: mockRewards, error: null });

      const result = await service.getRewardsForFamily(mockFamilyId);

      expect(mockFrom).toHaveBeenCalledWith("rewards");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(result).toEqual(mockRewards);
    });

    it("should return empty array when no rewards exist", async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.getRewardsForFamily(mockFamilyId);

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      const mockError = { message: "Database error" };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(service.getRewardsForFamily(mockFamilyId)).rejects.toThrow(
        "Failed to fetch rewards: Database error"
      );
    });
  });

  describe("createReward", () => {
    it("should create a new reward", async () => {
      const input = {
        name: "Extra Screen Time",
        description: "30 minutes of extra screen time",
        type: "SCREEN_TIME" as const,
        cost: 100,
        family_id: mockFamilyId,
      };

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: mockReward, error: null });

      const result = await service.createReward(input);

      expect(mockFrom).toHaveBeenCalledWith("rewards");
      expect(mockInsert).toHaveBeenCalledWith(input);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockReward);
    });

    it("should throw error when creation fails", async () => {
      const input = {
        name: "Test Reward",
        description: "Test description",
        type: "SCREEN_TIME" as const,
        cost: 50,
        family_id: mockFamilyId,
      };
      const mockError = { message: "Creation failed" };

      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(service.createReward(input)).rejects.toThrow(
        "Failed to create reward: Creation failed"
      );
    });
  });

  describe("updateReward", () => {
    it("should update an existing reward", async () => {
      const input = {
        name: "Updated Screen Time",
        cost: 150,
      };
      const updatedReward = { ...mockReward, ...input };

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updatedReward, error: null });

      const result = await service.updateReward(mockRewardId, input);

      expect(mockFrom).toHaveBeenCalledWith("rewards");
      expect(mockUpdate).toHaveBeenCalledWith(input);
      expect(mockEq).toHaveBeenCalledWith("id", mockRewardId);
      expect(result).toEqual(updatedReward);
    });

    it("should throw error when update fails", async () => {
      const input = { name: "Updated Name" };
      const mockError = { message: "Update failed" };

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(service.updateReward(mockRewardId, input)).rejects.toThrow(
        "Failed to update reward: Update failed"
      );
    });
  });

  describe("deleteReward", () => {
    let mockDelete: jest.Mock;

    beforeEach(() => {
      mockDelete = jest.fn();
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      });
    });

    it("should hard delete a reward (permanently removes from database)", async () => {
      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ data: null, error: null });

      await service.deleteReward(mockRewardId);

      expect(mockFrom).toHaveBeenCalledWith("rewards");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", mockRewardId);
    });

    it("should throw error when deletion fails", async () => {
      const mockError = { message: "Deletion failed" };

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ data: null, error: mockError });

      await expect(service.deleteReward(mockRewardId)).rejects.toThrow(
        "Failed to delete reward: Deletion failed"
      );
    });
  });

  describe("getRedemptionsForFamily", () => {
    let mockOrder: jest.Mock;

    beforeEach(() => {
      mockOrder = jest.fn();
    });

    it("should fetch all redemptions for a family with user details", async () => {
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

    it("should return empty array when no redemptions exist", async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await service.getRedemptionsForFamily(mockFamilyId);

      expect(result).toEqual([]);
    });

    it("should throw error when query fails", async () => {
      const mockError = { message: "Database error" };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(service.getRedemptionsForFamily(mockFamilyId)).rejects.toThrow(
        "Failed to fetch redemptions: Database error"
      );
    });
  });

  describe("updateRedemptionStatus", () => {
    const mockRedemptionId = "redemption-123";
    const mockUserId = "user-123";

    it("should update redemption status to APPROVED", async () => {
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
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: "APPROVED",
        approved_by: "gm-123",
        approved_at: expect.any(String),
      }));
      expect(mockEq).toHaveBeenCalledWith("id", mockRedemptionId);
      expect(result).toEqual(updatedRedemption);
    });

    it("should update redemption status to DENIED", async () => {
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

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: "DENIED",
        notes: "Not available",
      }));
      expect(result).toEqual(updatedRedemption);
    });

    it("should update redemption status to FULFILLED", async () => {
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

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: "FULFILLED",
        fulfilled_at: expect.any(String),
      }));
      expect(result).toEqual(updatedRedemption);
    });

    it("should throw error when update fails", async () => {
      const mockError = { message: "Update failed" };

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(service.updateRedemptionStatus(mockRedemptionId, "APPROVED")).rejects.toThrow(
        "Failed to update redemption status: Update failed"
      );
    });
  });

  describe("refundGold", () => {
    const mockUserId = "user-123";
    const mockGoldAmount = 50;

    it("should refund gold to character", async () => {
      const currentGold = 100;
      const expectedGold = currentGold + mockGoldAmount;

      // First query to get current gold
      mockSelect.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: { gold: currentGold }, error: null });

      // Second query to update gold
      mockUpdate.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await service.refundGold(mockUserId, mockGoldAmount);

      expect(mockFrom).toHaveBeenCalledWith("characters");
      expect(mockUpdate).toHaveBeenCalledWith({ gold: expectedGold });
    });

    it("should throw error when character fetch fails", async () => {
      const mockError = { message: "Character not found" };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(service.refundGold(mockUserId, mockGoldAmount)).rejects.toThrow(
        "Failed to fetch character: Character not found"
      );
    });

    it("should throw error when refund update fails", async () => {
      const mockError = { message: "Update failed" };

      // First query succeeds
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValueOnce({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: { gold: 100 }, error: null });

      // Second query fails
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(service.refundGold(mockUserId, mockGoldAmount)).rejects.toThrow(
        "Failed to refund gold: Update failed"
      );
    });
  });

});
