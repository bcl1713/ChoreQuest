import { QuestInstanceService } from "./quest-instance-service";
jest.mock("./supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
import {
  createService,
  mockCharacter,
  mockCharacterId,
  mockCharacterWithQuest,
  mockFamilyQuest,
  mockGMId,
  mockQuestId,
  mockUserId,
} from "./quest-instance-service.fixtures";

describe("QuestInstanceService - assignQuest", () => {
  let service: QuestInstanceService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createService());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully assign an available family quest (GM only)", async () => {
    const assignedQuest = {
      ...mockFamilyQuest,
      status: "PENDING",
      assigned_to_id: mockUserId,
      volunteered_by: mockCharacterId,
      volunteer_bonus: null,
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
      mockGMId,
    );

    expect(result).toEqual(assignedQuest);
    expect(result.assigned_to_id).toBe(mockUserId);
    expect(result.volunteered_by).toBe(mockCharacterId);
    expect(result.volunteer_bonus).toBeNull();
    expect(result.status).toBe("PENDING");
  });

  it("should throw error if quest is not found", async () => {
    mockFrom.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    }));

    await expect(
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
    ).rejects.toThrow("Quest not found");
  });

  it("should throw app error if quest fetch fails", async () => {
    mockFrom.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Database offline" },
          }),
        }),
      }),
    }));

    await expect(
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
    ).rejects.toThrow("Failed to fetch quest: Database offline");
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
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
    ).rejects.toThrow(
      "Quest is not available for assignment (status: CLAIMED)",
    );
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
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
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
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
    ).rejects.toThrow(
      "Hero already has an active family quest. Release the current quest before assigning another.",
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
      service.assignQuest(mockQuestId, mockCharacterId, mockGMId),
    ).rejects.toThrow("Failed to update character: Character update failed");
  });
});
