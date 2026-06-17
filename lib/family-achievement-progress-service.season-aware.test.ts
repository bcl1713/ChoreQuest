jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(),
}));

jest.mock("@/lib/seasons/active-season", () => ({
  getActiveSeasonForFamily: jest.fn(),
}));

jest.mock("@/lib/family-achievement-progress/service-helpers", () => ({
  ...jest.requireActual("@/lib/family-achievement-progress/service-helpers"),
  evaluateUnlocksImpl: jest.fn().mockResolvedValue(undefined),
}));

import { FAMILY_EVALUATOR_REGISTRY } from "@/lib/family-achievement-progress/family-evaluators";
import { FamilyAchievementProgressService } from "@/lib/family-achievement-progress-service";
import { evaluateUnlocksImpl } from "@/lib/family-achievement-progress/service-helpers";
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

const SEASON_ID = "season-154";
const SEASON_STARTED_AT = "2026-05-01T00:00:00.000Z";
const FAMILY_ID = "family-154";

function makeThenableQuery(response: unknown) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    or: jest.fn(() => query),
    in: jest.fn(() => query),
    gte: jest.fn(() => query),
    is: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve(response)),
    maybeSingle: jest.fn(() => Promise.resolve(response)),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
  };
  return query;
}

function makeEvaluatorClient() {
  const queries: Record<string, ReturnType<typeof makeThenableQuery>[]> = {};
  const client = {
    from: jest.fn((table: string) => {
      const response =
        table === "quest_instances"
          ? { data: [{ gold_reward: 10, volunteer_bonus: 0, streak_bonus: 0 }], count: 1, error: null }
          : table === "boss_battle_participants"
            ? { data: [{ awarded_gold: 5 }], count: 1, error: null }
            : table === "reward_redemptions"
              ? { data: [{ cost: 7 }], count: 1, error: null }
              : { data: [], count: 0, error: null };
      const query = makeThenableQuery(response);
      queries[table] = [...(queries[table] ?? []), query];
      return query;
    }),
  };
  return { client, queries };
}

describe("family achievement evaluators season cutoff", () => {
  it.each([
    ["quest_complete", "quest_instances", "approved_at"],
    ["quest_volunteer", "quest_instances", "approved_at"],
    ["quest_difficulty", "quest_instances", "approved_at"],
    ["boss_defeated", "boss_battle_participants", "approved_at"],
    ["boss_participated", "boss_battle_participants", "approved_at"],
    ["gold_spent", "reward_redemptions", "approved_at"],
    ["reward_redeemed", "reward_redemptions", "approved_at"],
    ["class_change", "character_change_history", "created_at"],
  ])("applies season cutoff for %s", async (criteriaType, table, column) => {
    const { client, queries } = makeEvaluatorClient();

    await FAMILY_EVALUATOR_REGISTRY[criteriaType](
      client as never,
      FAMILY_ID,
      ["user-1"],
      ["char-1"],
      ["user-1"],
      "sum",
      [{ userId: "user-1", characterIds: ["char-1"] }],
      { difficulty: "HARD", threshold: 1 },
      { seasonId: SEASON_ID, seasonStartedAt: SEASON_STARTED_AT },
    );

    expect(queries[table][0].gte).toHaveBeenCalledWith(column, SEASON_STARTED_AT);
  });

  it("applies season cutoff to both family gold-earned sources", async () => {
    const { client, queries } = makeEvaluatorClient();

    await FAMILY_EVALUATOR_REGISTRY.gold_earned(
      client as never,
      FAMILY_ID,
      ["user-1"],
      ["char-1"],
      ["user-1"],
      "sum",
      [{ userId: "user-1", characterIds: ["char-1"] }],
      { threshold: 1 },
      { seasonId: SEASON_ID, seasonStartedAt: SEASON_STARTED_AT },
    );

    expect(queries.quest_instances[0].gte).toHaveBeenCalledWith(
      "approved_at",
      SEASON_STARTED_AT,
    );
    expect(queries.boss_battle_participants[0].gte).toHaveBeenCalledWith(
      "approved_at",
      SEASON_STARTED_AT,
    );
  });

  it("preserves legacy unscoped family evaluator queries when there is no active season", async () => {
    const { client, queries } = makeEvaluatorClient();

    await FAMILY_EVALUATOR_REGISTRY.quest_complete(
      client as never,
      FAMILY_ID,
      ["user-1"],
      ["char-1"],
      ["user-1"],
      "sum",
      [{ userId: "user-1", characterIds: ["char-1"] }],
      { threshold: 1 },
      { seasonId: null, seasonStartedAt: null },
    );

    expect(queries.quest_instances[0].gte).not.toHaveBeenCalled();
  });
});

describe("FamilyAchievementProgressService active-season scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads and writes family progress rows for the active season", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const writeClient = {
      from: jest.fn((table: string) => {
        if (table !== "family_achievement_progress") {
          throw new Error(`Unexpected write table: ${table}`);
        }
        return { upsert };
      }),
    };
    (createServiceSupabaseClient as jest.Mock).mockReturnValue(writeClient);
    (getActiveSeasonForFamily as jest.Mock).mockResolvedValue({
      id: SEASON_ID,
      family_id: FAMILY_ID,
      name: "Season 154",
      theme: null,
      starts_at: SEASON_STARTED_AT,
      ends_at: null,
    });

    const existingProgressQuery = makeThenableQuery({ data: [], error: null });
    const questQuery = makeThenableQuery({ count: 2, error: null });
    const readClient = {
      from: jest.fn((table: string) => {
        if (table === "user_profiles") {
          return makeThenableQuery({
            data: [
              { id: "user-1", characters: [{ id: "char-1" }] },
              { id: "user-2", characters: [{ id: "char-2" }] },
            ],
            error: null,
          });
        }
        if (table === "family_achievements") {
          return makeThenableQuery({
            data: [
              {
                id: "family-ach-1",
                name: "Family quest",
                criteria_type: "quest_complete",
                criteria_config: { threshold: 2 },
                xp_reward: 0,
                gold_reward: 0,
              },
            ],
            error: null,
          });
        }
        if (table === "family_achievement_progress") {
          return existingProgressQuery;
        }
        if (table === "quest_instances") {
          return questQuery;
        }
        throw new Error(`Unexpected read table: ${table}`);
      }),
    };

    const service = new FamilyAchievementProgressService(readClient as never);
    await service.updateProgress(FAMILY_ID, null);

    expect(getActiveSeasonForFamily).toHaveBeenCalledWith(readClient, FAMILY_ID);
    expect(existingProgressQuery.eq).toHaveBeenCalledWith("season_id", SEASON_ID);
    expect(questQuery.gte).toHaveBeenCalledWith("approved_at", SEASON_STARTED_AT);
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          family_id: FAMILY_ID,
          family_achievement_id: "family-ach-1",
          season_id: SEASON_ID,
        }),
      ],
      expect.objectContaining({
        onConflict: "family_id,family_achievement_id,season_id",
      }),
    );
    expect(evaluateUnlocksImpl).toHaveBeenCalledWith(
      readClient,
      writeClient,
      FAMILY_ID,
      expect.arrayContaining([
        expect.objectContaining({ season_id: SEASON_ID }),
      ]),
    );
  });
});
