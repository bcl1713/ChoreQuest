/**
 * Tests that rollback preserves consistency when stats compensation fails:
 * - Zero-row stats rollback (concurrent write) is treated as failure
 * - Level, unlocked_at, and cascade progress are all skipped when stats fail
 * - Cascade snapshot read failure aborts before corrupting rollback state
 */
import { AchievementProgressService } from "../achievement-progress-service";
import { makeWriteMocks, CHAR_ID } from "./unlock-evaluation-fixtures";
import {
  makeQuestLevelAchievements,
  makeDualCharAchChain,
  makeMultiAchReadClient,
} from "./unlock-multi-ach-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const LEVEL_UP_RPC_RETURN = { xp: 100, gold: 0, level: 1 };

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
    const readClient = makeMultiAchReadClient(
      [questAch, levelAch],
      makeDualCharAchChain(questAch.id, levelAch.id),
    );
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 40, gold: 0 });
    expect(write.levelRevertEq2).not.toHaveBeenCalled();
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
    const xpAch = {
      id: "ach-xp",
      name: "XP Earner",
      criteria_type: "xp_earned",
      criteria_config: { threshold: 100 },
      xp_reward: 0,
      gold_reward: 0,
    };
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: { xp: 50, gold: 0, level: 1 },
      levelSelectRows: [],
      cascadeUpsertError: "cascade-fail",
      statsRevertError: "concurrent-write",
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let n = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        n++;
        if (n === 1)
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: questAch.id },
                { achievement_id: xpAch.id },
              ],
              error: null,
            }),
          };
        if (n === 2)
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
                {
                  achievement_id: xpAch.id,
                  progress: { current: 90, threshold: 100 },
                },
              ],
              error: null,
            }),
          }),
        };
      }),
    };
    const readClient = makeMultiAchReadClient([questAch, xpAch], charAchChain);
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.upsert).toHaveBeenCalledTimes(2);
    expect(write.cascadeDelete).not.toHaveBeenCalled();
  });

  it("treats zero-row stats rollback as failed compensation", async () => {
    const { questAch, levelAch } = makeQuestLevelAchievements();
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: LEVEL_UP_RPC_RETURN,
      cascadeUpsertError: "cascade-fail",
      statsRevertZeroRows: true,
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    const readClient = makeMultiAchReadClient(
      [questAch, levelAch],
      makeDualCharAchChain(questAch.id, levelAch.id),
    );
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.levelRevertEq2).not.toHaveBeenCalled();
    expect(write.inForRevert).not.toHaveBeenCalled();
    expect(write.upsert).toHaveBeenCalledTimes(2);
    expect(write.cascadeDelete).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("zero rows"),
    );
  });

  it("throws when cascade snapshot read fails instead of silently continuing", async () => {
    const questAch = {
      id: "ach-quest",
      name: "Quest Master",
      criteria_type: "quest_complete",
      criteria_config: { threshold: 5 },
      xp_reward: 50,
      gold_reward: 0,
    };
    const xpAch = {
      id: "ach-xp",
      name: "XP Earner",
      criteria_type: "xp_earned",
      criteria_config: { threshold: 100 },
      xp_reward: 0,
      gold_reward: 0,
    };
    const write = makeWriteMocks({
      unlockedIds: [questAch.id],
      rpcReturn: { xp: 50, gold: 0, level: 1 },
      levelSelectRows: [],
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let n = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        n++;
        if (n === 1)
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: questAch.id },
                { achievement_id: xpAch.id },
              ],
              error: null,
            }),
          };
        if (n === 2)
          return {
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [{ achievement_id: questAch.id, unlocked_at: null }],
                error: null,
              }),
            }),
          };
        // cascade snapshot read FAILS
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "transient-read-failure" },
            }),
          }),
        };
      }),
    };
    const readClient = makeMultiAchReadClient([questAch, xpAch], charAchChain);
    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    // The throw triggers the catch block which rolls back stats
    expect(write.statsUpdate).toHaveBeenCalledWith({ xp: 0, gold: 0 });
  });
});
