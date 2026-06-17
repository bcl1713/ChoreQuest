import { AchievementProgressService } from "./achievement-progress-service";
import {
  makeReadClient,
  makeDataResult,
} from "./achievement-progress-service.fixtures";
import type { MockChain } from "./achievement-progress-service.fixtures";
import {
  makeWriteMocks,
  makeUnlockReadClient,
  DEFAULT_ACHIEVEMENT,
  CHAR_ID,
  USER_ID,
} from "./achievement-progress/unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

// prevXp=40, award xp=60 → new xp=100 >= level-2 threshold (50) → level-up triggered
const LEVEL_UP_ACHIEVEMENT = {
  ...DEFAULT_ACHIEVEMENT,
  xp_reward: 60,
  gold_reward: 0,
};
const LEVEL_UP_RPC_RETURN = {
  unlocked_achievement_ids: [LEVEL_UP_ACHIEVEMENT.id],
  awarded_xp: 60,
  awarded_gold: 0,
  xp: 100,
  gold: 0,
  level: 1,
};

describe("AchievementProgressService - rollback compensation", () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("reverts stats when level update fails after RPC succeeds", async () => {
    const write = makeWriteMocks({
      unlockedIds: [LEVEL_UP_ACHIEVEMENT.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      levelUpdateError: "level-update-fail",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
      achievement: LEVEL_UP_ACHIEVEMENT,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    // Fix P1: stats rollback uses direct UPDATE (xp: 100-60=40, gold: 0-0=0)
    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 40, gold: 0 });
  });
  it("reverts stats and level when cascade upsert fails", async () => {
    const questAch = {
      id: "ach-quest",
      name: "Quest Master",
      criteria_type: "quest_complete",
      criteria_config: { threshold: 5 },
      xp_reward: 60,
      gold_reward: 0,
    };
    const levelAch = {
      id: "ach-level",
      name: "Level Up!",
      criteria_type: "level_reached",
      criteria_config: { threshold: 2 },
      xp_reward: 0,
      gold_reward: 0,
    };
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      cascadeUpsertError: "cascade-fail",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: questAch.id },
                { achievement_id: levelAch.id },
              ],
              error: null,
            }),
          };
        }
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ achievement_id: questAch.id, unlocked_at: null }],
              error: null,
            }),
          }),
        };
      }),
    };
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
        questAch,
        levelAch,
      ]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    // Fix P1: level rollback still uses direct UPDATE with prevLevel=1
    expect(write.statsUpdate).toHaveBeenCalledWith({ level: 1 });
    // Fix P1: stats rollback uses direct UPDATE (xp: 100-60=40, gold: 0-0=0)
    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 40, gold: 0 });
  });

  it("logs critical error if stats revert UPDATE fails", async () => {
    const write = makeWriteMocks({
      unlockedIds: [LEVEL_UP_ACHIEVEMENT.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      levelUpdateError: "trigger-rollback",
      statsRevertError: "stats-revert-fail",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
      achievement: LEVEL_UP_ACHIEVEMENT,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Critical: failed to revert stats after reward failure:",
      expect.objectContaining({ message: "stats-revert-fail" }),
    );
  });

  it("reverts cascade progress rows when recursive unlock fails after upsert succeeds", async () => {
    const questAch = {
      id: "ach-quest",
      name: "Quest Master",
      criteria_type: "quest_complete",
      criteria_config: { threshold: 5 },
      xp_reward: 50,
      gold_reward: 0,
    };
    const xpEarnedAch = {
      id: "ach-xp",
      name: "XP Earner",
      criteria_type: "xp_earned",
      criteria_config: { threshold: 100 },
      xp_reward: 0,
      gold_reward: 0,
    };
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: {
        unlocked_achievement_ids: [questAch.id],
        awarded_xp: 50,
        awarded_gold: 0,
        xp: 50,
        gold: 0,
        level: 1,
      },
      levelSelectRows: [], // no level-up
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: questAch.id },
                { achievement_id: xpEarnedAch.id },
              ],
              error: null,
            }),
          };
        }
        if (charAchN === 2) {
          return {
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ achievement_id: questAch.id, unlocked_at: null }],
                error: null,
              }),
            }),
          };
        }
        if (charAchN === 3) {
          // Fix P2: cascade snapshot read — no prior progress for xpEarnedAch
          return {
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        // depth=1 recursive fetch fails → triggers outer catch
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "recursive-fetch-fail" },
            }),
          }),
        };
      }),
    };
    const readClient = makeReadClient({
      characters: {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: USER_ID, user_profiles: null },
              error: null,
            }),
          }),
        }),
      } as unknown as MockChain,
      achievements: makeDataResult([
        questAch,
        xpEarnedAch,
      ]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      } as unknown as MockChain,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    // P2 fix: brand-new cascade rows are deleted, not upserted with null
    expect(write.upsert).toHaveBeenCalledTimes(2); // no 3rd upsert
    expect(write.cascadeDelete).toHaveBeenCalled();
    expect(write.cascadeDeleteIn).toHaveBeenCalledWith("achievement_id", [
      xpEarnedAch.id,
    ]);
  });

  it("detects revert failure when Supabase returns { error } not throw", async () => {
    const write = makeWriteMocks({
      unlockedIds: [LEVEL_UP_ACHIEVEMENT.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      levelUpdateError: "trigger-rollback",
      revertUnlockError: "RLS",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    const readClient = makeUnlockReadClient({
      questCount: 5,
      unlockedAt: null,
      achievement: LEVEL_UP_ACHIEVEMENT,
    });
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Critical: failed to revert unlock after reward failure:",
      expect.objectContaining({ message: "RLS" }),
    );
  });
});
