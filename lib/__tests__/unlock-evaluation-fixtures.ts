/**
 * Shared test fixtures for unlock evaluation tests.
 * Provides compact mock builders to keep test files under the 300-line limit.
 */
import type { MockChain } from "./achievement-progress-service.fixtures";
import { makeDataResult } from "./achievement-progress-service.fixtures";

export const CHAR_ID = "char-001";
export const USER_ID = "user-001";

export type UnlockTestAchievement = {
  id: string;
  name: string;
  criteria_type: string;
  criteria_config: Record<string, unknown>;
  xp_reward: number;
  gold_reward: number;
};

export const DEFAULT_ACHIEVEMENT: UnlockTestAchievement = {
  id: "ach-001",
  name: "Quest Master",
  criteria_type: "quest_complete",
  criteria_config: { threshold: 5 },
  xp_reward: 50,
  gold_reward: 25,
};

export type WriteMocksOptions = {
  /** Achievement IDs to return as actually-unlocked from the IS NULL update. */
  unlockedIds?: string[];
  /** Stats the RPC mock should return after the atomic increment. */
  rpcReturn?: { xp: number; gold: number; level: number };
};

/** Build mock write client mocks for unlock evaluation tests */
export function makeWriteMocks(options?: WriteMocksOptions) {
  const {
    unlockedIds = [DEFAULT_ACHIEVEMENT.id],
    rpcReturn = { xp: 150, gold: 75, level: 1 },
  } = options ?? {};

  const upsert = jest.fn().mockResolvedValue({ error: null });
  const selectAfterIs = jest.fn().mockResolvedValue({
    data: unlockedIds.map((id) => ({ achievement_id: id })),
    error: null,
  });
  const isNull = jest.fn().mockReturnValue({ select: selectAfterIs });
  const inFn = jest.fn().mockReturnValue({ is: isNull });
  const eqUpdate = jest.fn().mockReturnValue({ in: inFn });
  const charAchUpdate = jest.fn().mockReturnValue({ eq: eqUpdate });
  const statsEq = jest.fn().mockResolvedValue({ error: null });
  const statsUpdate = jest.fn().mockReturnValue({ eq: statsEq });
  const from = jest.fn((table: string) => {
    if (table === "character_achievements")
      return { upsert, update: charAchUpdate };
    if (table === "characters") return { update: statsUpdate };
    return { upsert };
  });
  const rpcSingle = jest
    .fn()
    .mockResolvedValue({ data: rpcReturn, error: null });
  const rpc = jest.fn().mockReturnValue({ single: rpcSingle });
  return {
    upsert,
    selectAfterIs,
    isNull,
    inFn,
    charAchUpdate,
    statsUpdate,
    from,
    rpc,
  };
}

/** Build charAchChain that returns unlocked_at state on second call */
export function makeCharAchChain(
  achievementId: string,
  unlockedAt: string | null,
) {
  let callCount = 0;
  return {
    select: jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          eq: jest.fn().mockResolvedValue({
            data: [{ achievement_id: achievementId }],
            error: null,
          }),
        };
      }
      return {
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ achievement_id: achievementId, unlocked_at: unlockedAt }],
            error: null,
          }),
        }),
      };
    }),
  };
}

/** Build read client for simple single-achievement unlock tests */
export function makeUnlockReadClient(options: {
  questCount?: number;
  unlockedAt?: string | null;
  achievementId?: string;
  achievement?: Partial<UnlockTestAchievement>;
  charStats?: { xp: number; gold: number; level: number };
}) {
  const {
    questCount = 5,
    unlockedAt = null,
    achievementId = DEFAULT_ACHIEVEMENT.id,
    achievement = DEFAULT_ACHIEVEMENT,
    charStats,
  } = options;
  const merged = { ...DEFAULT_ACHIEVEMENT, ...achievement };

  const questChain: MockChain = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ count: questCount, error: null }),
      }),
    }),
  };

  const charCallCount = { n: 0 };
  const charChain = {
    select: jest.fn().mockImplementation(() => {
      charCallCount.n++;
      if (charCallCount.n === 1 || !charStats) {
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: USER_ID, user_profiles: null },
              error: null,
            }),
          }),
        };
      }
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: charStats,
            error: null,
          }),
        }),
      };
    }),
  };

  const achievementsChain = makeDataResult([merged]);
  const charAchChain = makeCharAchChain(achievementId, unlockedAt);

  return {
    from: jest.fn((table: string) => {
      if (table === "characters") return charChain;
      if (table === "achievements")
        return achievementsChain as unknown as MockChain;
      if (table === "character_achievements") return charAchChain;
      if (table === "quest_instances") return questChain;
      throw new Error(`Unexpected table in unlock test: ${table}`);
    }),
  };
}
