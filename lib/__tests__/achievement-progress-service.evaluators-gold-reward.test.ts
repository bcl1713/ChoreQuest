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

describe("AchievementProgressService evaluators", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 5.1 + 5.2 gold_earned
  describe("gold_earned evaluator", () => {
    it("sums approved quest gold and boss gold from approved and partial participations", async () => {
      const questChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({
              data: [
                { gold_reward: 100, volunteer_bonus: null },
                { gold_reward: 100, volunteer_bonus: null },
              ],
              error: null,
            }),
          }),
        }),
      };
      const bossChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ awarded_gold: 100 }],
              error: null,
            }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "gold_earned",
          criteria_config: { threshold: 1000 },
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
        quest_instances: questChain as unknown as MockChain,
        boss_battle_participants: bossChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "BOSS_COMPLETED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(300);
    });

    it("includes volunteer_bonus in quest gold total", async () => {
      const questChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({
              data: [
                { gold_reward: 100, volunteer_bonus: 0.2, streak_bonus: null },
              ],
              error: null,
            }),
          }),
        }),
      };
      const bossChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "gold_earned",
          criteria_config: { threshold: 1000 },
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
        quest_instances: questChain as unknown as MockChain,
        boss_battle_participants: bossChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(120);
    });

    it("includes PARTIAL boss gold in total", async () => {
      const questChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
      const inSpy = jest.fn().mockResolvedValue({
        data: [{ awarded_gold: 75 }],
        error: null,
      });
      const bossChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ in: inSpy }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "gold_earned",
          criteria_config: { threshold: 1000 },
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
        quest_instances: questChain as unknown as MockChain,
        boss_battle_participants: bossChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "BOSS_COMPLETED" });

      expect(inSpy).toHaveBeenCalledWith("participation_status", [
        "APPROVED",
        "PARTIAL",
      ]);
      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(75);
    });

    it("returns 0 when no quests or boss participations exist", async () => {
      const questChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
      const bossChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "gold_earned",
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
        quest_instances: questChain as unknown as MockChain,
        boss_battle_participants: bossChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "BOSS_COMPLETED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(0);
    });
  });
});
