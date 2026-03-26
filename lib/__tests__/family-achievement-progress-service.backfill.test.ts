import { FamilyAchievementProgressService } from "../family-achievement-progress-service";
import type { MockChain } from "./family-achievement-progress-service.fixtures";
import {
  makeCountResult,
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

describe("FamilyAchievementProgressService — backfillProgress", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates progress rows for all achievements regardless of event type", async () => {
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

    // No existing progress rows — simulates a family with no progress yet
    const emptyProgressChain = makeDataResult([]);

    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
    };

    // Unlock check after upsert — achievement not yet unlocked
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

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      quest_instances: questChain,
    });

    let readProgressCallCount = 0;
    const originalFrom = readClient.from as jest.Mock;
    readClient.from = jest.fn((table: string) => {
      if (table === "family_achievement_progress") {
        readProgressCallCount++;
        return readProgressCallCount <= 1
          ? emptyProgressChain
          : unlockCheckChain;
      }
      return originalFrom(table);
    }) as jest.Mock;

    const writeUpsert = makeUpsertResult();
    const writeUpdate = makeUpdateResult();
    let writeCallCount = 0;
    mockWriteClient.from.mockImplementation(() => {
      writeCallCount++;
      return writeCallCount === 1 ? writeUpsert : writeUpdate;
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.backfillProgress(FAMILY_ID);

    // Should have upserted a progress row
    expect(writeUpsert.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          family_id: FAMILY_ID,
          family_achievement_id: FAMILY_ACHIEVEMENT_ID,
        }),
      ]),
      expect.any(Object),
    );
  });

  it("evaluates all criteria even when progress rows already exist", async () => {
    // When backfillProgress is called and rows already exist, needsBackfill=false
    // but event=null must still force all-criteria evaluation
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test",
        criteria_type: "reward_redeemed",
        criteria_config: { threshold: 2, family_evaluation_mode: "sum" },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    // Row already exists — needsBackfill would be false without explicit null event
    const existingProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    const rewardChain = makeCountResult(4);

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

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      reward_redemptions: rewardChain,
    });

    let readProgressCallCount = 0;
    const originalFrom = readClient.from as jest.Mock;
    readClient.from = jest.fn((table: string) => {
      if (table === "family_achievement_progress") {
        readProgressCallCount++;
        return readProgressCallCount <= 1
          ? existingProgressChain
          : unlockCheckChain;
      }
      return originalFrom(table);
    }) as jest.Mock;

    const writeUpsert = makeUpsertResult();
    const writeUpdate = makeUpdateResult();
    let writeCallCount = 0;
    mockWriteClient.from.mockImplementation(() => {
      writeCallCount++;
      return writeCallCount === 1 ? writeUpsert : writeUpdate;
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.backfillProgress(FAMILY_ID);

    // reward_redeemed is not in QUEST_APPROVED criteria — only evaluated when event=null
    expect(writeUpsert.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          family_achievement_id: FAMILY_ACHIEVEMENT_ID,
        }),
      ]),
      expect.any(Object),
    );
  });

  it("sets unlocked_at when backfill finds threshold already met", async () => {
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 3, family_evaluation_mode: "sum" },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const emptyProgressChain = makeDataResult([]);

    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }), // current >= threshold
        }),
      }),
    };

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

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      quest_instances: questChain,
    });

    let readProgressCallCount = 0;
    const originalFrom = readClient.from as jest.Mock;
    readClient.from = jest.fn((table: string) => {
      if (table === "family_achievement_progress") {
        readProgressCallCount++;
        return readProgressCallCount <= 1
          ? emptyProgressChain
          : unlockCheckChain;
      }
      return originalFrom(table);
    }) as jest.Mock;

    const writeUpsert = makeUpsertResult();
    const writeUpdate = makeUpdateResult();
    let writeCallCount = 0;
    mockWriteClient.from.mockImplementation(() => {
      writeCallCount++;
      return writeCallCount === 1 ? writeUpsert : writeUpdate;
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.backfillProgress(FAMILY_ID);

    // Should have called update to set unlocked_at
    expect(writeUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_at: expect.any(String) }),
    );
  });
});
