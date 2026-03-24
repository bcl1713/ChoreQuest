import { FamilyAchievementProgressService } from "../family-achievement-progress-service";
import type { MockChain } from "./family-achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeUpdateResult,
  makeReadClient,
  FAMILY_ID,
  USER_IDS,
  CHARACTER_IDS,
  FAMILY_ACHIEVEMENT_ID,
} from "./family-achievement-progress-service.fixtures";

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("FamilyAchievementProgressService — sum-mode evaluators", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupCommonMocks(
    criteriaType: string,
    threshold: number,
    tableOverrides: Record<string, MockChain>,
  ) {
    const profilesChain = makeDataResult(
      USER_IDS.map((uid, i) => ({
        id: uid,
        characters: [{ id: CHARACTER_IDS[i] }],
      })),
    );

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test Achievement",
        criteria_type: criteriaType,
        criteria_config: {
          threshold,
          family_evaluation_mode: "sum",
        },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const famProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    // For unlock evaluation: fetch existing progress
    const unlockCheckChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              {
                family_achievement_id: FAMILY_ACHIEVEMENT_ID,
                unlocked_at: null,
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    const writeUpsert = makeUpsertResult();
    const writeUpdate = makeUpdateResult();

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      family_achievement_progress: famProgressChain as unknown as MockChain,
      ...tableOverrides,
    });

    // Write client needs to handle both upsert and unlock update
    let writeFromCallCount = 0;
    mockWriteClient.from.mockImplementation((table: string) => {
      if (table === "family_achievement_progress") {
        writeFromCallCount++;
        // First call is upsert, subsequent are unlock updates
        if (writeFromCallCount === 1) return writeUpsert;
        return writeUpdate;
      }
      throw new Error(`Unexpected write table: ${table}`);
    });

    // Override the read client to also serve unlock check queries
    const originalFrom = readClient.from;
    let readProgressCallCount = 0;
    readClient.from = jest.fn((table: string) => {
      if (table === "family_achievement_progress") {
        readProgressCallCount++;
        // First call fetches existing progress IDs, second is unlock check
        if (readProgressCallCount <= 1) {
          return (originalFrom as jest.Mock)(table);
        }
        return unlockCheckChain;
      }
      return (originalFrom as jest.Mock)(table);
    }) as jest.Mock;

    return { readClient, writeUpsert };
  }

  it("sums quest_complete across family members", async () => {
    // Member 1: 3 quests, Member 2: 4 quests → total 7
    const questChain1: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest
            .fn()
            .mockResolvedValueOnce({ count: 3, error: null })
            .mockResolvedValueOnce({ count: 4, error: null }),
        }),
      }),
    };

    const { readClient, writeUpsert } = setupCommonMocks("quest_complete", 10, {
      quest_instances: questChain1,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 7, threshold: 10 }),
    );
  });

  it("sums boss_defeated across family members", async () => {
    const bossChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValueOnce({ count: 2, error: null })
            .mockResolvedValueOnce({ count: 3, error: null }),
        }),
      }),
    };

    const { readClient, writeUpsert } = setupCommonMocks("boss_defeated", 5, {
      boss_battle_participants: bossChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "BOSS_COMPLETED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 5, threshold: 5 }),
    );
  });

  it("sums xp_earned across family members", async () => {
    const charChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValueOnce({
              data: { xp: 100 },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { xp: 200 },
              error: null,
            }),
        }),
      }),
    };

    const { readClient, writeUpsert } = setupCommonMocks("xp_earned", 500, {
      characters: charChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 300, threshold: 500 }),
    );
  });

  it("handles single family member (sum is just their value)", async () => {
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 5, family_evaluation_mode: "sum" },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const famProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 3, error: null }),
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
      quest_instances: questChain,
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
    expect(upsertCall[0].progress.current).toBe(3);
  });
});
