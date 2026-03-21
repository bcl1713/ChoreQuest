import { AchievementProgressService } from "../achievement-progress-service";
import type { MockChain } from "./achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeReadClient,
  CHARACTER_ID,
  USER_ID,
  ACHIEVEMENT_ID,
} from "./achievement-progress-service.fixtures";

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

jest.mock("@/lib/achievement-progress/unlock-engine", () => ({
  ...jest.requireActual("@/lib/achievement-progress/unlock-engine"),
  runUnlockEvaluation: jest.fn().mockResolvedValue(undefined),
}));

describe("AchievementProgressService - service level", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 8.1 correct evaluators called per event type
  it("calls only event-mapped evaluators for QUEST_APPROVED when rows exist", async () => {
    const countSpy = jest.fn().mockResolvedValue({ count: 2, error: null });
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: countSpy,
          eq: jest.fn().mockReturnValue({ or: countSpy }),
        }),
      }),
    };
    const charChain = makeDataResult({ user_id: USER_ID });
    // Return only quest_complete achievement
    const achievementsChain = makeDataResult([
      {
        id: "ach-qc",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 10 },
      },
    ]);
    // rows exist → scoped path
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "ach-qc" }],
          error: null,
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const from = jest.fn((table: string) => {
      if (table === "characters") return charChain as unknown as MockChain;
      if (table === "achievements")
        return achievementsChain as unknown as MockChain;
      if (table === "character_achievements") return charAchChain;
      if (table === "quest_instances")
        return questChain as unknown as MockChain;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService({ from } as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    expect(writeUpsert.upsert).toHaveBeenCalledTimes(1);
    const rows = writeUpsert.upsert.mock.calls[0][0];
    const criteriaTypes = rows.map(
      (r: { achievement_id: string }) => r.achievement_id,
    );
    expect(criteriaTypes).toContain("ach-qc");
  });

  // 8.3 scoped path
  it("runs only event-scoped evaluators when rows already exist", async () => {
    const charChain = makeDataResult({ user_id: USER_ID });
    // Only reward_redeemed achievement
    const achievementsChain = makeDataResult([
      {
        id: "a-rr",
        criteria_type: "reward_redeemed",
        criteria_config: { threshold: 1 },
      },
    ]);
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "a-rr" }],
          error: null,
        }),
      }),
    };
    const redemptionChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      reward_redemptions: redemptionChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "REWARD_APPROVED" });

    const rows = writeUpsert.upsert.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].achievement_id).toBe("a-rr");
  });

  it("excludes honor_earned from BOSS_COMPLETED scoped evaluation", async () => {
    const charChain = makeDataResult({ user_id: USER_ID });
    const achievementsChain = makeDataResult([
      {
        id: "a-boss",
        criteria_type: "boss_participated",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a-honor",
        criteria_type: "honor_earned",
        criteria_config: { threshold: 10 },
      },
    ]);
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "a-boss" }, { achievement_id: "a-honor" }],
          error: null,
        }),
      }),
    };
    const bossParticipantsChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      boss_battle_participants: bossParticipantsChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "BOSS_COMPLETED" });

    const rows = writeUpsert.upsert.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].achievement_id).toBe("a-boss");
  });

  // 8.4 progress JSONB shape
  it("writes progress JSONB with { current, threshold } shape", async () => {
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
    };
    const charChain = makeDataResult({ user_id: USER_ID });
    const achievementsChain = makeDataResult([
      {
        id: ACHIEVEMENT_ID,
        criteria_type: "quest_complete",
        criteria_config: { threshold: 10 },
      },
    ]);
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: ACHIEVEMENT_ID }],
          error: null,
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    const rows = writeUpsert.upsert.mock.calls[0][0];
    expect(rows[0].progress).toEqual({ current: 3, threshold: 10 });
  });
});
