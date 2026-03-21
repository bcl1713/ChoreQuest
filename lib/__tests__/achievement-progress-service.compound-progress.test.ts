import { AchievementProgressService } from "../achievement-progress-service";
import type { MockChain } from "./achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeReadClient,
  CHARACTER_ID,
  USER_ID,
} from "./achievement-progress-service.fixtures";

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("AchievementProgressService - compound progress shape", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 3.2 Compound progress JSONB shape — mixed results
  it("upserts compound JSONB shape with per-condition results and top-level met", async () => {
    // Sub-evaluators: quest_complete returns 7, level_reached returns 2
    // Uses backfill path (no existing records) so "compound" is included via ALL_CRITERIA_TYPES
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 7, error: null }),
        }),
      }),
    };
    const charChain = makeDataResult({
      user_id: USER_ID,
      xp: 0,
      level: 2,
      honor_points: 0,
    });
    const achievementsChain = makeDataResult([
      {
        id: "ach-compound",
        criteria_type: "compound",
        criteria_config: {
          evaluation_strategy: "compound",
          operator: "AND",
          conditions: [
            { criteria_type: "quest_complete", threshold: 5 },
            { criteria_type: "level_reached", threshold: 3 },
          ],
        },
        xp_reward: 100,
        gold_reward: 50,
      },
    ]);
    // Return [] to trigger full backfill (ALL_CRITERIA_TYPES including "compound")
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain,
    });
    // write client: upsert only (unlock eval will fail silently in try/catch)
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall).toHaveLength(1);
    const progress = upsertCall[0].progress;

    // Should be compound shape, not { current, threshold }
    expect(progress).toHaveProperty("conditions");
    expect(progress).toHaveProperty("met");
    expect(Array.isArray(progress.conditions)).toBe(true);
    expect(progress.conditions).toHaveLength(2);

    // quest_complete: current 7 >= threshold 5 → met: true
    const questCondition = progress.conditions.find(
      (c: { criteria_type: string }) => c.criteria_type === "quest_complete",
    );
    expect(questCondition?.current).toBe(7);
    expect(questCondition?.threshold).toBe(5);
    expect(questCondition?.met).toBe(true);

    // level_reached: current 2 < threshold 3 → met: false
    const levelCondition = progress.conditions.find(
      (c: { criteria_type: string }) => c.criteria_type === "level_reached",
    );
    expect(levelCondition?.met).toBe(false);

    // AND with one unmet → top-level met: false
    expect(progress.met).toBe(false);
  });

  // 3.2 All conditions met → met: true
  it("upserts compound JSONB with met: true when all AND conditions are met", async () => {
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 7, error: null }),
        }),
      }),
    };
    const charChain = makeDataResult({
      user_id: USER_ID,
      xp: 0,
      level: 4,
      honor_points: 0,
    });
    const achievementsChain = makeDataResult([
      {
        id: "ach-compound",
        criteria_type: "compound",
        criteria_config: {
          evaluation_strategy: "compound",
          operator: "AND",
          conditions: [
            { criteria_type: "quest_complete", threshold: 5 },
            { criteria_type: "level_reached", threshold: 3 },
          ],
        },
        xp_reward: 100,
        gold_reward: 50,
      },
    ]);
    // Return [] to trigger full backfill
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
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
    const progress = upsertCall[0].progress;

    expect(progress.met).toBe(true);
    expect(progress.conditions.every((c: { met: boolean }) => c.met)).toBe(
      true,
    );
  });

  // 4.3 Reward fields are present in fetched achievement data
  it("includes xp_reward and gold_reward fields in the achievements SELECT query", async () => {
    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      }),
    };
    const charChain = makeDataResult({ user_id: USER_ID });
    const achievementSelectSpy = jest.fn().mockReturnValue({
      is: jest.fn().mockResolvedValue({
        data: [
          {
            id: "ach-001",
            name: "Quest Master",
            criteria_type: "quest_complete",
            criteria_config: { threshold: 5 },
            xp_reward: 100,
            gold_reward: 50,
          },
        ],
        error: null,
      }),
    });
    const achievementsChain = { select: achievementSelectSpy };
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "ach-001" }],
          error: null,
        }),
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

    // Verify the SELECT string includes reward fields
    expect(achievementSelectSpy).toHaveBeenCalledWith(
      expect.stringContaining("xp_reward"),
    );
    expect(achievementSelectSpy).toHaveBeenCalledWith(
      expect.stringContaining("gold_reward"),
    );
    expect(achievementSelectSpy).toHaveBeenCalledWith(
      expect.stringContaining("name"),
    );
  });
});
