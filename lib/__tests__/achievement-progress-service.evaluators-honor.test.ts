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

  // 7.1 + 7.2 class_change
  describe("class_change evaluator", () => {
    it("always returns 0 (backfill-only, no history table)", async () => {
      const charChain = makeDataResult({ user_id: USER_ID });
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "class_change",
          criteria_config: { threshold: 1 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      const readClient = makeReadClient({
        characters: charChain as unknown as MockChain,
        achievements: achievementsChain as unknown as MockChain,
        character_achievements: charAchChain,
      });
      mockWriteClient.from.mockReturnValue(writeUpsert);

      // Full backfill path (no existing rows), only class_change achievement
      const service = new AchievementProgressService(readClient as never);
      await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      const classChangeRow = upsertCall.find(
        (r: { achievement_id: string }) => r.achievement_id === ACHIEVEMENT_ID,
      );
      expect(classChangeRow.progress.current).toBe(0);
    });
  });

  // 7.3 + 7.4 honor_earned
  describe("honor_earned evaluator", () => {
    it("reads honor_points from characters table", async () => {
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
                .mockResolvedValue({ data: { honor_points: 25 }, error: null }),
            }),
          }),
      };
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "honor_earned",
          criteria_config: { threshold: 1 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      };
      const writeUpsert = makeUpsertResult();

      // honor_earned is backfill-only, so it runs via full backfill (count=0)
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
      const honorRow = upsertCall.find(
        (r: { achievement_id: string }) => r.achievement_id === ACHIEVEMENT_ID,
      );
      expect(honorRow.progress.current).toBe(25);
    });

    it("returns 0 for null honor_points", async () => {
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
              single: jest.fn().mockResolvedValue({
                data: { honor_points: null },
                error: null,
              }),
            }),
          }),
      };
      const achievementsChain = makeDataResult([
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "honor_earned",
          criteria_config: { threshold: 1 },
        },
      ]);
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
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
      const honorRow = upsertCall.find(
        (r: { achievement_id: string }) => r.achievement_id === ACHIEVEMENT_ID,
      );
      expect(honorRow.progress.current).toBe(0);
    });
  });
});
