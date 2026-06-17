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
} from "../achievement-progress/unlock-evaluation-fixtures";

const mockWriteClient = { from: jest.fn(), rpc: jest.fn() };
jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

const BASE_ACH = {
  id: "ach-quest",
  name: "Quest Master",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 50,
  gold_reward: 25,
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

function makeCharChain() {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { user_id: USER_ID, user_profiles: null },
          error: null,
        }),
      }),
    }),
  };
}

describe("AchievementProgressService - integration & idempotency (8.4, 8.5, 9.1, 9.2)", () => {
  afterEach(() => jest.clearAllMocks());

  // 8.4 complete flow
  it("8.4 upserts progress, sets unlocked_at, and grants rewards in one call", async () => {
    const write = makeWriteMocks({
      unlockedIds: [BASE_ACH.id],
      rpcReturn: {
        unlocked_achievement_ids: [BASE_ACH.id],
        awarded_xp: 50,
        awarded_gold: 25,
        xp: 50,
        gold: 25,
        level: 1,
      },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    const readClient = makeReadClient({
      characters: makeCharChain() as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: makeCharAchChain(BASE_ACH.id, null),
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.upsert).toHaveBeenCalled();
    expect(write.charAchUpdate).not.toHaveBeenCalled();
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_unlock_achievements_and_grant_rewards",
      {
        p_achievement_ids: [BASE_ACH.id],
        p_character_id: CHAR_ID,
        p_season_id: null,
      },
    );
  });

  // 8.5 non-blocking unlock failure
  it("8.5 unlock evaluation failure is logged and does not cause updateProgress to throw", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockWriteClient.from.mockImplementation((t: string) => {
      if (t === "character_achievements") return { upsert };
      return { upsert };
    });
    mockWriteClient.rpc.mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "DB failure" },
      }),
    });

    const readClient = makeReadClient({
      characters: makeDataResult({ user_id: USER_ID }) as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: makeCharAchChain(BASE_ACH.id, null),
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await expect(
      svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" }),
    ).resolves.not.toThrow();

    expect(upsert).toHaveBeenCalled();
    expect(mockWriteClient.rpc).toHaveBeenCalledWith(
      "fn_unlock_achievements_and_grant_rewards",
      {
        p_achievement_ids: [BASE_ACH.id],
        p_character_id: CHAR_ID,
        p_season_id: null,
      },
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unlock evaluation failed"),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  // 9.1 idempotency: duplicate calls
  it("9.1 duplicate updateProgress produces no additional unlocks or rewards", async () => {
    // BASE_ACH: xp_reward=50; prevXp=0+50=50 >= 50*(2-1)^2=50 → level 2 on first call
    const write = makeWriteMocks({
      unlockedIds: [BASE_ACH.id],
      rpcReturn: {
        unlocked_achievement_ids: [BASE_ACH.id],
        awarded_xp: 50,
        awarded_gold: 25,
        xp: 50,
        gold: 25,
        level: 1,
      },
    });
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    let charAchN = 0;
    const charAchChain = {
      select: jest.fn().mockImplementation(() => {
        charAchN++;
        if (charAchN === 1 || charAchN === 3) {
          return {
            eq: jest.fn().mockResolvedValue({
              data: [{ achievement_id: BASE_ACH.id }],
              error: null,
            }),
          };
        }
        const alreadyUnlocked = charAchN > 2;
        return {
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                {
                  achievement_id: BASE_ACH.id,
                  unlocked_at: alreadyUnlocked ? "2026-01-01T00:00:00Z" : null,
                },
              ],
              error: null,
            }),
          }),
        };
      }),
    };

    const readClient = makeReadClient({
      characters: makeCharChain() as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    // First call: unlocks via atomic RPC and updates level once.
    // Second call: already locked → no update
    expect(write.charAchUpdate).not.toHaveBeenCalled();
    expect(mockWriteClient.rpc).toHaveBeenCalledTimes(1);
    expect(write.statsUpdate).toHaveBeenCalledTimes(1);
  });

  // 9.2 already-unlocked is no-op
  it("9.2 re-evaluation of already-unlocked achievement is a no-op", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);
    mockWriteClient.rpc.mockImplementation(write.rpc);

    const readClient = makeReadClient({
      characters: makeDataResult({ user_id: USER_ID }) as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: makeCharAchChain(
        BASE_ACH.id,
        "2026-01-01T00:00:00Z",
      ),
      quest_instances: makeQuestChain(10),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.charAchUpdate).not.toHaveBeenCalled();
    expect(write.statsUpdate).not.toHaveBeenCalled();
  });
});
