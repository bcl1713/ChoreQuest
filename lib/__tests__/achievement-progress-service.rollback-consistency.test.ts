/**
 * Tests that when stats rollback fails (concurrent write), the rollback
 * preserves consistency by skipping level revert and cascade progress revert.
 * Without these guards, a failed stats rollback would leave the character
 * with high XP/gold at a low level, or with stale cascade progress.
 */
import { AchievementProgressService } from "../achievement-progress-service";
import {
  makeReadClient,
  makeDataResult,
} from "./achievement-progress-service.fixtures";
import type { MockChain } from "./achievement-progress-service.fixtures";
import { makeWriteMocks, CHAR_ID, USER_ID } from "./unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const LEVEL_UP_RPC_RETURN = { xp: 100, gold: 0, level: 1 };

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

function makeQuestReadClient(
  questAchId: string,
  levelAchId: string,
  achievements: unknown[],
  charAchChain: unknown,
) {
  return makeReadClient({
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
    achievements: makeDataResult(achievements) as unknown as MockChain,
    character_achievements: charAchChain,
    quest_instances: {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    } as unknown as MockChain,
  });
}

describe("AchievementProgressService - rollback consistency on stats failure", () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("skips level rollback when stats rollback fails (concurrent write)", async () => {
    const { questAch, levelAch } = makeQuestLevelAchievements();
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      cascadeUpsertError: "cascade-fail",
      statsRevertError: "concurrent-write",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    const readClient = makeQuestReadClient(
      questAch.id,
      levelAch.id,
      [questAch, levelAch],
      makeSimpleCharAchChain(questAch.id, levelAch.id),
    );
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    // Stats rollback was attempted
    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 40, gold: 0 });
    // Level rollback must NOT have been called
    expect(write.levelRevertEq2).not.toHaveBeenCalled();
    // unlocked_at must NOT be cleared (achievements stay locked-in)
    expect(write.inForRevert).not.toHaveBeenCalled();
  });

  it("skips cascade progress rollback when stats rollback fails", async () => {
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
      rpcReturn: { xp: 50, gold: 0, level: 1 },
      levelSelectRows: [],
      cascadeUpsertError: "cascade-fail",
      statsRevertError: "concurrent-write",
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
    const readClient = makeQuestReadClient(
      questAch.id,
      xpEarnedAch.id,
      [questAch, xpEarnedAch],
      charAchChain,
    );
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    // Stats rollback failed, so cascade progress must NOT be reverted.
    // Only 2 upserts: initial progress + cascade (no 3rd revert upsert).
    expect(write.upsert).toHaveBeenCalledTimes(2);
    // No phantom row deletion either
    expect(write.cascadeDelete).not.toHaveBeenCalled();
  });
});
