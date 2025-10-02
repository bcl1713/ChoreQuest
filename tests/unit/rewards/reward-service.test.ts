/**
 * Unit tests for RewardService
 * Tests all CRUD operations for reward management
 */

import { RewardService } from "@/lib/reward-service";
import { supabase } from "@/lib/supabase";
import { Reward } from "@/lib/types/database";

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

});
