import { AchievementProgressService } from "./achievement-progress-service";
import { FamilyAchievementProgressService } from "./family-achievement-progress-service";

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

// Spy on FamilyAchievementProgressService.prototype.updateProgress
const familyUpdateProgressSpy = jest
  .spyOn(FamilyAchievementProgressService.prototype, "updateProgress")
  .mockResolvedValue(undefined);

const noActiveSeasonFamilyChain = {
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({
        data: { active_season_id: null },
        error: null,
      }),
    }),
  }),
};

const noActiveSeasonChain = {
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  }),
};

describe("Integration: Individual → Family progress trigger", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("triggers family progress after individual progress completes", async () => {
    const FAMILY_ID = "family-integration-001";
    const CHARACTER_ID = "char-integration-001";
    const USER_ID = "user-integration-001";

    // Mock character context resolution (with family)
    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: USER_ID,
              user_profiles: { family_id: FAMILY_ID },
            },
            error: null,
          }),
        }),
      }),
    };

    // Mock achievements: one quest_complete achievement
    const achievementsData = [
      {
        id: "ach-001",
        name: "First Quest",
        criteria_type: "quest_complete",
        criteria_config: { threshold: 1 },
        xp_reward: 50,
        gold_reward: 10,
      },
    ];
    const achievementsChain = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({
          data: achievementsData,
          error: null,
        }),
        is: jest.fn().mockResolvedValue({
          data: achievementsData,
          error: null,
        }),
      }),
    };

    // Mock existing character achievements check
    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "ach-001" }],
          error: null,
        }),
      }),
    };

    // Mock quest count evaluator
    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
    };

    const readFrom = jest.fn((table: string) => {
      const mocks: Record<string, unknown> = {
        characters: charChain,
        achievements: achievementsChain,
        character_achievements: charAchChain,
        quest_instances: questChain,
        families: noActiveSeasonFamilyChain,
        seasons: noActiveSeasonChain,
      };
      if (mocks[table]) return mocks[table];
      throw new Error(`Unexpected read table: ${table}`);
    });
    const readClient = { from: readFrom };

    // Mock write client upsert
    mockWriteClient.from.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    // Verify family progress was triggered with the correct familyId and event
    expect(familyUpdateProgressSpy).toHaveBeenCalledWith(FAMILY_ID, {
      type: "QUEST_APPROVED",
    });
  });

  it("does NOT trigger family progress when character has no family", async () => {
    const CHARACTER_ID = "char-no-family-001";
    const USER_ID = "user-no-family-001";

    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: USER_ID,
              user_profiles: { family_id: null },
            },
            error: null,
          }),
        }),
      }),
    };

    const achievementsChain = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
        is: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const readFrom = jest.fn((table: string) => {
      const mocks: Record<string, unknown> = {
        characters: charChain,
        achievements: achievementsChain,
        character_achievements: charAchChain,
      };
      if (mocks[table]) return mocks[table];
      throw new Error(`Unexpected read table: ${table}`);
    });
    const readClient = { from: readFrom };

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    // Family progress should NOT be triggered
    expect(familyUpdateProgressSpy).not.toHaveBeenCalled();
  });

  it("individual progress succeeds even when family progress throws", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    familyUpdateProgressSpy.mockRejectedValueOnce(
      new Error("Family progress failed"),
    );

    const CHARACTER_ID = "char-err-001";
    const USER_ID = "user-err-001";
    const FAMILY_ID = "family-err-001";

    const charChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: USER_ID,
              user_profiles: { family_id: FAMILY_ID },
            },
            error: null,
          }),
        }),
      }),
    };

    const achievementsChain = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({
          data: [
            {
              id: "ach-002",
              name: "Test",
              criteria_type: "quest_complete",
              criteria_config: { threshold: 1 },
              xp_reward: 0,
              gold_reward: 0,
            },
          ],
          error: null,
        }),
      }),
    };

    const charAchChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: "ach-002" }],
          error: null,
        }),
      }),
    };

    const questChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      }),
    };

    const readFrom = jest.fn((table: string) => {
      const mocks: Record<string, unknown> = {
        characters: charChain,
        achievements: achievementsChain,
        character_achievements: charAchChain,
        quest_instances: questChain,
        families: noActiveSeasonFamilyChain,
        seasons: noActiveSeasonChain,
      };
      if (mocks[table]) return mocks[table];
      throw new Error(`Unexpected read table: ${table}`);
    });
    const readClient = { from: readFrom };

    mockWriteClient.from.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });

    // Should NOT throw despite family error
    const service = new AchievementProgressService(readClient as never);
    await expect(
      service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" }),
    ).resolves.toBeUndefined();

    // Error should be logged
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Family achievement progress failed"),
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
