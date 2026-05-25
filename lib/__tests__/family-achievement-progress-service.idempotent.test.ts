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

const mockWriteClient = {
  from: jest.fn(),
};

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

describe("FamilyAchievementProgressService — idempotent progress", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("produces identical progress values when called twice with the same event", async () => {
    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Test",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 10, family_evaluation_mode: "sum" },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const famProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    const questChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 7, error: null }),
        }),
      }),
    };

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      family_achievement_progress: famProgressChain as unknown as MockChain,
      quest_instances: questChain,
    });

    const writeUpsert = makeUpsertResult();
    const writeUpdate = makeUpdateResult();
    // Alternate: odd calls = upsert, even calls = update (re-lock)
    let writeCallCount = 0;
    mockWriteClient.from.mockImplementation(() => {
      writeCallCount++;
      return writeCallCount % 2 === 1 ? writeUpsert : writeUpdate;
    });

    const service = new FamilyAchievementProgressService(readClient as never);

    // Call twice
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    // Both calls should produce the same progress
    const call1 = writeUpsert.upsert.mock.calls[0][0];
    const call2 = writeUpsert.upsert.mock.calls[1][0];
    expect(call1[0].progress).toEqual(call2[0].progress);
    expect(call1[0].progress).toEqual(
      expect.objectContaining({ current: 7, threshold: 10 }),
    );
  });

  it("skips achievements with unknown criteria types without failing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    const profilesChain = makeDataResult([
      { id: "user-001", characters: [{ id: "char-001" }] },
    ]);

    const famAchChain = makeDataResult([
      {
        id: FAMILY_ACHIEVEMENT_ID,
        name: "Unknown",
        criteria_type: "unknown_type",
        criteria_config: { threshold: 1 },
        xp_reward: 0,
        gold_reward: 0,
      },
    ]);

    const famProgressChain = makeDataResult([
      { family_achievement_id: FAMILY_ACHIEVEMENT_ID },
    ]);

    const readClient = makeReadClient({
      user_profiles: profilesChain as unknown as MockChain,
      family_achievements: famAchChain as unknown as MockChain,
      family_achievement_progress: famProgressChain as unknown as MockChain,
    });

    const writeUpsert = makeUpsertResult();
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, { type: "QUEST_APPROVED" });

    // Should warn about unknown criteria type
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown family criteria type"),
    );
    // Should not have called upsert (no relevant achievements)
    expect(writeUpsert.upsert).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("returns empty array for getProgress when no progress exists", async () => {
    const emptyProgressChain: MockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const readClient = makeReadClient({
      family_achievement_progress: emptyProgressChain,
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    const result = await service.getProgress(FAMILY_ID);

    expect(result).toEqual([]);
  });
});
