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
  xp_reward: 60,
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
const XP_COMPOUND_ACH = {
  id: "ach-xp-compound",
  name: "XP Collector",
  criteria_type: "compound",
  criteria_config: {
    operator: "AND",
    evaluation_strategy: "compound",
    conditions: [{ criteria_type: "xp_earned", threshold: 10 }],
  },
  xp_reward: 0,
  gold_reward: 0,
};
const DEDUP_COMPOUND_ACH = {
  id: "ach-dedup-compound",
  name: "XP and Level",
  criteria_type: "compound",
  criteria_config: {
    operator: "AND",
    evaluation_strategy: "compound",
    conditions: [
      { criteria_type: "xp_earned", threshold: 100 },
      { criteria_type: "level_reached", threshold: 2 },
    ],
  },
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

/** Two-state char chain: n=1 → user context, n>=2 → stats. */
function makeCharChain(stats: { xp: number; gold: number; level: number }) {
  let n = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      n++;
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: n === 1 ? { user_id: USER_ID, user_profiles: null } : stats,
            error: null,
          }),
        }),
      };
    }),
  };
}

describe("AchievementProgressService - P1/P2 cascade fixes", () => {
  afterEach(() => jest.clearAllMocks());

  it("[P2] cascades to unlock compound achievement with xp_earned sub-condition after XP reward (no level-up)", async () => {
    const XP_QUEST = { ...QUEST_ACH, id: "ach-xp-quest", xp_reward: 10 };
    const write = makeWriteMocks({
      unlockedIds: [XP_QUEST.id],
      rpcReturn: {
        unlocked_achievement_ids: [XP_QUEST.id],
        awarded_xp: 10,
        awarded_gold: 0,
        xp: 10,
        gold: 0,
        level: 1,
      },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    write.selectAfterIs
      .mockResolvedValueOnce({
        data: [{ achievement_id: XP_QUEST.id }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ achievement_id: XP_COMPOUND_ACH.id }],
        error: null,
      });

    let charN = 0;
    const charChain = {
      select: jest.fn().mockImplementation(() => {
        charN++;
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data:
                charN === 1
                  ? { user_id: USER_ID, user_profiles: null }
                  : charN === 2
                    ? { xp: 0, gold: 0, level: 1 }
                    : { xp: 10, gold: 0, level: 1 },
              error: null,
            }),
          }),
        };
      }),
    };

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [
                { achievement_id: XP_QUEST.id },
                { achievement_id: XP_COMPOUND_ACH.id },
              ],
              error: null,
            }),
          };
        }
        const id = charAchN === 2 ? XP_QUEST.id : XP_COMPOUND_ACH.id;
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
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([
        XP_QUEST,
        XP_COMPOUND_ACH,
      ]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.charAchUpdate).toHaveBeenCalledTimes(1);
  });

  it("[P1] does not cascade level_reached achievement when concurrent write loses level race", async () => {
    const write = makeWriteMocks({
      unlockedIds: [QUEST_ACH.id],
      rpcReturn: {
        unlocked_achievement_ids: [QUEST_ACH.id],
        awarded_xp: 60,
        awarded_gold: 0,
        xp: 100,
        gold: 0,
        level: 1,
      },
      levelSelectRows: [],
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    write.selectAfterIs.mockResolvedValueOnce({
      data: [{ achievement_id: QUEST_ACH.id }],
      error: null,
    });

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
      character_achievements: makeCharAchChain(QUEST_ACH.id, null),
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.charAchUpdate).toHaveBeenCalledTimes(0);
    expect(write.statsSelect).toHaveBeenCalledTimes(1);
    await expect(write.statsSelect.mock.results[0].value).resolves.toMatchObject({ data: [] });
  });

  it("[P2] evaluates compound achievement with both xp_earned and level_reached exactly once on XP+level-up", async () => {
    const write = makeWriteMocks({
      unlockedIds: [QUEST_ACH.id],
      rpcReturn: {
        unlocked_achievement_ids: [QUEST_ACH.id],
        awarded_xp: 60,
        awarded_gold: 0,
        xp: 100,
        gold: 0,
        level: 1,
      },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);
    write.selectAfterIs
      .mockResolvedValueOnce({
        data: [{ achievement_id: QUEST_ACH.id }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ achievement_id: DEDUP_COMPOUND_ACH.id }],
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
                { achievement_id: DEDUP_COMPOUND_ACH.id },
              ],
              error: null,
            }),
          };
        }
        const id = charAchN === 2 ? QUEST_ACH.id : DEDUP_COMPOUND_ACH.id;
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
        xp: 100,
        gold: 0,
        level: 2,
      }) as unknown as MockChain,
      achievements: makeDataResult([
        QUEST_ACH,
        DEDUP_COMPOUND_ACH,
      ]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.upsert).toHaveBeenCalledTimes(2);
    const cascadeRows = write.upsert.mock.calls[1][0] as Array<{ achievement_id: string }>;
    expect(cascadeRows).toHaveLength(1);
    expect(cascadeRows[0].achievement_id).toBe(DEDUP_COMPOUND_ACH.id);
  });
});
