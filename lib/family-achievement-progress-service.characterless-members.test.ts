import { FamilyAchievementProgressService } from "./family-achievement-progress-service";
import type { MockChain } from "./family-achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeUpdateResult,
  makeReadClient,
  FAMILY_ID,
  FAMILY_ACHIEVEMENT_ID,
} from "./family-achievement-progress-service.fixtures";

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

afterEach(() => {
  jest.clearAllMocks();
});

function buildReadClient(
  criteriaType: string,
  tableOverrides: Record<string, MockChain>,
) {
  const profilesChain = makeDataResult([
    { id: "user-001", characters: [{ id: "char-001" }] },
    { id: "user-002", characters: [] }, // member with no character
  ]);

  const famAchChain = makeDataResult([
    {
      id: FAMILY_ACHIEVEMENT_ID,
      name: "Test",
      criteria_type: criteriaType,
      criteria_config: { threshold: 10, family_evaluation_mode: "sum" },
      xp_reward: 0,
      gold_reward: 0,
    },
  ]);

  const famProgressChain = makeDataResult([
    { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
  ]);

  const unlockCheckChain: MockChain = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  };

  const readClient = makeReadClient({
    user_profiles: profilesChain as unknown as MockChain,
    family_achievements: famAchChain as unknown as MockChain,
    family_achievement_progress: famProgressChain as unknown as MockChain,
    ...tableOverrides,
  });

  let readProgressCallCount = 0;
  const originalFrom = readClient.from;
  readClient.from = jest.fn((table: string) => {
    if (table === "family_achievement_progress") {
      readProgressCallCount++;
      if (readProgressCallCount <= 1) return (originalFrom as jest.Mock)(table);
      return unlockCheckChain;
    }
    return (originalFrom as jest.Mock)(table);
  }) as jest.Mock;

  const writeUpsert = makeUpsertResult();
  const writeUpdate = makeUpdateResult();
  let writeCallCount = 0;
  mockWriteClient.from.mockImplementation(() => {
    writeCallCount++;
    return writeCallCount === 1 ? writeUpsert : writeUpdate;
  });

  return { readClient, writeUpsert };
}

describe("FamilyAchievementProgressService — members without characters", () => {
  it("counts quest_complete for members without characters via assigned_to_id", async () => {
    // Member 1 (with character): 3 quests via .or() filter
    // Member 2 (no character): 2 quests assigned to their userId only
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValueOnce({ count: 3, error: null }),
          eq: jest.fn().mockResolvedValueOnce({ count: 2, error: null }),
        }),
      }),
    };

    const { readClient, writeUpsert } = buildReadClient("quest_complete", {
      quest_instances: questChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress.current).toBe(5);
  });

  it("counts quest_difficulty for members without characters via assigned_to_id", async () => {
    // Member 1 (with character): 2 hard quests via .or() filter
    // Member 2 (no character): 1 hard quest assigned to their userId only
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValueOnce({ count: 2, error: null }),
            eq: jest.fn().mockResolvedValueOnce({ count: 1, error: null }),
          }),
        }),
      }),
    };

    const { readClient, writeUpsert } = buildReadClient("quest_difficulty", {
      quest_instances: questChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress.current).toBe(3);
  });
});
