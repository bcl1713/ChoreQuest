/**
 * Unit tests for QuestInstanceService
 * Tests family quest claiming, release, and assignment operations
 */

import { QuestInstanceService } from "@/lib/quest-instance-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("QuestInstanceService", () => {
  let service: QuestInstanceService;
  let mockFrom: jest.Mock;

  const mockQuestId = "quest-123";
  const mockCharacterId = "character-456";
  const mockUserId = "user-789";
  const mockGMId = "gm-001";

  // Mock family quest (AVAILABLE status)
  const mockFamilyQuest = {
    id: mockQuestId,
    title: "Clean the kitchen",
    description: "Wipe counters and sweep floor",
    xp_reward: 100,
    gold_reward: 50,
    difficulty: "MEDIUM",
    category: "DAILY",
    family_id: "family-123",
    quest_type: "FAMILY",
    status: "AVAILABLE",
    assigned_to_id: null,
    volunteered_by: null,
    volunteer_bonus: null,
    created_by_id: mockGMId,
  };

  // Mock claimed quest
  const mockClaimedQuest = {
    ...mockFamilyQuest,
    status: "CLAIMED",
    assigned_to_id: mockUserId,
    volunteered_by: mockCharacterId,
    volunteer_bonus: 0.2,
  };

  // Mock character (no active family quest)
  const mockCharacter = {
    id: mockCharacterId,
    user_id: mockUserId,
    name: "Sir Galahad",
    active_family_quest_id: null,
  };

  // Mock character with active family quest
  const mockCharacterWithQuest = {
    ...mockCharacter,
    active_family_quest_id: "another-quest-123",
  };

  beforeEach(() => {
    service = new QuestInstanceService();
    mockFrom = jest.fn();
    (supabase.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("claimQuest", () => {
    it("should successfully claim an available family quest", async () => {
      // Mock quest fetch
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      // Mock character fetch
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacter,
              error: null,
            }),
          }),
        }),
      }));

      // Mock quest update
      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockClaimedQuest,
                error: null,
              }),
            }),
          }),
        }),
      }));

      // Mock character update
      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }));

      const result = await service.claimQuest(mockQuestId, mockCharacterId);

      expect(result).toEqual(mockClaimedQuest);
      expect(result.assigned_to_id).toBe(mockUserId);
      expect(result.volunteered_by).toBe(mockCharacterId);
      expect(result.volunteer_bonus).toBe(0.2); // 20% bonus
      expect(result.status).toBe("CLAIMED");
    });

    it("should throw error if quest is not found", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Quest not found" },
            }),
          }),
        }),
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Failed to fetch quest: Quest not found");
    });

    it("should throw error if quest is not AVAILABLE", async () => {
      const completedQuest = { ...mockFamilyQuest, status: "COMPLETED" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: completedQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Quest is not available for claiming (status: COMPLETED)");
    });

    it("should throw error if quest is not FAMILY type", async () => {
      const individualQuest = { ...mockFamilyQuest, quest_type: "INDIVIDUAL" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: individualQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Only FAMILY quests can be claimed");
    });

    it("should throw error if character not found", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Character not found" },
            }),
          }),
        }),
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Failed to fetch character: Character not found");
    });

    it("should throw error if hero already has active family quest (anti-hoarding)", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacterWithQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow(
        "Hero already has an active family quest. Release the current quest before claiming another."
      );
    });

    it("should rollback quest update if character update fails", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClaimedQuest,
              error: null,
            }),
          }),
        }),
      });

      const mockRollback = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacter,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: mockUpdate,
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Character update failed" },
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: mockRollback,
      }));

      await expect(
        service.claimQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Failed to update character: Character update failed");
    });
  });

  describe("releaseQuest", () => {
    it("should successfully release a claimed family quest", async () => {
      const releasedQuest = {
        ...mockClaimedQuest,
        status: "AVAILABLE",
        assigned_to_id: null,
        volunteered_by: null,
        volunteer_bonus: null,
      };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClaimedQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: releasedQuest,
                error: null,
              }),
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }));

      const result = await service.releaseQuest(mockQuestId, mockCharacterId);

      expect(result).toEqual(releasedQuest);
      expect(result.assigned_to_id).toBeNull();
      expect(result.volunteered_by).toBeNull();
      expect(result.volunteer_bonus).toBeNull();
      expect(result.status).toBe("AVAILABLE");
    });

    it("should throw error if quest is not found", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Quest not found" },
            }),
          }),
        }),
      }));

      await expect(
        service.releaseQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Failed to fetch quest: Quest not found");
    });

    it("should throw error if quest cannot be released (wrong status)", async () => {
      const completedQuest = { ...mockClaimedQuest, status: "COMPLETED" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: completedQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.releaseQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Quest cannot be released (status: COMPLETED)");
    });

    it("should throw error if quest is not FAMILY type", async () => {
      const individualQuest = { ...mockClaimedQuest, quest_type: "INDIVIDUAL" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: individualQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.releaseQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Only FAMILY quests can be released");
    });

    it("should throw error if different hero tries to release quest", async () => {
      const questClaimedByOther = {
        ...mockClaimedQuest,
        volunteered_by: "other-character-123",
      };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: questClaimedByOther,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.releaseQuest(mockQuestId, mockCharacterId)
      ).rejects.toThrow("Only the hero who claimed this quest can release it");
    });
  });

  describe("assignQuest", () => {
    it("should successfully assign an available family quest (GM only)", async () => {
      const assignedQuest = {
        ...mockFamilyQuest,
        status: "CLAIMED",
        assigned_to_id: mockUserId,
        volunteered_by: null, // No volunteer for GM assignment
        volunteer_bonus: null, // No bonus for GM assignment
      };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacter,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: assignedQuest,
                error: null,
              }),
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }));

      const result = await service.assignQuest(
        mockQuestId,
        mockCharacterId,
        mockGMId
      );

      expect(result).toEqual(assignedQuest);
      expect(result.assigned_to_id).toBe(mockUserId);
      expect(result.volunteered_by).toBeNull(); // No volunteer for GM assignment
      expect(result.volunteer_bonus).toBeNull(); // No bonus for GM assignment
      expect(result.status).toBe("CLAIMED");
    });

    it("should throw error if quest is not found", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Quest not found" },
            }),
          }),
        }),
      }));

      await expect(
        service.assignQuest(mockQuestId, mockCharacterId, mockGMId)
      ).rejects.toThrow("Failed to fetch quest: Quest not found");
    });

    it("should throw error if quest is not AVAILABLE", async () => {
      const claimedQuest = { ...mockFamilyQuest, status: "CLAIMED" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: claimedQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.assignQuest(mockQuestId, mockCharacterId, mockGMId)
      ).rejects.toThrow("Quest is not available for assignment (status: CLAIMED)");
    });

    it("should throw error if quest is not FAMILY type", async () => {
      const individualQuest = { ...mockFamilyQuest, quest_type: "INDIVIDUAL" };

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: individualQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.assignQuest(mockQuestId, mockCharacterId, mockGMId)
      ).rejects.toThrow("Only FAMILY quests can be assigned");
    });

    it("should throw error if hero already has active family quest", async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacterWithQuest,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        service.assignQuest(mockQuestId, mockCharacterId, mockGMId)
      ).rejects.toThrow(
        "Hero already has an active family quest. They must complete or release it first."
      );
    });

    it("should rollback quest update if character update fails", async () => {
      const assignedQuest = {
        ...mockFamilyQuest,
        status: "CLAIMED",
        assigned_to_id: mockUserId,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: assignedQuest,
              error: null,
            }),
          }),
        }),
      });

      const mockRollback = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockFamilyQuest,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCharacter,
              error: null,
            }),
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: mockUpdate,
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Character update failed" },
          }),
        }),
      }));

      mockFrom.mockImplementationOnce(() => ({
        update: mockRollback,
      }));

      await expect(
        service.assignQuest(mockQuestId, mockCharacterId, mockGMId)
      ).rejects.toThrow("Failed to update character: Character update failed");
    });
  });
});
