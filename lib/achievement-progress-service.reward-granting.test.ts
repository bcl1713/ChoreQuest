import { AchievementProgressService } from "./achievement-progress-service";
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
} from "./achievement-progress/unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("AchievementProgressService - reward granting (6.6, 6.7)", () => {
  afterEach(() => jest.clearAllMocks());

  function setupRewardTest(rpcReturn: {
    unlocked_achievement_ids: string[];
    awarded_xp: number;
    awarded_gold: number;
    xp: number | null;
    gold: number | null;
    level: number | null;
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
    const { write, charChain } = setupRewardTest({
      unlocked_achievement_ids: [DEFAULT_ACHIEVEMENT.id],
      awarded_xp: 50,
      awarded_gold: 25,
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
      achievements: makeDataResult([DEFAULT_ACHIEVEMENT]) as unknown as MockChain,
      character_achievements: makeCharAchChain(DEFAULT_ACHIEVEMENT.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_unlock_achievements_and_grant_rewards",
      {
        p_achievement_ids: [DEFAULT_ACHIEVEMENT.id],
        p_character_id: CHAR_ID,
        p_season_id: null,
      },
    );
    expect(write.charAchUpdate).not.toHaveBeenCalled();
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
    const { write, charChain } = setupRewardTest({
      unlocked_achievement_ids: [DEFAULT_ACHIEVEMENT.id],
      awarded_xp: 60,
      awarded_gold: 0,
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
    const achievement = { ...DEFAULT_ACHIEVEMENT, xp_reward: 60, gold_reward: 0 };
    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([achievement]) as unknown as MockChain,
      character_achievements: makeCharAchChain(achievement.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_unlock_achievements_and_grant_rewards",
      {
        p_achievement_ids: [achievement.id],
        p_character_id: CHAR_ID,
        p_season_id: null,
      },
    );
    expect(write.statsUpdate).toHaveBeenCalledWith({ level: 2 });
  });

  it("6.7 does not update level when XP reward does not trigger level-up", async () => {
    const { write, charChain } = setupRewardTest({
      unlocked_achievement_ids: [DEFAULT_ACHIEVEMENT.id],
      awarded_xp: 10,
      awarded_gold: 0,
      xp: 10,
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
    const achievement = { ...DEFAULT_ACHIEVEMENT, xp_reward: 10, gold_reward: 0 };
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

  it("6.6 uses one atomic RPC instead of separate unlock and reward writes", async () => {
    const { write, charChain } = setupRewardTest({
      unlocked_achievement_ids: [DEFAULT_ACHIEVEMENT.id],
      awarded_xp: 50,
      awarded_gold: 25,
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
      achievements: makeDataResult([DEFAULT_ACHIEVEMENT]) as unknown as MockChain,
      character_achievements: makeCharAchChain(DEFAULT_ACHIEVEMENT.id, null),
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(write.charAchUpdate).not.toHaveBeenCalled();
    expect(mockWriteClient.rpc).toHaveBeenCalledTimes(1);
  });
});
