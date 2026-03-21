import { AchievementProgressService } from "../achievement-progress-service";
import {
  makeReadClient,
  makeDataResult,
} from "./achievement-progress-service.fixtures";
import type { MockChain } from "./achievement-progress-service.fixtures";
import {
  makeWriteMocks,
  makeCharAchChain,
  CHAR_ID,
  USER_ID,
} from "./unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const QUEST_ACH = {
  id: "ach-quest",
  name: "Quest Master",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 60, // triggers level-up from level 1 with 40 XP
  gold_reward: 0,
};
const LEVEL_ACH = {
  id: "ach-level",
  name: "Ascending",
  criteria_type: "level_reached",
  criteria_config: { threshold: 2 },
  xp_reward: 0,
  gold_reward: 0,
};

function makeQuestChain(count: number): MockChain {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ count, error: null }),
      }),
    }),
  };
}

function makeCharChain(secondCallStats: {
  xp: number;
  gold: number;
  level: number;
}) {
  let n = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      n++;
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data:
              n === 1
                ? { user_id: USER_ID, user_profiles: null }
                : secondCallStats,
            error: null,
          }),
        }),
      };
    }),
  };
}

describe("AchievementProgressService - level-up cascade (7.3)", () => {
  afterEach(() => jest.clearAllMocks());

  it("7.3 cascades to unlock level_reached achievement after XP-triggered level-up", async () => {
    // prevXp=40, award xp=60 → new xp=100 → level 2; cascade unlocks LEVEL_ACH
    const write = makeWriteMocks({
      unlockedIds: [QUEST_ACH.id],
      rpcReturn: { xp: 100, gold: 0, level: 1 },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    // First IS NULL update unlocks QUEST_ACH; cascade update unlocks LEVEL_ACH
    write.selectAfterIs
      .mockResolvedValueOnce({
        data: [{ achievement_id: QUEST_ACH.id }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ achievement_id: LEVEL_ACH.id }],
        error: null,
      });

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: QUEST_ACH.id },
                { achievement_id: LEVEL_ACH.id },
              ],
              error: null,
            }),
          };
        }
        const id = charAchN === 2 ? QUEST_ACH.id : LEVEL_ACH.id;
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ achievement_id: id, unlocked_at: null }],
              error: null,
            }),
          }),
        };
      }),
    };

    const readClient = makeReadClient({
      characters: makeCharChain({
        xp: 40,
        gold: 0,
        level: 1,
      }) as unknown as MockChain,
      achievements: makeDataResult([
        QUEST_ACH,
        LEVEL_ACH,
      ]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    // Unlock called twice: quest_complete then level cascade
    expect(write.charAchUpdate).toHaveBeenCalledTimes(2);
  });

  it("7.3 no cascade when XP reward does not trigger level-up", async () => {
    const noLevelUpAch = { ...QUEST_ACH, xp_reward: 10 };
    const write = makeWriteMocks({
      unlockedIds: [noLevelUpAch.id],
      rpcReturn: { xp: 10, gold: 0, level: 1 },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    const readClient = makeReadClient({
      characters: makeCharChain({
        xp: 0,
        gold: 0,
        level: 1,
      }) as unknown as MockChain,
      achievements: makeDataResult([
        noLevelUpAch,
        LEVEL_ACH,
      ]) as unknown as MockChain,
      character_achievements: makeCharAchChain(noLevelUpAch.id, null),
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.charAchUpdate).toHaveBeenCalledTimes(1);
  });
});
