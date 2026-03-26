import { FamilyAchievementProgressService } from "../family-achievement-progress-service";
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

// Sets up a family where user-001 has a character and user-002 does not.
// membersWithCharCount (1) < totalMemberCount (2) — the character guard must
// NOT zero progress for user-based criteria like reward_redeemed / gold_spent.
function setupCharlessMemberTest(
  criteriaType: string,
  threshold: number,
  tableOverrides: Record<string, MockChain>,
) {
  const profilesChain = makeDataResult([
    { id: "user-001", characters: [{ id: "char-001" }] },
    { id: "user-002", characters: [] },
  ]);

  const famAchChain = makeDataResult([
    {
      id: FAMILY_ACHIEVEMENT_ID,
      name: "Charless Member Test",
      criteria_type: criteriaType,
      criteria_config: { threshold, family_evaluation_mode: "all" },
      xp_reward: 0,
      gold_reward: 0,
    },
  ]);

  const famProgressChain = makeDataResult([
    { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
  ]);

  const unlockCheckChain: MockChain = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  };

  const readClient = makeReadClient({
    user_profiles: profilesChain as unknown as MockChain,
    family_achievements: famAchChain as unknown as MockChain,
    family_achievement_progress: famProgressChain as unknown as MockChain,
    ...tableOverrides,
  });

  let readProgressCallCount = 0;
  const originalFrom = readClient.from;
  readClient.from = jest.fn((table: string) => {
    if (table === "family_achievement_progress") {
      readProgressCallCount++;
      if (readProgressCallCount <= 1) return (originalFrom as jest.Mock)(table);
      return unlockCheckChain;
    }
    return (originalFrom as jest.Mock)(table);
  }) as jest.Mock;

  const writeUpsert = makeUpsertResult();
  const writeUpdate = makeUpdateResult();
  let writeCallCount = 0;
  mockWriteClient.from.mockImplementation(() => {
    writeCallCount++;
    return writeCallCount === 1 ? writeUpsert : writeUpdate;
  });

  return { readClient, writeUpsert };
}

describe("FamilyAchievementProgressService — user-based criteria, all-mode, characterless member", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("[P2] reward_redeemed: characterless member does not zero all-mode progress", async () => {
    // user-002 has no character but has redeemed rewards.
    // current must be min(3, 2) = 2, NOT 0.
    const rewardChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest
          .fn()
          .mockReturnValueOnce({
            in: jest.fn().mockResolvedValue({ count: 3, error: null }),
          })
          .mockReturnValueOnce({
            in: jest.fn().mockResolvedValue({ count: 2, error: null }),
          }),
      }),
    };

    const { readClient, writeUpsert } = setupCharlessMemberTest(
      "reward_redeemed",
      2,
      { reward_redemptions: rewardChain },
    );

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "REWARD_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 2, threshold: 2 }),
    );
  });

  it("[P2] gold_spent: characterless member does not zero all-mode progress", async () => {
    // user-002 has no character but has spent gold.
    // user-001 spent 150, user-002 spent 75 → min = 75, NOT 0.
    const goldChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest
          .fn()
          .mockReturnValueOnce({
            in: jest.fn().mockResolvedValue({
              data: [{ cost: 100 }, { cost: 50 }],
              error: null,
            }),
          })
          .mockReturnValueOnce({
            in: jest
              .fn()
              .mockResolvedValue({ data: [{ cost: 75 }], error: null }),
          }),
      }),
    };

    const { readClient, writeUpsert } = setupCharlessMemberTest(
      "gold_spent",
      50,
      { reward_redemptions: goldChain },
    );

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "REWARD_APPROVED" });

    const upsertCall = writeUpsert.upsert.mock.calls[0][0];
    expect(upsertCall[0].progress).toEqual(
      expect.objectContaining({ current: 75, threshold: 50 }),
    );
  });
});
