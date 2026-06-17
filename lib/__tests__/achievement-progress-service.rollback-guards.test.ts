/**
 * P1/P2 rollback guard tests — three new scenarios added in the fix:
 *   P1a: level rollback carries an optimistic-lock eq("level", appliedLevel)
 *   P1b: stats rollback uses a conditional SET, not a negative RPC increment
 *   P2:  cascade rollback restores pre-existing progress, not null
 */
import { AchievementProgressService } from "../achievement-progress-service";
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
} from "../achievement-progress/unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const LEVEL_UP_ACHIEVEMENT = {
  ...DEFAULT_ACHIEVEMENT,
  xp_reward: 60,
  gold_reward: 0,
};
// RPC returns xp=100, gold=0, level=1 after the +60 xp increment
const LEVEL_UP_RPC_RETURN = {
  unlocked_achievement_ids: [LEVEL_UP_ACHIEVEMENT.id],
  awarded_xp: 60,
  awarded_gold: 0,
  xp: 100,
  gold: 0,
  level: 1,
};

function makeQuestLevelAchievements() {
  return {
    questAch: {
      id: "ach-quest",
      name: "Quest Master",
      criteria_type: "quest_complete",
      criteria_config: { threshold: 5 },
      xp_reward: 60,
      gold_reward: 0,
    },
    levelAch: {
      id: "ach-level",
      name: "Level Reached",
      criteria_type: "level_reached",
      criteria_config: { threshold: 2 },
      xp_reward: 0,
      gold_reward: 0,
    },
  };
}

function makeSimpleCharAchChain(questAchId: string, levelAchId: string) {
  let n = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      n++;
      if (n === 1)
        return {
          eq: jest.fn().mockResolvedValue({
            data: [
              { achievement_id: questAchId },
              { achievement_id: levelAchId },
            ],
            error: null,
          }),
        };
      return {
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ achievement_id: questAchId, unlocked_at: null }],
            error: null,
          }),
        }),
      };
    }),
  };
}

describe("AchievementProgressService - rollback guard fixes (P1/P2)", () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("P1 level guard: rollback UPDATE carries eq(level, appliedLevel) to skip stale reverts", async () => {
    const { questAch, levelAch } = makeQuestLevelAchievements();
    // cascade upsert fails after level-up was successfully written (appliedLevel=2)
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      cascadeUpsertError: "cascade-fail",
      // levelSelectRows defaults to [{ level: 2 }] → appliedLevel = 2
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

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
        levelAch,
      ]) as unknown as MockChain,
      character_achievements: makeSimpleCharAchChain(questAch.id, levelAch.id),
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

    // The second .eq() in the level-rollback chain must carry the value we
    // wrote so a concurrent advance is not silently reversed.
    expect(write.levelRevertEq2).toHaveBeenCalledWith("level", 2);
  });

  it("P1 stats guard: rollback uses conditional SET, not a negative RPC increment", async () => {
    // level update fails → stats were applied (capturedNewStats={xp:100,gold:0})
    const write = makeWriteMocks({
      unlockedIds: [LEVEL_UP_ACHIEVEMENT.id],
      rpcReturn: LEVEL_UP_RPC_RETURN, // totalXp=60
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

    // Must NOT call RPC a second time (no negative increment)
    expect(mockWriteClient.rpc).toHaveBeenCalledTimes(1);
    // Must call characters.update with the computed previous values
    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 40, gold: 0 }); // 100-60, 0-0
    // Optimistic-lock guards match the captured post-increment snapshot
    expect(write.statsRevertEq2).toHaveBeenCalledWith("xp", 100);
    expect(write.statsRevertEq3).toHaveBeenCalledWith("gold", 0);
  });

  it("P2 cascade restore: rollback restores pre-existing progress instead of writing null", async () => {
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
    const priorProgress = { current: 90, threshold: 100 };
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
      levelSelectRows: [],
      cascadeUpsertError: "cascade-fail",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1)
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: questAch.id },
                { achievement_id: xpEarnedAch.id },
              ],
              error: null,
            }),
          };
        if (charAchN === 2)
          return {
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ achievement_id: questAch.id, unlocked_at: null }],
                error: null,
              }),
            }),
          };
        // charAchN === 3: cascade snapshot — xpEarnedAch has prior progress
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: xpEarnedAch.id, progress: priorProgress },
              ],
              error: null,
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

    // Cascade revert upsert must restore prior progress, not null
    expect(write.upsert).toHaveBeenNthCalledWith(
      3,
      [
        {
          character_id: CHAR_ID,
          achievement_id: xpEarnedAch.id,
          progress: priorProgress,
        },
      ],
      { onConflict: "character_id,achievement_id" },
    );
  });
});
