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

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("AchievementProgressService - unlock detection (5.5, 5.6)", () => {
  afterEach(() => jest.clearAllMocks());

  it("5.5 sets unlocked_at when criteria newly met and unlocked_at is null", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
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
    mockWriteClient.rpc.mockImplementation(write.rpc);
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
    mockWriteClient.rpc.mockImplementation(write.rpc);
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
    const achId = "ach-compound";
    const write = makeWriteMocks({ unlockedIds: [achId] });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
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
    const selectAfterIs = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const isNull = jest.fn().mockReturnValue({ select: selectAfterIs });
    const inFn = jest.fn().mockReturnValue({ is: isNull });
    const eqFn = jest.fn().mockReturnValue({ in: inFn });
    const charAchUpdate = jest.fn().mockReturnValue({ eq: eqFn });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockWriteClient.from.mockImplementation((t: string) => {
      if (t === "character_achievements")
        return { upsert, update: charAchUpdate };
      return { upsert };
    });
    mockWriteClient.rpc.mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
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

  function setupRewardTest(rpcReturn: {
    xp: number;
    gold: number;
    level: number;
  }) {
    const write = makeWriteMocks({ rpcReturn });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: USER_ID, user_profiles: null },
            error: null,
          }),
        }),
      }),
    };
    return { write, charChain };
  }

  it("6.6 increments character xp and gold on single unlock", async () => {
    // prevXp=100, award (50,25); already level 2 (needs 200 for L3) → new xp=150, no level-up
    const { write, charChain } = setupRewardTest({
      xp: 150,
      gold: 75,
      level: 2,
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
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_increment_character_stats",
      { p_character_id: CHAR_ID, p_xp: 50, p_gold: 25 },
    );
    expect(write.statsUpdate).not.toHaveBeenCalled();
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
    // prevXp=40, award xp=60 → new xp=100; 100 >= 50*(2-1)^2=50 → level 2
    // RPC returns new totals with level still at 1 (level update is separate)
    const { write, charChain } = setupRewardTest({
      xp: 100,
      gold: 0,
      level: 1,
    });
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
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_increment_character_stats",
      { p_character_id: CHAR_ID, p_xp: 60, p_gold: 0 },
    );
    expect(write.statsUpdate).toHaveBeenCalledWith({ level: 2 });
  });

  it("6.7 does not update level when XP reward does not trigger level-up", async () => {
    // prevXp=0, award xp=10 → new xp=10 < 50; stays level 1 → no level update
    const { write, charChain } = setupRewardTest({ xp: 10, gold: 0, level: 1 });
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
    expect(mockWriteClient.rpc).toHaveBeenCalled();
    expect(write.statsUpdate).not.toHaveBeenCalled();
  });
});
