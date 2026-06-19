jest.mock("./family-evaluators", () => ({
  FAMILY_EVALUATOR_REGISTRY: {
    quest_complete: jest.fn(),
  },
}));

import { recomputeAchievementImpl } from "./service-helpers";
import { FAMILY_EVALUATOR_REGISTRY } from "./family-evaluators";

const mockEvaluator = FAMILY_EVALUATOR_REGISTRY.quest_complete as jest.Mock;

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  // Default: chainable methods return `chain` itself
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  // Apply overrides AFTER defaults so they take precedence
  Object.assign(chain, overrides);
  return chain;
}

const achievementRow = {
  id: "ach-1",
  name: "Complete 5 quests",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 100,
  gold_reward: 20,
};

const familyContext = {
  userIds: ["u-1"],
  characterIds: ["c-1"],
  allUserIds: ["u-1"],
  totalMemberCount: 1,
  membersWithCharCount: 1,
};

describe("recomputeAchievementImpl", () => {
  let readClient: { from: jest.Mock };
  let writeClient: { from: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    readClient = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "family_achievements") {
          return makeChain({
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: achievementRow, error: null }),
          });
        }
        return makeChain();
      }),
    };

    writeClient = {
      from: jest.fn().mockImplementation(() => makeChain()),
    };

    mockEvaluator.mockResolvedValue({ current: 3 });
  });

  it("upserts progress and unlocks when current meets threshold", async () => {
    mockEvaluator.mockResolvedValue({ current: 5 });

    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest
      .fn()
      .mockReturnValue(
        makeChain({ is: jest.fn().mockReturnValue({ error: null }) }),
      );

    writeClient.from.mockImplementation((table: string) => {
      const chain = makeChain();
      if (table === "family_achievement_progress") {
        chain.upsert = upsertMock;
        chain.update = updateMock;
      }
      return chain;
    });

    await recomputeAchievementImpl(
      readClient as never,
      writeClient as never,
      "fam-1",
      "ach-1",
      familyContext,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: {
          current: 5,
          threshold: 5,
          member_count: 1,
          members_with_char_count: 1,
        },
      }),
      expect.any(Object),
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_at: expect.any(String) }),
    );
  });

  it("clears unlocked_at and deletes user notifications when re-locking", async () => {
    mockEvaluator.mockResolvedValue({ current: 2 }); // below threshold

    const progressId = "prog-uuid-123";
    const deleteMock = jest.fn().mockReturnValue(
      makeChain({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    );
    const updateChain = makeChain({
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: progressId }, error: null }),
    });
    const updateMock = jest.fn().mockReturnValue(updateChain);

    writeClient.from.mockImplementation((table: string) => {
      if (table === "family_achievement_progress") {
        return makeChain({
          upsert: jest.fn().mockResolvedValue({ error: null }),
          update: updateMock,
        });
      }
      if (table === "family_achievement_user_notifications") {
        return makeChain({ delete: deleteMock });
      }
      return makeChain();
    });

    await recomputeAchievementImpl(
      readClient as never,
      writeClient as never,
      "fam-1",
      "ach-1",
      familyContext,
    );

    expect(updateMock).toHaveBeenCalledWith({ unlocked_at: null });
    expect(deleteMock).toHaveBeenCalled();

    // Verify the delete targeted the correct progress row
    const deleteChain = deleteMock.mock.results[0].value;
    expect(deleteChain.eq).toHaveBeenCalledWith(
      "family_achievement_progress_id",
      progressId,
    );
  });

  it("writes members_with_char_count snapshot into progress", async () => {
    mockEvaluator.mockResolvedValue({ current: 3 });

    const upsertMock = jest.fn().mockResolvedValue({ error: null });

    writeClient.from.mockImplementation((table: string) => {
      const chain = makeChain();
      if (table === "family_achievement_progress") {
        chain.upsert = upsertMock;
      }
      return chain;
    });

    const contextWithChars = {
      ...familyContext,
      totalMemberCount: 4,
      membersWithCharCount: 3,
    };

    await recomputeAchievementImpl(
      readClient as never,
      writeClient as never,
      "fam-1",
      "ach-1",
      contextWithChars,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: expect.objectContaining({
          member_count: 4,
          members_with_char_count: 3,
        }),
      }),
      expect.any(Object),
    );
  });

  it("throws when family_evaluation_mode is an invalid value", async () => {
    const badAchievement = {
      ...achievementRow,
      criteria_config: { threshold: 5, family_evaluation_mode: "ALL" },
    };

    readClient = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "family_achievements") {
          return makeChain({
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: badAchievement, error: null }),
          });
        }
        return makeChain();
      }),
    };

    await expect(
      recomputeAchievementImpl(
        readClient as never,
        writeClient as never,
        "fam-1",
        "ach-1",
        familyContext,
      ),
    ).rejects.toThrow(/Invalid family_evaluation_mode "ALL"/);
  });

  it("skips notification deletion when progress row id is absent", async () => {
    mockEvaluator.mockResolvedValue({ current: 0 });

    const deleteMock = jest.fn();
    const updateChain = makeChain({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    writeClient.from.mockImplementation((table: string) => {
      if (table === "family_achievement_progress") {
        return makeChain({
          upsert: jest.fn().mockResolvedValue({ error: null }),
          update: jest.fn().mockReturnValue(updateChain),
        });
      }
      if (table === "family_achievement_user_notifications") {
        return makeChain({ delete: deleteMock });
      }
      return makeChain();
    });

    await recomputeAchievementImpl(
      readClient as never,
      writeClient as never,
      "fam-1",
      "ach-1",
      familyContext,
    );

    expect(deleteMock).not.toHaveBeenCalled();
  });
});
