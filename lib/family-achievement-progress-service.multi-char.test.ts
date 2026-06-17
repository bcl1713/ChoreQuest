import { FamilyAchievementProgressService } from "./family-achievement-progress-service";
import type { MockChain } from "./family-achievement-progress-service.fixtures";
import {
  makeDataResult,
  makeUpsertResult,
  makeUpdateResult,
  makeReadClient,
  FAMILY_ID,
  FAMILY_ACHIEVEMENT_ID,
} from "./family-achievement-progress-service.fixtures";

const mockWriteClient = { from: jest.fn() };

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

// Family layout used by most tests:
//   user-001 → char-001, char-002  (two characters)
//   user-002 → char-003             (one character)
function makeTwoMemberProfiles() {
  return makeDataResult([
    { id: "user-001", characters: [{ id: "char-001" }, { id: "char-002" }] },
    { id: "user-002", characters: [{ id: "char-003" }] },
  ]);
}

function makeAchievementChain(
  criteriaType: string,
  threshold: number,
  mode: "sum" | "all",
) {
  return makeDataResult([
    {
      id: FAMILY_ACHIEVEMENT_ID,
      name: "Multi-char test",
      criteria_type: criteriaType,
      criteria_config: { threshold, family_evaluation_mode: mode },
      xp_reward: 0,
      gold_reward: 0,
    },
  ]);
}

function makeUnlockCheckChain(alreadyUnlocked = false): MockChain {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: alreadyUnlocked
            ? [
                {
                  family_achievement_id: FAMILY_ACHIEVEMENT_ID,
                  unlocked_at: new Date().toISOString(),
                },
              ]
            : [],
          error: null,
        }),
      }),
    }),
  };
}

function buildReadClient(
  tableOverrides: Record<string, MockChain>,
  unlockCheck: MockChain,
) {
  const famProgressChain = makeDataResult([
    { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
  ]);

  const base = makeReadClient({
    family_achievement_progress: famProgressChain as unknown as MockChain,
    ...tableOverrides,
  });

  let progressCallCount = 0;
  const originalFrom = base.from;
  base.from = jest.fn((table: string) => {
    if (table === "family_achievement_progress") {
      progressCallCount++;
      if (progressCallCount <= 1) return (originalFrom as jest.Mock)(table);
      return unlockCheck;
    }
    return (originalFrom as jest.Mock)(table);
  }) as jest.Mock;

  return base;
}

function setupWriteClient() {
  const writeUpsert = makeUpsertResult();
  const writeUpdate = makeUpdateResult();
  let callCount = 0;
  mockWriteClient.from.mockImplementation(() => {
    callCount++;
    return callCount === 1 ? writeUpsert : writeUpdate;
  });
  return writeUpsert;
}

describe("FamilyAchievementProgressService — multi-character member handling", () => {
  afterEach(() => jest.clearAllMocks());

  describe("sum mode", () => {
    it("counts quest_complete once per user, not per character", async () => {
      // user-001 (both chars combined via IN filter): 8 quests
      // user-002: 3 quests → total should be 11, not 8+3+3 (old lockstep bug)
      const questChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest
              .fn()
              .mockResolvedValueOnce({ count: 8, error: null })
              .mockResolvedValueOnce({ count: 3, error: null }),
          }),
        }),
      };

      const readClient = buildReadClient(
        {
          user_profiles: makeTwoMemberProfiles() as unknown as MockChain,
          family_achievements: makeAchievementChain(
            "quest_complete",
            20,
            "sum",
          ) as unknown as MockChain,
          quest_instances: questChain,
        },
        makeUnlockCheckChain(),
      );

      const writeUpsert = setupWriteClient();
      const service = new FamilyAchievementProgressService(readClient as never);
      await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(11);
    });

    it("sums xp_earned across all characters in sum mode", async () => {
      // user-001 has char-001 (100 xp) + char-002 (200 xp) → 300
      // user-002 has char-003 (150 xp) → 150
      // total sum: 450
      const charChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: { xp: 100 }, error: null })
              .mockResolvedValueOnce({ data: { xp: 200 }, error: null })
              .mockResolvedValueOnce({ data: { xp: 150 }, error: null }),
          }),
        }),
      };

      const readClient = buildReadClient(
        {
          user_profiles: makeTwoMemberProfiles() as unknown as MockChain,
          family_achievements: makeAchievementChain(
            "xp_earned",
            1000,
            "sum",
          ) as unknown as MockChain,
          characters: charChain,
        },
        makeUnlockCheckChain(),
      );

      const writeUpsert = setupWriteClient();
      const service = new FamilyAchievementProgressService(readClient as never);
      await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(450);
    });
  });

  describe("all mode", () => {
    it("level_reached qualifies a user if their best character meets the threshold", async () => {
      // user-001: char-001 level 5, char-002 level 15 → best is 15 → qualifies at threshold 10
      // user-002: char-003 level 12 → qualifies at threshold 10
      // all-mode result: min(max(5,15), max(12)) = min(15, 12) = 12
      const charChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: { level: 5 }, error: null })
              .mockResolvedValueOnce({ data: { level: 15 }, error: null })
              .mockResolvedValueOnce({ data: { level: 12 }, error: null }),
          }),
        }),
      };

      const readClient = buildReadClient(
        {
          user_profiles: makeTwoMemberProfiles() as unknown as MockChain,
          family_achievements: makeAchievementChain(
            "level_reached",
            10,
            "all",
          ) as unknown as MockChain,
          characters: charChain,
        },
        makeUnlockCheckChain(),
      );

      const writeUpsert = setupWriteClient();
      const service = new FamilyAchievementProgressService(readClient as never);
      await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      // Both users qualify; all-mode returns min of per-user bests = 12
      expect(upsertCall[0].progress.current).toBe(12);
    });

    it("level_reached fails when no character of a user meets the threshold", async () => {
      // user-001: char-001 level 3, char-002 level 7 → best is 7, below threshold 10
      // user-002: char-003 level 12 → qualifies
      // all-mode result: min(7, 12) = 7 < 10 → not unlocked
      const charChain: MockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: { level: 3 }, error: null })
              .mockResolvedValueOnce({ data: { level: 7 }, error: null })
              .mockResolvedValueOnce({ data: { level: 12 }, error: null }),
          }),
        }),
      };

      const readClient = buildReadClient(
        {
          user_profiles: makeTwoMemberProfiles() as unknown as MockChain,
          family_achievements: makeAchievementChain(
            "level_reached",
            10,
            "all",
          ) as unknown as MockChain,
          characters: charChain,
        },
        makeUnlockCheckChain(),
      );

      const writeUpsert = setupWriteClient();
      const service = new FamilyAchievementProgressService(readClient as never);
      await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

      const upsertCall = writeUpsert.upsert.mock.calls[0][0];
      expect(upsertCall[0].progress.current).toBe(7);
    });
  });
});
