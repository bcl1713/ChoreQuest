import { AchievementProgressService } from "../achievement-progress-service";
import {
  makeReadClient,
  makeDataResult,
} from "./achievement-progress-service.fixtures";
import type { MockChain } from "./achievement-progress-service.fixtures";
import {
  makeWriteMocks,
  makeCharAchChain,
  makeUnlockReadClient,
  DEFAULT_ACHIEVEMENT,
  CHAR_ID,
  USER_ID,
} from "./unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("AchievementProgressService - unlock detection (5.5, 5.6)", () => {
  afterEach(() => jest.clearAllMocks());

  it("5.5 sets unlocked_at when criteria newly met and unlocked_at is null", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.charAchUpdate).toHaveBeenCalled();
  });

  it("5.5 skips unlock when achievement already has unlocked_at set", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    const readClient = makeUnlockReadClient({
      questCount: 10,
      unlockedAt: "2026-01-01T00:00:00Z",
      achievement: { xp_reward: 50, gold_reward: 25 },
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.charAchUpdate).not.toHaveBeenCalled();
  });

  it("5.5 skips unlock when progress is below threshold", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    const readClient = makeUnlockReadClient({
      questCount: 3,
      unlockedAt: null,
      achievement: {
        criteria_config: { threshold: 10 },
        xp_reward: 50,
        gold_reward: 25,
      },
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.charAchUpdate).not.toHaveBeenCalled();
  });

  it("5.5 unlocks compound achievement when top-level met flag is true", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: USER_ID,
              user_profiles: null,
              xp: 0,
              level: 3,
              honor_points: 0,
            },
            error: null,
          }),
        }),
      }),
    };
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };
    const achId = "ach-compound";
    const achievementsChain = makeDataResult([
      {
        id: achId,
        name: "All Rounder",
        criteria_type: "compound",
        criteria_config: {
          evaluation_strategy: "compound",
          operator: "AND",
          conditions: [
            { criteria_type: "quest_complete", threshold: 3 },
            { criteria_type: "level_reached", threshold: 2 },
          ],
        },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);
    // Empty first call triggers backfill (ALL_CRITERIA_TYPES including "compound")
    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1) {
          return { eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ achievement_id: achId, unlocked_at: null }],
              error: null,
            }),
          }),
        };
      }),
    };
    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.charAchUpdate).toHaveBeenCalled();
  });

  it("5.6 IS NULL filter is applied on unlock update for concurrency safety", async () => {
    const isNull = jest.fn().mockResolvedValue({ error: null });
    const inFn = jest.fn().mockReturnValue({ is: isNull });
    const eqFn = jest.fn().mockReturnValue({ in: inFn });
    const charAchUpdate = jest.fn().mockReturnValue({ eq: eqFn });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockWriteClient.from.mockImplementation((t: string) => {
      if (t === "character_achievements")
        return { upsert, update: charAchUpdate };
      return { upsert };
    });
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
      achievement: { xp_reward: 0, gold_reward: 0 },
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(isNull).toHaveBeenCalledWith("unlocked_at", null);
  });
});

describe("AchievementProgressService - reward granting (6.6, 6.7)", () => {
  afterEach(() => jest.clearAllMocks());

  function setupRewardTest(charStats: {
    xp: number;
    gold: number;
    level: number;
  }) {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    let charCallCount = 0;
    const charChain = {
      select: jest.fn().mockImplementation(() => {
        charCallCount++;
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data:
                charCallCount === 1
                  ? { user_id: USER_ID, user_profiles: null }
                  : charStats,
              error: null,
            }),
          }),
        };
      }),
    };
    return { write, charChain };
  }

  it("6.6 increments character xp and gold on single unlock", async () => {
    const { write, charChain } = setupRewardTest({
      xp: 100,
      gold: 50,
      level: 1,
    });
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };
    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([
        DEFAULT_ACHIEVEMENT,
      ]) as unknown as MockChain,
      character_achievements: makeCharAchChain(DEFAULT_ACHIEVEMENT.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.statsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ xp: 150, gold: 75 }),
    );
  });

  it("6.6 skips character stats update when total rewards are zero", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
      achievement: { xp_reward: 0, gold_reward: 0 },
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.statsUpdate).not.toHaveBeenCalled();
  });

  it("6.7 includes level in update when XP reward triggers level-up", async () => {
    // Level 1 with 40 XP + 60 XP = 100 >= 50*(2-1)^2=50 → level 2
    const { write, charChain } = setupRewardTest({ xp: 40, gold: 0, level: 1 });
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };
    const achievement = {
      ...DEFAULT_ACHIEVEMENT,
      xp_reward: 60,
      gold_reward: 0,
    };
    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([achievement]) as unknown as MockChain,
      character_achievements: makeCharAchChain(achievement.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.statsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ xp: 100, level: 2 }),
    );
  });

  it("6.7 does not include level when XP reward does not trigger level-up", async () => {
    // Level 1 with 0 XP + 10 XP = 10 < 50 → stays level 1
    const { write, charChain } = setupRewardTest({ xp: 0, gold: 0, level: 1 });
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };
    const achievement = {
      ...DEFAULT_ACHIEVEMENT,
      xp_reward: 10,
      gold_reward: 0,
    };
    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([achievement]) as unknown as MockChain,
      character_achievements: makeCharAchChain(achievement.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    const updateArg = write.statsUpdate.mock.calls[0]?.[0];
    expect(updateArg).toBeDefined();
    expect(updateArg).not.toHaveProperty("level");
  });
});
