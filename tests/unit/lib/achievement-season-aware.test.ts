jest.mock("@/lib/supabase-server", () => ({
  createServiceSupabaseClient: jest.fn(),
}));

jest.mock("@/lib/seasons/active-season", () => ({
  getActiveSeasonForFamily: jest.fn(),
}));

jest.mock("@/lib/family-achievement-progress-service", () => ({
  FamilyAchievementProgressService: jest.fn().mockImplementation(() => ({
    updateProgress: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@/lib/achievement-progress/unlock-engine", () => ({
  runUnlockEvaluation: jest.fn().mockResolvedValue(undefined),
}));

import { EVALUATOR_REGISTRY } from "@/lib/achievement-progress/evaluators";
import { AchievementProgressService } from "@/lib/achievement-progress-service";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";

const SEASON_STARTED_AT = "2026-05-01T00:00:00.000Z";

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

function makeClientForTableQueries() {
  const queries: Record<string, ReturnType<typeof makeThenableQuery>[]> = {};
  const client = {
    from: jest.fn((table: string) => {
      const response = table === "quest_instances" || table === "boss_battle_participants"
        ? { data: [{ gold_reward: 10, volunteer_bonus: 0, streak_bonus: 0, awarded_gold: 5 }], count: 1, error: null }
        : table === "reward_redemptions"
          ? { data: [{ cost: 7 }], count: 1, error: null }
          : { data: [{ xp: 0, level: 1, honor_points: 0 }], count: 1, error: null };
      const query = makeThenableQuery(response);
      queries[table] = [...(queries[table] ?? []), query];
      return query;
    }),
  };
  return { client, queries };
}

describe("individual achievement evaluators season cutoff", () => {
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
    const { client, queries } = makeClientForTableQueries();

    await EVALUATOR_REGISTRY[criteriaType](
      client as never,
      "char-1",
      "user-1",
      { difficulty: "HARD", threshold: 1 },
      { seasonId: "season-1", seasonStartedAt: SEASON_STARTED_AT },
    );

    expect(queries[table][0].gte).toHaveBeenCalledWith(column, SEASON_STARTED_AT);
  });

  it("applies season cutoff to both quest and boss gold-earned sources", async () => {
    const { client, queries } = makeClientForTableQueries();

    await EVALUATOR_REGISTRY.gold_earned(
      client as never,
      "char-1",
      "user-1",
      { threshold: 1 },
      { seasonId: "season-1", seasonStartedAt: SEASON_STARTED_AT },
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

  it("preserves legacy unscoped evaluator queries when there is no active season", async () => {
    const { client, queries } = makeClientForTableQueries();

    await EVALUATOR_REGISTRY.quest_complete(
      client as never,
      "char-1",
      "user-1",
      { threshold: 1 },
      { seasonId: null, seasonStartedAt: null },
    );

    expect(queries.quest_instances[0].gte).not.toHaveBeenCalled();
  });
});

describe("AchievementProgressService active-season scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads and writes progress rows for the active season", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const writeClient = {
      from: jest.fn((table: string) => {
        if (table !== "character_achievements") {
          throw new Error(`Unexpected write table: ${table}`);
        }
        return { upsert };
      }),
    };
    (createServiceSupabaseClient as jest.Mock).mockReturnValue(writeClient);
    (getActiveSeasonForFamily as jest.Mock).mockResolvedValue({
      id: "season-1",
      family_id: "fam-1",
      name: "Season One",
      theme: null,
      starts_at: SEASON_STARTED_AT,
      ends_at: null,
    });

    const existingQuery = makeThenableQuery({ data: [], error: null });
    const readClient = {
      from: jest.fn((table: string) => {
        if (table === "characters") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    user_id: "user-1",
                    user_profiles: { family_id: "fam-1" },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: "ach-1",
                    name: "Complete one quest",
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
        }
        if (table === "character_achievements") {
          return existingQuery;
        }
        if (table === "quest_instances") {
          return makeThenableQuery({ count: 1, error: null });
        }
        throw new Error(`Unexpected read table: ${table}`);
      }),
    };

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress("char-1", { type: "QUEST_APPROVED" });

    expect(getActiveSeasonForFamily).toHaveBeenCalledWith(readClient, "fam-1");
    expect(existingQuery.eq).toHaveBeenCalledWith("season_id", "season-1");
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          character_id: "char-1",
          achievement_id: "ach-1",
          season_id: "season-1",
        }),
      ],
      expect.objectContaining({
        onConflict: "character_id,achievement_id,season_id",
      }),
    );
  });

  it("preserves legacy progress scoping when no active season exists", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const writeClient = {
      from: jest.fn((table: string) => {
        if (table !== "character_achievements") {
          throw new Error(`Unexpected write table: ${table}`);
        }
        return { upsert };
      }),
    };
    (createServiceSupabaseClient as jest.Mock).mockReturnValue(writeClient);
    (getActiveSeasonForFamily as jest.Mock).mockResolvedValue(null);

    const existingQuery = makeThenableQuery({ data: [], error: null });
    const readClient = {
      from: jest.fn((table: string) => {
        if (table === "characters") {
          return makeThenableQuery({
            data: { user_id: "user-1", user_profiles: { family_id: "fam-1" } },
            error: null,
          });
        }
        if (table === "achievements") {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: "ach-1",
                    name: "Complete one quest",
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
        }
        if (table === "character_achievements") return existingQuery;
        if (table === "quest_instances") return makeThenableQuery({ count: 1, error: null });
        throw new Error(`Unexpected read table: ${table}`);
      }),
    };

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress("char-1", { type: "QUEST_APPROVED" });

    expect(existingQuery.eq).not.toHaveBeenCalledWith("season_id", expect.anything());
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          character_id: "char-1",
          achievement_id: "ach-1",
          season_id: null,
        }),
      ],
      expect.objectContaining({
        onConflict: "character_id,achievement_id,season_id",
      }),
    );
  });
});
