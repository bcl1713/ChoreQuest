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

const mockWriteClient = { from: jest.fn() };
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

function makeCharChain(secondCallStats?: {
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
              n === 1 || !secondCallStats
                ? { user_id: USER_ID, user_profiles: null }
                : secondCallStats,
            error: null,
          }),
        }),
      };
    }),
  };
}

describe("AchievementProgressService - integration & idempotency (8.4, 8.5, 9.1, 9.2)", () => {
  afterEach(() => jest.clearAllMocks());

  // 8.4 complete flow
  it("8.4 upserts progress, sets unlocked_at, and grants rewards in one call", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);

    const readClient = makeReadClient({
      characters: makeCharChain({
        xp: 0,
        gold: 0,
        level: 1,
      }) as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: makeCharAchChain(BASE_ACH.id, null),
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.upsert).toHaveBeenCalled();
    expect(write.charAchUpdate).toHaveBeenCalled();
    expect(write.statsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ xp: 50, gold: 25 }),
    );
  });

  // 8.5 non-blocking unlock failure
  it("8.5 unlock evaluation failure is logged and does not cause updateProgress to throw", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const failUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({ error: { message: "DB failure" } }),
        }),
      }),
    });
    mockWriteClient.from.mockImplementation((t: string) => {
      if (t === "character_achievements") return { upsert, update: failUpdate };
      return { upsert };
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
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unlock evaluation failed"),
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  // 9.1 idempotency: duplicate calls
  it("9.1 duplicate updateProgress produces no additional unlocks or rewards", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);

    let charN = 0;
    const charChain = {
      select: jest.fn().mockImplementation(() => {
        charN++;
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data:
                charN === 1 || charN === 3
                  ? { user_id: USER_ID, user_profiles: null }
                  : { xp: 0, gold: 0, level: 1 },
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
      characters: charChain as unknown as MockChain,
      achievements: makeDataResult([BASE_ACH]) as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: makeQuestChain(5),
    });

    const svc = new AchievementProgressService(readClient as never);
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });
    await svc.updateProgress(CHAR_ID, { type: "QUEST_APPROVED" });

    expect(write.charAchUpdate).toHaveBeenCalledTimes(1);
    expect(write.statsUpdate).toHaveBeenCalledTimes(1);
  });

  // 9.2 already-unlocked is no-op
  it("9.2 re-evaluation of already-unlocked achievement is a no-op", async () => {
    const write = makeWriteMocks();
    mockWriteClient.from.mockImplementation(write.from);

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
