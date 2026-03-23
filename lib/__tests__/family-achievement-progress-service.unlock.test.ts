import { FamilyAchievementProgressService } from "../family-achievement-progress-service";
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

describe("FamilyAchievementProgressService — unlock evaluation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sets unlocked_at when current >= threshold and not yet unlocked", async () => {
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
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };

    // Unlock check: not yet unlocked
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
      if (writeCallCount === 1) return writeUpsert;
      return writeUpdate;
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    // Should have called upsert for progress
    expect(writeUpsert.upsert).toHaveBeenCalled();
    // Should have called update for unlock
    expect(writeUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_at: expect.any(String) }),
    );
  });

  it("does NOT re-unlock already unlocked achievements", async () => {
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
          or: jest.fn().mockResolvedValue({ count: 10, error: null }),
        }),
      }),
    };

    // Already unlocked
    const unlockCheckChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              {
                family_achievement_id: FAMILY_ACHIEVEMENT_ID,
                unlocked_at: "2026-01-01T00:00:00Z",
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
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    // Only upsert should be called, not update (no unlock)
    expect(writeUpsert.upsert).toHaveBeenCalled();
    // mockWriteClient.from should only be called once (for upsert)
    expect(mockWriteClient.from).toHaveBeenCalledTimes(1);
  });

  it("does NOT unlock when current < threshold", async () => {
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 50, family_evaluation_mode: "sum" },
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

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      family_achievement_progress: famProgressChain as unknown as MockChain,
      quest_instances: questChain,
    });

    const writeUpsert = makeUpsertResult();
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    // Only upsert called, no unlock update
    expect(writeUpsert.upsert).toHaveBeenCalled();
    expect(mockWriteClient.from).toHaveBeenCalledTimes(1);
  });
});
