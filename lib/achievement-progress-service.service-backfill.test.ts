import { AchievementProgressService } from "./achievement-progress-service";
import {
  makeUpsertResult,
  CHARACTER_ID,
  USER_ID,
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

  // 8.2 backfill path: all 13 evaluators run
  it("runs full backfill when no character_achievements rows exist", async () => {
    // Minimal mocks that handle all 13 criteria types
    const countResult = jest.fn().mockResolvedValue({ count: 0, error: null });
    const singleResult = jest.fn().mockResolvedValue({
      data: { user_id: USER_ID, xp: 0, level: 1, honor_points: 0 },
      error: null,
    });

    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: singleResult,
          head: countResult,
          eq: jest.fn().mockReturnValue({ head: countResult }),
        }),
      }),
    };
    const allAchievementsData = [
      {
        id: "a1",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a2",
        criteria_type: "quest_volunteer",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a3",
        criteria_type: "quest_difficulty",
        criteria_config: { difficulty: "HARD", threshold: 5 },
      },
      {
        id: "a4",
        criteria_type: "boss_defeated",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a5",
        criteria_type: "boss_participated",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a6",
        criteria_type: "gold_earned",
        criteria_config: { threshold: 100 },
      },
      {
        id: "a7",
        criteria_type: "gold_spent",
        criteria_config: { threshold: 100 },
      },
      {
        id: "a8",
        criteria_type: "reward_redeemed",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a9",
        criteria_type: "xp_earned",
        criteria_config: { threshold: 1000 },
      },
      {
        id: "a10",
        criteria_type: "level_reached",
        criteria_config: { threshold: 2 },
      },
      {
        id: "a11",
        criteria_type: "streak_reached",
        criteria_config: { threshold: 3 },
      },
      {
        id: "a12",
        criteria_type: "class_change",
        criteria_config: { threshold: 1 },
      },
      {
        id: "a13",
        criteria_type: "honor_earned",
        criteria_config: { threshold: 1 },
      },
    ];
    const achievementsResult = { data: allAchievementsData, error: null };
    const achievementsChain = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue(achievementsResult),
        is: jest.fn().mockResolvedValue(achievementsResult),
      }),
    };
    // No existing rows → backfill
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const from = jest.fn((table: string) => {
      if (table === "characters") return charChain;
      if (table === "achievements") return achievementsChain;
      if (table === "character_achievements") return charAchChain;
      // All other tables
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            head: countResult,
            single: singleResult,
            eq: jest.fn().mockReturnValue({
              head: countResult,
              or: countResult,
              not: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
            or: jest.fn().mockResolvedValue({ data: [], error: null }),
            in: jest
              .fn()
              .mockResolvedValue({ data: [], count: 0, error: null }),
          }),
          in: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        }),
      };
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService({ from } as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    // All 13 achievements should be in the upsert
    expect(upsertCall).toHaveLength(13);
    const ids = upsertCall.map(
      (r: { achievement_id: string }) => r.achievement_id,
    );
    expect(ids).toContain("a12"); // class_change
    expect(ids).toContain("a13"); // honor_earned
  });
});
