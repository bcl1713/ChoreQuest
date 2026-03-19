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
    it("sums quest gold and boss gold from approved sources", async () => {
      const questChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({
              data: [{ gold_reward: 100 }, { gold_reward: 100 }],
              error: null,
            }),
          }),
        }),
      };
      const bossChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
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
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
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

  // 5.3 + 5.4 gold_spent
  describe("gold_spent evaluator", () => {
    it("sums cost of APPROVED and FULFILLED redemptions only", async () => {
      const redemptionChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ cost: 100 }, { cost: 50 }],
              error: null,
            }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "gold_spent",
          criteria_config: { threshold: 100 },
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
        reward_redemptions: redemptionChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "REWARD_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(150);
    });

    it("excludes PENDING redemptions", async () => {
      const redemptionChain = {
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
          criteria_type: "gold_spent",
          criteria_config: { threshold: 100 },
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
        reward_redemptions: redemptionChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "REWARD_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(0);
    });
  });

  // 5.5 + 5.6 reward_redeemed
  describe("reward_redeemed evaluator", () => {
    it("counts APPROVED and FULFILLED redemptions", async () => {
      const redemptionChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ count: 4, error: null }),
          }),
        }),
      };
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "reward_redeemed",
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
        reward_redemptions: redemptionChain as unknown as MockChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "REWARD_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(4);
    });
  });
});
