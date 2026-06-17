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

  // 3.1 + 3.2 quest_complete
  describe("quest_complete evaluator", () => {
    it("returns count of approved quests (assigned + volunteered)", async () => {
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({ count: 7, error: null }),
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
          eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      const readClient = makeReadClient({
        characters: charChain as unknown as MockChain,
        achievements: achievementsChain as unknown as MockChain,
        character_achievements: charAchChain,
        quest_instances: questChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress).toEqual({ current: 7, threshold: 10 });
    });

    it("returns 0 when character has no approved quests", async () => {
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "quest_complete",
          criteria_config: { threshold: 1 },
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
        quest_instances: questChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(0);
    });
  });

  // 3.3 + 3.4 quest_volunteer
  describe("quest_volunteer evaluator", () => {
    it("returns count of approved quests where character volunteered", async () => {
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "quest_volunteer",
          criteria_config: { threshold: 1 },
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
        quest_instances: questChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(3);
    });

    it("counts approved volunteered quests even when volunteer_bonus is null", async () => {
      const approvedStatusSpy = jest
        .fn()
        .mockResolvedValue({ count: 1, error: null });
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: approvedStatusSpy,
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "quest_volunteer",
          criteria_config: { threshold: 1 },
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
        quest_instances: questChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      expect(approvedStatusSpy).toHaveBeenCalledWith("status", "APPROVED");
    });

    it("returns 0 when character has no volunteer completions", async () => {
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "quest_volunteer",
          criteria_config: { threshold: 1 },
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
        quest_instances: questChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(0);
    });
  });
});
