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

function setupAllModeTest(
  criteriaType: string,
  threshold: number,
  tableOverrides: Record<string, MockChain>,
) {
  const profilesChain = makeDataResult([
    { id: "user-001", characters: [{ id: "char-001" }] },
    { id: "user-002", characters: [{ id: "char-002" }] },
  ]);

  const famAchChain = makeDataResult([
    {
      id: FAMILY_ACHIEVEMENT_ID,
      name: "All Mode Test",
      criteria_type: criteriaType,
      criteria_config: {
        threshold,
        family_evaluation_mode: "all",
      },
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
      if (readProgressCallCount <= 1) {
        return (originalFrom as jest.Mock)(table);
      }
      return unlockCheckChain;
    }
    return (originalFrom as jest.Mock)(table);
  }) as jest.Mock;

  const writeUpsert = makeUpsertResult();
  const writeUpdate = makeUpdateResult();
  let writeCallCount = 0;
  mockWriteClient.from.mockImplementation(() => {
    writeCallCount++;
    if (writeCallCount === 1) return writeUpsert;
    return writeUpdate;
  });

  return { readClient, writeUpsert };
}

describe("FamilyAchievementProgressService — all-mode evaluators", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns minimum level across members (all meet threshold)", async () => {
    const charChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: { level: 7 }, error: null })
            .mockResolvedValueOnce({ data: { level: 5 }, error: null }),
        }),
      }),
    };

    const { readClient, writeUpsert } = setupAllModeTest("level_reached", 5, {
      characters: charChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    // Min of [7, 5] = 5
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 5, threshold: 5 }),
    );
  });

  it("returns minimum level when not all members meet threshold", async () => {
    const charChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: { level: 7 }, error: null })
            .mockResolvedValueOnce({ data: { level: 3 }, error: null }),
        }),
      }),
    };

    const { readClient, writeUpsert } = setupAllModeTest("level_reached", 5, {
      characters: charChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    // Min of [7, 3] = 3, below threshold 5
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 3, threshold: 5 }),
    );
  });

  it("returns minimum streak across members for streak_reached", async () => {
    const streakChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest
          .fn()
          .mockResolvedValueOnce({
            data: [{ longest_streak: 10 }],
            error: null,
          })
          .mockResolvedValueOnce({
            data: [{ longest_streak: 4 }],
            error: null,
          }),
      }),
    };

    const { readClient, writeUpsert } = setupAllModeTest("streak_reached", 7, {
      character_quest_streaks: streakChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    // Min of [10, 4] = 4
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 4, threshold: 7 }),
    );
  });

  it("defaults to sum mode when family_evaluation_mode is missing", async () => {
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
      { id: "user-002", characters: [{ id: "char-002" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Default Mode",
        criteria_type: "xp_earned",
        criteria_config: { threshold: 500 },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const famProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    const charChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: { xp: 100 }, error: null })
            .mockResolvedValueOnce({ data: { xp: 200 }, error: null }),
        }),
      }),
    };

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
      characters: charChain,
    });

    let readProgressCallCount = 0;
    const originalFrom = readClient.from;
    readClient.from = jest.fn((table: string) => {
      if (table === "family_achievement_progress") {
        readProgressCallCount++;
        if (readProgressCallCount <= 1) {
          return (originalFrom as jest.Mock)(table);
        }
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

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    // Default is sum: 100 + 200 = 300
    expect(upsertCall[0].progress.current).toBe(300);
  });
});
