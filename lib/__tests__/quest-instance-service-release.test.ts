import { QuestInstanceService } from "../quest-instance-service";
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
import {
  createService,
  mockCharacterId,
  mockClaimedQuest,
  mockQuestId,
} from "./quest-instance-service.fixtures";

describe("QuestInstanceService - releaseQuest", () => {
  let service: QuestInstanceService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = createService());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
      service.releaseQuest(mockQuestId, mockCharacterId),
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
      service.releaseQuest(mockQuestId, mockCharacterId),
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
      service.releaseQuest(mockQuestId, mockCharacterId),
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
      service.releaseQuest(mockQuestId, mockCharacterId),
    ).rejects.toThrow("Only the hero who claimed this quest can release it");
  });
});
