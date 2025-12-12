import { QuestInstanceService } from "@/lib/quest-instance-service";
import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("QuestInstanceService - claimQuest", () => {
  let service: QuestInstanceService;
  let mockFrom: jest.Mock;

  const mockQuestId = "quest-123";
  const mockCharacterId = "character-456";
  const mockUserId = "user-789";
  const mockGMId = "gm-001";

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

  const mockClaimedQuest = {
    ...mockFamilyQuest,
    status: "CLAIMED",
    assigned_to_id: mockUserId,
    volunteered_by: mockCharacterId,
    volunteer_bonus: 0.2,
  };

  const mockCharacter = {
    id: mockCharacterId,
    user_id: mockUserId,
    name: "Sir Galahad",
    active_family_quest_id: null,
  };

  const mockCharacterWithQuest = { ...mockCharacter, active_family_quest_id: "another-quest-123" };

  beforeEach(() => {
    const supabaseMock = supabase as unknown as { from: jest.Mock };
    mockFrom = jest.fn();
    supabaseMock.from = mockFrom;
    service = new QuestInstanceService(supabase as unknown as SupabaseClient<Database>);
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
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockCharacter, active_family_quest_id: mockQuestId },
              error: null,
            }),
          }),
        }),
      }),
    }));

    const result = await service.claimQuest(mockQuestId, mockCharacterId, mockUserId, { volunteer_bonus: 0.2 });

    expect(result.success).toBe(true);
    expect(result.quest?.status).toBe("CLAIMED");
    expect(result.quest?.assigned_to_id).toBe(mockUserId);
  });

  it("should prevent claiming if character already has active quest", async () => {
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

    const result = await service.claimQuest(mockQuestId, mockCharacterId, mockUserId, { volunteer_bonus: 0.2 });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already has an active family quest");
  });

  it("should handle quest fetch errors", async () => {
    mockFrom.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error("Quest not found"),
          }),
        }),
      }),
    }));

    const result = await service.claimQuest(mockQuestId, mockCharacterId, mockUserId, { volunteer_bonus: 0.2 });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Quest not found");
  });

  it("should handle character fetch errors", async () => {
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
            error: new Error("Character not found"),
          }),
        }),
      }),
    }));

    const result = await service.claimQuest(mockQuestId, mockCharacterId, mockUserId, { volunteer_bonus: 0.2 });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Character not found");
  });
});
