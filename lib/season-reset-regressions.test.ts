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

import { AchievementProgressService } from "@/lib/achievement-progress-service";
import { EVALUATOR_REGISTRY } from "@/lib/achievement-progress/evaluators";
import { FAMILY_EVALUATOR_REGISTRY } from "@/lib/family-achievement-progress/family-evaluators";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { getActiveSeasonForFamily } from "@/lib/seasons/active-season";

const SEASON_ID = "season-156";
const SEASON_STARTED_AT = "2026-06-01T00:00:00.000Z";
const FAMILY_ID = "family-156";
const USER_ID = "user-156";
const CHARACTER_ID = "char-156";
const ACHIEVEMENT_ID = "ach-first-current-season-quest";

function makeSeasonFilteredResult<T>(unfiltered: T, filtered: T) {
  let result = unfiltered;
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    or: jest.fn(() => query),
    in: jest.fn(() => query),
    is: jest.fn(() => query),
    gte: jest.fn(() => {
      result = filtered;
      return query;
    }),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

function makeIndividualReadClient(currentSeasonQuestCount: number) {
  let characterAchievementSelects = 0;
  const questQuery = makeSeasonFilteredResult(
    { count: 1, error: null },
    { count: currentSeasonQuestCount, error: null },
  );

  return {
    from: jest.fn((table: string) => {
      if (table === "characters") {
        return makeSeasonFilteredResult(
          { data: { user_id: USER_ID, user_profiles: { family_id: FAMILY_ID } }, error: null },
          { data: { user_id: USER_ID, user_profiles: { family_id: FAMILY_ID } }, error: null },
        );
      }
      if (table === "achievements") {
        return makeSeasonFilteredResult(
          {
            data: [
              {
                id: ACHIEVEMENT_ID,
                name: "First current-season quest",
                criteria_type: "quest_complete",
                criteria_config: { threshold: 1 },
                xp_reward: 10,
                gold_reward: 5,
              },
            ],
            error: null,
          },
          {
            data: [
              {
                id: ACHIEVEMENT_ID,
                name: "First current-season quest",
                criteria_type: "quest_complete",
                criteria_config: { threshold: 1 },
                xp_reward: 10,
                gold_reward: 5,
              },
            ],
            error: null,
          },
        );
      }
      if (table === "character_achievements") {
        characterAchievementSelects += 1;
        const alreadyUnlocked = characterAchievementSelects >= 4;
        const result = characterAchievementSelects % 2 === 1
          ? { data: characterAchievementSelects === 1 ? [] : [{ achievement_id: ACHIEVEMENT_ID }], error: null }
          : {
              data: [
                {
                  achievement_id: ACHIEVEMENT_ID,
                  unlocked_at: alreadyUnlocked ? "2026-06-01T01:00:00.000Z" : null,
                },
              ],
              error: null,
            };
        return makeSeasonFilteredResult(result, result);
      }
      if (table === "quest_instances") return questQuery;
      throw new Error(`Unexpected individual read table: ${table}`);
    }),
    questQuery,
  };
}

function makeIndividualWriteClient() {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const selectAfterUnlock = jest.fn().mockResolvedValue({
    data: [{ achievement_id: ACHIEVEMENT_ID }],
    error: null,
  });
  const unlockUpdate = jest.fn(() => ({
    eq: jest.fn(() => ({
      in: jest.fn(() => ({
        is: jest.fn(() => ({
          eq: jest.fn(() => ({ select: selectAfterUnlock })),
        })),
      })),
    })),
  }));
  const rpcSingle = jest.fn().mockResolvedValue({
    data: {
      unlocked_achievement_ids: [ACHIEVEMENT_ID],
      awarded_xp: 10,
      awarded_gold: 5,
      xp: 10,
      gold: 5,
      level: 1,
    },
    error: null,
  });
  const rpc = jest.fn(() => ({ single: rpcSingle }));
  const levelUpdate = jest.fn(() => ({
    eq: jest.fn(() => ({
      lt: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  }));

  return {
    upsert,
    unlockUpdate,
    rpc,
    from: jest.fn((table: string) => {
      if (table === "character_achievements") return { upsert, update: unlockUpdate };
      if (table === "characters") return { update: levelUpdate };
      throw new Error(`Unexpected individual write table: ${table}`);
    }),
  };
}

describe("season reset regression coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveSeasonForFamily as jest.Mock).mockResolvedValue({
      id: SEASON_ID,
      family_id: FAMILY_ID,
      name: "Summer 2026",
      theme: null,
      starts_at: SEASON_STARTED_AT,
      ends_at: null,
    });
  });

  it("does not backfill individual progress or rewards from pre-season quest history", async () => {
    const readClient = makeIndividualReadClient(0);
    const writeClient = makeIndividualWriteClient();
    (createServiceSupabaseClient as jest.Mock).mockReturnValue(writeClient);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    expect(readClient.questQuery.gte).toHaveBeenCalledWith("approved_at", SEASON_STARTED_AT);
    expect(writeClient.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          achievement_id: ACHIEVEMENT_ID,
          season_id: SEASON_ID,
          progress: { current: 0, threshold: 1 },
        }),
      ],
      expect.objectContaining({ onConflict: "character_id,achievement_id,season_id" }),
    );
    expect(writeClient.unlockUpdate).not.toHaveBeenCalled();
    expect(writeClient.rpc).not.toHaveBeenCalled();
  });

  it("awards a current-season individual unlock exactly once", async () => {
    const readClient = makeIndividualReadClient(1);
    const writeClient = makeIndividualWriteClient();
    (createServiceSupabaseClient as jest.Mock).mockReturnValue(writeClient);

    const service = new AchievementProgressService(readClient as never);
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });
    await service.updateProgress(CHARACTER_ID, { type: "QUEST_APPROVED" });

    expect(writeClient.unlockUpdate).not.toHaveBeenCalled();
    expect(writeClient.rpc).toHaveBeenCalledTimes(1);
    expect(writeClient.rpc).toHaveBeenCalledWith(
      "fn_unlock_achievements_and_grant_rewards",
      {
        p_achievement_ids: [ACHIEVEMENT_ID],
        p_character_id: CHARACTER_ID,
        p_season_id: SEASON_ID,
      },
    );
  });

  it.each([
    ["individual boss participation", EVALUATOR_REGISTRY.boss_participated, "boss_battle_participants", { count: 1, error: null }, { count: 0, error: null }],
    ["individual reward redemption", EVALUATOR_REGISTRY.reward_redeemed, "reward_redemptions", { count: 1, error: null }, { count: 0, error: null }],
    ["individual gold earned", EVALUATOR_REGISTRY.gold_earned, "quest_instances", { data: [{ gold_reward: 100, volunteer_bonus: 0, streak_bonus: 0 }], error: null }, { data: [], error: null }],
  ])("ignores old %s rows before the active season", async (_label, evaluator, expectedTable, unfiltered, filtered) => {
    const query = makeSeasonFilteredResult(unfiltered, filtered);
    const bossQuery = makeSeasonFilteredResult(
      { data: [{ awarded_gold: 50 }], count: 1, error: null },
      { data: [], count: 0, error: null },
    );
    const client = {
      from: jest.fn((table: string) => (table === "boss_battle_participants" ? bossQuery : query)),
    };

    const result = await evaluator(
      client as never,
      CHARACTER_ID,
      USER_ID,
      { threshold: 1 },
      { seasonId: SEASON_ID, seasonStartedAt: SEASON_STARTED_AT },
    );

    expect(client.from).toHaveBeenCalledWith(expectedTable);
    expect(result.current).toBe(0);
  });

  it.each([
    ["family boss participation", FAMILY_EVALUATOR_REGISTRY.boss_participated, "boss_battle_participants", { count: 1, error: null }, { count: 0, error: null }],
    ["family reward redemption", FAMILY_EVALUATOR_REGISTRY.reward_redeemed, "reward_redemptions", { count: 1, error: null }, { count: 0, error: null }],
    ["family gold earned", FAMILY_EVALUATOR_REGISTRY.gold_earned, "quest_instances", { data: [{ gold_reward: 100, volunteer_bonus: 0, streak_bonus: 0 }], error: null }, { data: [], error: null }],
  ])("ignores old %s rows before the active season", async (_label, evaluator, expectedTable, unfiltered, filtered) => {
    const query = makeSeasonFilteredResult(unfiltered, filtered);
    const bossQuery = makeSeasonFilteredResult(
      { data: [{ awarded_gold: 50 }], count: 1, error: null },
      { data: [], count: 0, error: null },
    );
    const client = {
      from: jest.fn((table: string) => (table === "boss_battle_participants" ? bossQuery : query)),
    };

    const result = await evaluator(
      client as never,
      FAMILY_ID,
      [USER_ID],
      [CHARACTER_ID],
      [USER_ID],
      "sum",
      [{ userId: USER_ID, characterIds: [CHARACTER_ID] }],
      { threshold: 1, family_evaluation_mode: "sum" },
      { seasonId: SEASON_ID, seasonStartedAt: SEASON_STARTED_AT },
    );

    expect(client.from).toHaveBeenCalledWith(expectedTable);
    expect(result.current).toBe(0);
  });
});
