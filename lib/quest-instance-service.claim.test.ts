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
  mockClaimedQuest,
  mockFamilyQuest,
  mockQuestId,
  mockUserId,
} from "./quest-instance-service.fixtures";

describe("QuestInstanceService - claimQuest", () => {
  let service: QuestInstanceService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createService());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully claim an available family quest", async () => {
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
              data: mockClaimedQuest,
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

    const result = await service.claimQuest(mockQuestId, mockCharacterId);

    expect(result).toEqual(mockClaimedQuest);
    expect(result.assigned_to_id).toBe(mockUserId);
    expect(result.volunteered_by).toBe(mockCharacterId);
    expect(result.volunteer_bonus).toBe(0.2);
    expect(result.status).toBe("CLAIMED");
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
      service.claimQuest(mockQuestId, mockCharacterId),
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
      service.claimQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow("Failed to fetch quest: Database offline");
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
      service.claimQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow(
      "Quest is not available for claiming (status: COMPLETED)",
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
      service.claimQuest(mockQuestId, mockCharacterId),
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
            error: null,
          }),
        }),
      }),
    }));

    await expect(
      service.claimQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow("Character not found");
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
      service.claimQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow(
      "Hero already has an active family quest. Release the current quest before claiming another.",
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
      service.claimQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow("Failed to update character: Character update failed");
  });
});
