const mockWriteClient = { from: jest.fn() };

jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(() => mockWriteClient),
}));

jest.mock("@/lib/family-achievement-progress/family-evaluators", () => ({
  FAMILY_EVALUATOR_REGISTRY: {
    quest_complete: jest.fn(),
  },
  FAMILY_EVENT_CRITERIA_MAP: {},
  ALL_FAMILY_CRITERIA_TYPES: ["quest_complete"],
}));

jest.mock("@/lib/seasons/active-season", () => ({
  getActiveSeasonForFamily: jest.fn().mockResolvedValue({
    id: "season-current",
    family_id: "fam-1",
    name: "Current Season",
    theme: null,
    starts_at: "2026-06-01T00:00:00.000Z",
    ends_at: null,
  }),
}));

import { FamilyAchievementProgressService } from "./family-achievement-progress-service";
import { FAMILY_EVALUATOR_REGISTRY } from "./family-achievement-progress/family-evaluators";

const mockEvaluator = FAMILY_EVALUATOR_REGISTRY.quest_complete as jest.Mock;

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    is: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  Object.assign(chain, overrides);
  return chain;
}

const familyMembers = [{ id: "u-1", characters: [{ id: "c-1" }] }];

const achievementRow = {
  id: "ach-1",
  name: "Complete 5 quests",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 100,
  gold_reward: 20,
};

describe("FamilyAchievementProgressService.updateProgress — re-lock path", () => {
  let readClient: { from: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildReadClient(progressIds: string[] = ["ach-1"]): {
    from: jest.Mock;
  } {
    return {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockResolvedValue({
                  data: familyMembers,
                  error: null,
                }),
              }),
            ),
          });
        }
        if (table === "family_achievements") {
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockResolvedValue({
                  data: [achievementRow],
                  error: null,
                }),
              }),
            ),
          });
        }
        if (table === "family_achievement_progress") {
          // fetchExistingProgressIds returns matching IDs
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockResolvedValue({
                  data: progressIds.map((id) => ({
                    family_achievement_id: id,
                  })),
                  error: null,
                }),
              }),
            ),
          });
        }
        return makeChain();
      }),
    };
  }

  it("clears unlocked_at and deletes notifications when progress regresses below threshold", async () => {
    mockEvaluator.mockResolvedValue({ current: 2 }); // below threshold of 5

    const progressId = "prog-uuid-456";
    const deleteMock = jest
      .fn()
      .mockReturnValue(
        makeChain({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      );
    const updateChain = makeChain({
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: progressId }, error: null }),
    });
    const updateMock = jest.fn().mockReturnValue(updateChain);

    mockWriteClient.from.mockImplementation((table: string) => {
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

    readClient = buildReadClient();
    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress("fam-1", null);

    expect(updateMock).toHaveBeenCalledWith({ unlocked_at: null });

    const deleteChain = deleteMock.mock.results[0].value;
    expect(deleteChain.eq).toHaveBeenCalledWith(
      "family_achievement_progress_id",
      progressId,
    );
  });

  it("skips notification deletion when re-lock returns no progress row id", async () => {
    mockEvaluator.mockResolvedValue({ current: 0 }); // below threshold

    const deleteMock = jest.fn();
    const updateChain = makeChain({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockWriteClient.from.mockImplementation((table: string) => {
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

    readClient = buildReadClient();
    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress("fam-1", null);

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("does not clear unlocked_at for achievements that meet the threshold", async () => {
    mockEvaluator.mockResolvedValue({ current: 5 }); // meets threshold

    const updateMock = jest
      .fn()
      .mockReturnValue(
        makeChain({ is: jest.fn().mockResolvedValue({ error: null }) }),
      );

    // evaluateUnlocks fetches existing progress to check unlocked_at
    let readProgressCallCount = 0;
    readClient = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockResolvedValue({
                  data: familyMembers,
                  error: null,
                }),
              }),
            ),
          });
        }
        if (table === "family_achievements") {
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockResolvedValue({
                  data: [achievementRow],
                  error: null,
                }),
              }),
            ),
          });
        }
        if (table === "family_achievement_progress") {
          readProgressCallCount++;
          if (readProgressCallCount === 1) {
            // fetchExistingProgressIds
            return makeChain({
              select: jest.fn().mockReturnValue(
                makeChain({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ family_achievement_id: "ach-1" }],
                    error: null,
                  }),
                }),
              ),
            });
          }
          // evaluateUnlocks fetch to check unlocked_at — not yet unlocked
          return makeChain({
            select: jest.fn().mockReturnValue(
              makeChain({
                eq: jest.fn().mockReturnValue(
                  makeChain({
                    in: jest.fn().mockResolvedValue({
                      data: [
                        { family_achievement_id: "ach-1", unlocked_at: null },
                      ],
                      error: null,
                    }),
                  }),
                ),
              }),
            ),
          });
        }
        return makeChain();
      }),
    };

    mockWriteClient.from.mockImplementation((table: string) => {
      if (table === "family_achievement_progress") {
        return makeChain({
          upsert: jest.fn().mockResolvedValue({ error: null }),
          update: updateMock,
        });
      }
      return makeChain();
    });

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress("fam-1", null);

    // update should be called once for unlock (not for re-lock)
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_at: expect.any(String) }),
    );
    expect(updateMock).not.toHaveBeenCalledWith({ unlocked_at: null });
  });
});
