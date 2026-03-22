/**
 * Shared fixtures for multi-achievement rollback tests.
 * Provides helpers for scenarios with two+ achievements (e.g. quest + level).
 */
import type { MockChain } from "./achievement-progress-service.fixtures";
import { makeDataResult } from "./achievement-progress-service.fixtures";
import { USER_ID } from "./unlock-evaluation-fixtures";

/** Two achievements: quest_complete (with XP reward) + level_reached */
export function makeQuestLevelAchievements() {
  return {
    questAch: {
      id: "ach-quest",
      name: "Quest Master",
      criteria_type: "quest_complete",
      criteria_config: { threshold: 5 },
      xp_reward: 60,
      gold_reward: 0,
    },
    levelAch: {
      id: "ach-level",
      name: "Level Reached",
      criteria_type: "level_reached",
      criteria_config: { threshold: 2 },
      xp_reward: 0,
      gold_reward: 0,
    },
  };
}

/** CharAch chain returning two achievement IDs, then unlocked_at=null for the first */
export function makeDualCharAchChain(questAchId: string, secondAchId: string) {
  let n = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      n++;
      if (n === 1)
        return {
          eq: jest.fn().mockResolvedValue({
            data: [
              { achievement_id: questAchId },
              { achievement_id: secondAchId },
            ],
            error: null,
          }),
        };
      return {
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ achievement_id: questAchId, unlocked_at: null }],
            error: null,
          }),
        }),
      };
    }),
  };
}

/** Build read client for multi-achievement unlock tests */
export function makeMultiAchReadClient(
  achievements: unknown[],
  charAchChain: unknown,
) {
  return {
    from: jest.fn((table: string) => {
      if (table === "characters")
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: USER_ID, user_profiles: null },
                error: null,
              }),
            }),
          }),
        };
      if (table === "achievements")
        return makeDataResult(achievements) as unknown as MockChain;
      if (table === "character_achievements") return charAchChain;
      if (table === "quest_instances")
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          }),
        };
      throw new Error(`Unexpected table in unlock test: ${table}`);
    }),
  };
}
