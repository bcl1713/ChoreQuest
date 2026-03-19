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

describe("AchievementProgressService - service level", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 8.5 upsert behavior
  it("upserts with onConflict character_id,achievement_id", async () => {
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

    expect(writeUpsert.upsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        onConflict: "character_id,achievement_id",
        ignoreDuplicates: false,
      }),
    );
  });

  // 8.6 idempotency
  it("produces identical progress on duplicate calls (idempotent)", async () => {
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 5, error: null }),
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

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
      achievements: achievementsChain as unknown as MockChain,
      character_achievements: charAchChain,
      quest_instances: questChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    const calls = writeUpsert.upsert.mock.calls;
    expect(calls[0][0][0].progress).toEqual(calls[1][0][0].progress);
  });

  // 8.7 invalid character ID
  it("throws error and upserts nothing when character does not exist", async () => {
    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: "Not found" } }),
        }),
      }),
    };
    const writeUpsert = makeUpsertResult();

    const readClient = makeReadClient({
      characters: charChain as unknown as MockChain,
    });
    mockWriteClient.from.mockReturnValue(writeUpsert);

    const service = new AchievementProgressService(readClient as never);
    await expect(
      service.updateProgress("invalid-char", { type: "QUEST_APPROVED" }),
    ).rejects.toThrow("Character not found");

    expect(writeUpsert.upsert).not.toHaveBeenCalled();
  });

  // 8.8 unknown criteria type
  it("logs warning and skips unknown criteria types without failing", async () => {
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

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
        id: "ach-known",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 1 },
      },
      {
        id: "ach-unknown",
        criteria_type: "unknown_type_xyz",
        criteria_config: { threshold: 1 },
      },
    ]);
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { achievement_id: "ach-known" },
            { achievement_id: "ach-unknown" },
          ],
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
    await expect(
      service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" }),
    ).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown criteria type: unknown_type_xyz"),
    );

    // Only known achievement was upserted
    const rows = writeUpsert.upsert.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].achievement_id).toBe("ach-known");

    warnSpy.mockRestore();
  });

  // 8.9 global achievements included when character has a family
  it("queries achievements with or-filter including global (family_id IS NULL) when character has a family", async () => {
    const FAMILY_ID = "family-test-001";
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    };
    // Character with a family_id via user_profiles join
    const charChain = makeDataResult({
      user_id: USER_ID,
      user_profiles: { family_id: FAMILY_ID },
    });
    const orSpy = jest.fn().mockResolvedValue({
      data: [
        {
          id: ACHIEVEMENT_ID,
          criteria_type: "quest_complete",
          criteria_config: { threshold: 1 },
        },
      ],
      error: null,
    });
    const achievementsChain = {
      select: jest.fn().mockReturnValue({ or: orSpy }),
    };
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

    expect(orSpy).toHaveBeenCalledWith(
      `family_id.eq.${FAMILY_ID},family_id.is.null`,
    );
  });

  // 8.10 getProgress
  describe("getProgress", () => {
    it("returns joined progress records for character with existing progress", async () => {
      const progressData = [
        {
          character_id: CHARACTER_ID,
          achievement_id: ACHIEVEMENT_ID,
          unlocked_at: null,
          progress: { current: 3, threshold: 10 },
          notified: false,
          achievements: {
            id: ACHIEVEMENT_ID,
            name: "First Quest",
            description: "Complete your first quest",
            criteria_type: "quest_complete",
            criteria_config: { threshold: 10 },
          },
        },
      ];

      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: progressData, error: null }),
        }),
      };

      const readClient = makeReadClient({
        character_achievements: charAchChain,
      });

      const service = new AchievementProgressService(readClient as never);
      const result = await service.getProgress(CHARACTER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].achievement.name).toBe("First Quest");
      expect(result[0].progress).toEqual({ current: 3, threshold: 10 });
    });

    it("returns empty array when character has no progress", async () => {
      const charAchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const readClient = makeReadClient({
        character_achievements: charAchChain,
      });

      const service = new AchievementProgressService(readClient as never);
      const result = await service.getProgress(CHARACTER_ID);

      expect(result).toEqual([]);
    });
  });
});
