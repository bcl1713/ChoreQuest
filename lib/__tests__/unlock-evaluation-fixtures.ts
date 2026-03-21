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
  /** If set, the characters level update resolves with this error message. */
  levelUpdateError?: string;
  /**
   * Rows returned from the level UPDATE ... RETURNING select.
   * Defaults to [{ level: 2 }] (update applied). Pass [] to simulate a
   * concurrent race where this caller's write was a no-op (levelApplied=false).
   */
  levelSelectRows?: Array<{ level: number }>;
  /** If set, the second (cascade) upsert resolves with this error message. */
  cascadeUpsertError?: string;
  /**
   * If set, the stats rollback UPDATE resolves with this error message.
   * (Replaces the old rpcCompensationError now that rollback uses a direct SET.)
   */
  statsRevertError?: string;
  /** If set, the unlocked_at revert update resolves with this error message. */
  revertUnlockError?: string;
  /** If set, the cascade progress revert upsert resolves with this error. */
  cascadeProgressRevertError?: string;
};

/** Build mock write client mocks for unlock evaluation tests */
export function makeWriteMocks(options?: WriteMocksOptions) {
  const {
    unlockedIds = [DEFAULT_ACHIEVEMENT.id],
    rpcReturn = { xp: 150, gold: 75, level: 1 },
    levelUpdateError,
    levelSelectRows,
    cascadeUpsertError,
    statsRevertError,
    revertUnlockError,
    cascadeProgressRevertError,
  } = options ?? {};

  // Upsert: call 1 = initial progress, call 2 = cascade, call 3+ = cascade revert
  let upsertCallCount = 0;
  const upsert = jest.fn().mockImplementation(() => {
    upsertCallCount++;
    if (upsertCallCount === 1) return Promise.resolve({ error: null });
    if (upsertCallCount === 2)
      return Promise.resolve({
        error: cascadeUpsertError ? { message: cascadeUpsertError } : null,
      });
    // call 3+ = cascade revert upsert (Fix P2)
    return Promise.resolve({
      error: cascadeProgressRevertError
        ? { message: cascadeProgressRevertError }
        : null,
    });
  });

  // Lock chain: .update().eq().in().is().select() → data
  const selectAfterIs = jest.fn().mockResolvedValue({
    data: unlockedIds.map((id) => ({ achievement_id: id })),
    error: null,
  });
  const isNull = jest.fn().mockReturnValue({ select: selectAfterIs });
  const inForLock = jest.fn().mockReturnValue({ is: isNull });
  const eqForLock = jest.fn().mockReturnValue({ in: inForLock });

  // Revert chain: .update().eq().in() → awaited directly
  const inForRevert = jest.fn().mockResolvedValue({
    error: revertUnlockError ? { message: revertUnlockError } : null,
  });
  const eqForRevert = jest.fn().mockReturnValue({ in: inForRevert });

  // charAchUpdate routes by payload — cascade revert now goes through upsert
  const charAchUpdate = jest.fn().mockImplementation((payload: unknown) => {
    const p = payload as Record<string, unknown>;
    return "unlocked_at" in p && p.unlocked_at === null
      ? { eq: eqForRevert }
      : { eq: eqForLock };
  });

  // characters.update paths:
  //   Forward level:  .update({level}).eq("id").lt().select() → { data, error }
  //   Level rollback: .update({level}).eq("id").eq("level")   → { error }  (Fix P1)
  //   Stats rollback: .update({xp,gold}).eq("id").eq("xp").eq("gold") → { error }  (Fix P1)
  const statsSelectData = levelUpdateError
    ? null
    : (levelSelectRows ?? [{ level: 2 }]);
  const statsSelect = jest.fn().mockResolvedValue({
    data: statsSelectData,
    error: levelUpdateError ? { message: levelUpdateError } : null,
  });
  const statsLt = jest.fn().mockReturnValue({ select: statsSelect });
  const levelForwardEq = jest.fn().mockReturnValue({ lt: statsLt });

  // Level rollback chain (Fix P1): .eq("id").eq("level") → await
  const levelRevertEq2 = jest.fn().mockResolvedValue({ error: null });
  const levelRevertEq1 = jest.fn().mockReturnValue({ eq: levelRevertEq2 });

  // Stats rollback chain (Fix P1): .eq("id").eq("xp").eq("gold") → await
  const statsRevertEq3 = jest.fn().mockResolvedValue({
    error: statsRevertError ? { message: statsRevertError } : null,
  });
  const statsRevertEq2 = jest.fn().mockReturnValue({ eq: statsRevertEq3 });
  const statsRevertEq1 = jest.fn().mockReturnValue({ eq: statsRevertEq2 });

  let levelUpdateCallCount = 0;
  const statsUpdate = jest.fn().mockImplementation((payload: unknown) => {
    const p = payload as Record<string, unknown>;
    if ("xp" in p || "gold" in p) {
      // Stats rollback path
      return { eq: statsRevertEq1 };
    }
    // Level update path (forward on call 1, rollback on call 2+)
    levelUpdateCallCount++;
    return levelUpdateCallCount === 1
      ? { eq: levelForwardEq }
      : { eq: levelRevertEq1 };
  });

  const from = jest.fn((table: string) => {
    if (table === "character_achievements")
      return { upsert, update: charAchUpdate };
    if (table === "characters") return { update: statsUpdate };
    return { upsert };
  });

  // RPC: only the forward increment; compensation is now a direct UPDATE (Fix P1)
  const rpcSingle = jest
    .fn()
    .mockResolvedValue({ data: rpcReturn, error: null });
  const rpc = jest.fn().mockReturnValue({ single: rpcSingle });

  return {
    upsert,
    selectAfterIs,
    isNull,
    inForLock,
    inForRevert,
    charAchUpdate,
    statsUpdate,
    statsLt,
    statsSelect,
    levelRevertEq1,
    levelRevertEq2,
    statsRevertEq1,
    statsRevertEq2,
    statsRevertEq3,
    from,
    rpc,
    rpcSingle,
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
