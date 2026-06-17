import { AchievementProgressService } from "../achievement-progress-service";
import type { MockChain } from "../achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeReadClient,
  CHARACTER_ID,
  USER_ID,
  ACHIEVEMENT_ID,
} from "../achievement-progress-service.fixtures";

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

describe("AchievementProgressService evaluators", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 6.1 + 6.2 xp_earned
  describe("xp_earned evaluator", () => {
    it("reads xp from characters table", async () => {
      const charChain = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: { user_id: USER_ID }, error: null }),
            }),
          })
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: { xp: 1500 }, error: null }),
            }),
          }),
      };
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "xp_earned",
          criteria_config: { threshold: 1000 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      // Use a custom from that handles multiple calls to 'characters'
      const from = jest.fn((table: string) => {
        if (table === "characters") return charChain;
        if (table === "achievements")
          return achievementsChain as unknown as MockChain;
        if (table === "character_achievements") return charAchChain;
        throw new Error(`Unexpected table: ${table}`);
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService({ from } as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(1500);
    });
  });

  // 6.3 + 6.4 level_reached
  describe("level_reached evaluator", () => {
    it("reads level from characters table", async () => {
      const charChain = {
        select: jest
          .fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: { user_id: USER_ID }, error: null }),
            }),
          })
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: { level: 10 }, error: null }),
            }),
          }),
      };
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "level_reached",
          criteria_config: { threshold: 10 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      const from = jest.fn((table: string) => {
        if (table === "characters") return charChain;
        if (table === "achievements")
          return achievementsChain as unknown as MockChain;
        if (table === "character_achievements") return charAchChain;
        throw new Error(`Unexpected table: ${table}`);
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService({ from } as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(10);
    });
  });

  // 6.5 + 6.6 streak_reached
  describe("streak_reached evaluator", () => {
    it("returns max longest_streak across all streak records", async () => {
      const streakChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { longest_streak: 7 },
              { longest_streak: 14 },
              { longest_streak: 3 },
            ],
            error: null,
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "streak_reached",
          criteria_config: { threshold: 7 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      const readClient = makeReadClient({
        characters: charChain as unknown as MockChain,
        achievements: achievementsChain as unknown as MockChain,
        character_achievements: charAchChain,
        character_quest_streaks: streakChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(14);
    });

    it("returns 0 when character has no streak records", async () => {
      const streakChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "streak_reached",
          criteria_config: { threshold: 3 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      const readClient = makeReadClient({
        characters: charChain as unknown as MockChain,
        achievements: achievementsChain as unknown as MockChain,
        character_achievements: charAchChain,
        character_quest_streaks: streakChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(0);
    });
  });
});
