/**
 * Unit tests for QuestInstanceService
 * Tests family quest claiming, release, and assignment operations
 */

import { QuestInstanceService } from "@/lib/quest-instance-service";
import { supabase } from "@/lib/supabase";
import { StreakService } from "@/lib/streak-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";

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

  // Mock claimed quest (has CLAIMED status after hero claims it with volunteer bonus)
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
    const supabaseMock = supabase as unknown as { from: jest.Mock };
    mockFrom = jest.fn();
    supabaseMock.from = mockFrom;
    service = new QuestInstanceService(supabase as unknown as SupabaseClient<Database>);
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

  describe("approveQuest", () => {
    it("applies volunteer and streak bonuses and updates metadata", async () => {
      const questId = "quest-approve-123";
      const templateId = "template-approve-456";
      const characterId = "character-approve-789";
      const userId = "user-approve-001";

      const questRecord = {
        id: questId,
        title: "Daily Practice",
        description: "Practice instrument for 30 minutes",
        xp_reward: 100,
        gold_reward: 60,
        difficulty: "MEDIUM",
        category: "DAILY",
        status: "CLAIMED",
        assigned_to_id: userId,
        created_by_id: "gm-approve-002",
        family_id: "family-approve-003",
        template_id: templateId,
        recurrence_pattern: "DAILY",
        volunteer_bonus: 0.2,
        volunteered_by: characterId,
        streak_count: 0,
        streak_bonus: 0,
        cycle_start_date: null,
        cycle_end_date: null,
        due_date: null,
        completed_at: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        quest_type: "FAMILY",
      };

      const characterRecord = {
        id: characterId,
        user_id: userId,
        name: "Hero",
        class: "KNIGHT",
        level: 1,
        xp: 0,
        gold: 0,
        gems: 0,
        honor_points: 0,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_family_quest_id: questId,
      };

      const templateRecord = {
        id: templateId,
        title: "Daily Practice Template",
        description: "Recurring practice session",
        xp_reward: 100,
        gold_reward: 60,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: "family-approve-003",
        is_active: true,
        is_paused: false,
        quest_type: "FAMILY",
        recurrence_pattern: "DAILY",
        assigned_character_ids: [],
        class_bonuses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedQuestRecord = {
        ...questRecord,
        status: "APPROVED",
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        streak_count: 3,
        streak_bonus: 0.05,
      };

      const questSelectSingle = jest.fn().mockResolvedValue({ data: questRecord, error: null });
      const questSelectBuilder = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: questSelectSingle,
          }),
        }),
      };

      const questUpdateBuilder = {
        update: jest.fn().mockImplementation((payload) => ({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  ...updatedQuestRecord,
                  ...payload,
                },
                error: null,
              }),
            }),
          }),
        })),
      };

      const characterSelectSingle = jest.fn().mockResolvedValue({ data: characterRecord, error: null });
      const characterSelectBuilder = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: characterSelectSingle,
          }),
        }),
      };

      const characterUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const characterUpdateBuilder = {
        update: jest.fn().mockImplementation((payload) => ({
          eq: jest.fn().mockReturnValue(characterUpdateEq),
          payload,
        })),
      };

      const templateMaybeSingle = jest.fn().mockResolvedValue({ data: templateRecord, error: null });
      const templateBuilder = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: templateMaybeSingle,
          }),
        }),
      };

      const familyMaybeSingle = jest.fn().mockResolvedValue({
        data: { timezone: 'America/Chicago' },
        error: null,
      });
      const familyBuilder = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: familyMaybeSingle,
          }),
        }),
      };

      const questInstanceBuilders = [questSelectBuilder, questUpdateBuilder];
      const characterBuilders = [characterSelectBuilder, characterUpdateBuilder];

      const fromMock = jest.fn((table: string) => {
        if (table === "quest_instances") {
          const builder = questInstanceBuilders.shift();
          if (!builder) throw new Error("Unexpected quest_instances call");
          return builder;
        }
        if (table === "characters") {
          const builder = characterBuilders.shift();
          if (!builder) throw new Error("Unexpected characters call");
          return builder;
        }
        if (table === "quest_templates") {
          return templateBuilder;
        }
        if (table === "families") {
          return familyBuilder;
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const supabaseStub = { from: fromMock };

      const streakServiceMock = {
        getStreak: jest.fn().mockResolvedValue({
          id: "streak-1",
          character_id: characterId,
          template_id: templateId,
          current_streak: 2,
          longest_streak: 5,
          last_completed_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        validateConsecutiveCompletion: jest.fn().mockReturnValue(true),
        incrementStreak: jest.fn().mockResolvedValue({
          current_streak: 3,
        }),
        calculateStreakBonus: jest.fn().mockReturnValue(0.05),
        resetStreak: jest.fn().mockResolvedValue({
          current_streak: 0,
        }),
      };

      const questService = new QuestInstanceService(
        supabaseStub as unknown as typeof supabase,
        streakServiceMock as unknown as StreakService
      );

      const result = await questService.approveQuest(questId);

      expect(result.status).toBe("APPROVED");
      expect(streakServiceMock.getStreak).toHaveBeenCalledWith(characterId, templateId);
      expect(streakServiceMock.incrementStreak).toHaveBeenCalled();
      expect(streakServiceMock.calculateStreakBonus).toHaveBeenCalledWith(3);
      expect(streakServiceMock.resetStreak).not.toHaveBeenCalled();

      const [characterUpdatePayload] = characterUpdateBuilder.update.mock.calls[0];
      expect(characterUpdatePayload).toEqual({
        gold: 75,
        xp: 125,
        active_family_quest_id: null,
        level: 2,
      });

      const [questUpdatePayload] = questUpdateBuilder.update.mock.calls[0];
      expect(questUpdatePayload.status).toBe("APPROVED");
      expect(questUpdatePayload.streak_count).toBe(3);
      expect(questUpdatePayload.streak_bonus).toBe(0.05);
      expect(questUpdatePayload.completed_at).toEqual(expect.any(String));
      expect(questUpdatePayload.approved_at).toEqual(expect.any(String));
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
        status: "PENDING",
        assigned_to_id: mockUserId,
        volunteered_by: mockCharacterId,
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
      expect(result.volunteered_by).toBe(mockCharacterId);
      expect(result.volunteer_bonus).toBeNull(); // No bonus for GM assignment
      expect(result.status).toBe("PENDING");
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
        status: "PENDING",
        assigned_to_id: mockUserId,
        volunteered_by: mockCharacterId,
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
