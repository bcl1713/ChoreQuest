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

jest.mock("@/lib/achievement-progress/unlock-engine", () => ({
  ...jest.requireActual("@/lib/achievement-progress/unlock-engine"),
  runUnlockEvaluation: jest.fn().mockResolvedValue(undefined),
}));

describe("AchievementProgressService - service level", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 8.10 atomic backfill: upsert failure leaves zero rows
  it("throws when batch upsert fails during backfill (atomic semantics)", async () => {
    const singleResult = jest.fn().mockResolvedValue({
      data: { user_id: USER_ID, xp: 0, level: 1, honor_points: 0 },
      error: null,
    });

    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: singleResult }),
      }),
    };
    const achievementsChain = makeDataResult([
      {
        id: ACHIEVEMENT_ID,
        criteria_type: "quest_complete",
        criteria_config: { threshold: 1 },
      },
    ]);
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      }),
    };
    const failedUpsert = {
      upsert: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
    };

    const from = jest.fn((table: string) => {
      if (table === "characters") return charChain;
      if (table === "achievements")
        return achievementsChain as unknown as MockChain;
      if (table === "character_achievements") return charAchChain;
      if (table === "quest_instances")
        return questChain as unknown as MockChain;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockWriteClient.from.mockReturnValue(failedUpsert);

    const service = new AchievementProgressService({ from } as never);
    await expect(
      service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" }),
    ).rejects.toThrow("Failed to upsert progress");
  });

  // 8.11 unlocked_at preservation
  it("does not include unlocked_at in upsert rows (preserves existing value)", async () => {
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 1, error: null }),
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
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: ACHIEVEMENT_ID }],
          error: null,
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    const rows = writeUpsert.upsert.mock.calls[0][0];
    // Rows should NOT include unlocked_at
    expect(rows[0]).not.toHaveProperty("unlocked_at");
  });

  // 8.12 split client model
  it("uses injected read client for queries but service-role client for upserts", async () => {
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 2, error: null }),
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
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: ACHIEVEMENT_ID }],
          error: null,
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const injectedReadClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(injectedReadClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    // Read queries went through injected client
    expect(injectedReadClient.from).toHaveBeenCalledWith("characters");
    expect(injectedReadClient.from).toHaveBeenCalledWith("achievements");

    // Writes went through the service-role write client
    expect(mockWriteClient.from).toHaveBeenCalledWith("character_achievements");
    expect(writeUpsert.upsert).toHaveBeenCalled();
  });
});
