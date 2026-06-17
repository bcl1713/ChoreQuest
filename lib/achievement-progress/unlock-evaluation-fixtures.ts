import { makeDataResult, type MockChain } from "./unlock-data-result-fixture";

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
  unlockedIds?: string[];
  rpcReturn?: {
    unlocked_achievement_ids: string[];
    awarded_xp: number;
    awarded_gold: number;
    xp: number | null;
    gold: number | null;
    level: number | null;
  };
  levelUpdateError?: string;
  levelSelectRows?: Array<{ level: number }>;
  cascadeUpsertError?: string;
  statsRevertError?: string;
  statsRevertZeroRows?: boolean;
  revertUnlockError?: string;
  cascadeProgressRevertError?: string;
  cascadeDeleteError?: string;
};

export function makeWriteMocks(options?: WriteMocksOptions) {
  const {
    unlockedIds = [DEFAULT_ACHIEVEMENT.id],
    rpcReturn = {
      unlocked_achievement_ids: unlockedIds,
      awarded_xp: 50,
      awarded_gold: 25,
      xp: 150,
      gold: 75,
      level: 1,
    },
    levelUpdateError,
    levelSelectRows,
    cascadeUpsertError,
    statsRevertError,
    statsRevertZeroRows,
    revertUnlockError,
    cascadeProgressRevertError,
    cascadeDeleteError,
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

  // Stats rollback chain (Fix P1): .eq("id").eq("xp").eq("gold").select("id")
  const statsRevertSelect = jest.fn().mockResolvedValue({
    data: statsRevertError || statsRevertZeroRows ? [] : [{ id: "char-001" }],
    error: statsRevertError ? { message: statsRevertError } : null,
  });
  const statsRevertEq3 = jest
    .fn()
    .mockReturnValue({ select: statsRevertSelect });
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

  // Phantom-row delete chain (P2): .delete().eq("character_id").in("achievement_id")
  const cascadeDeleteIn = jest.fn().mockResolvedValue({
    error: cascadeDeleteError ? { message: cascadeDeleteError } : null,
  });
  const cascadeDeleteEq = jest.fn().mockReturnValue({ in: cascadeDeleteIn });
  const cascadeDelete = jest.fn().mockReturnValue({ eq: cascadeDeleteEq });

  const from = jest.fn((table: string) => {
    if (table === "character_achievements")
      return { upsert, update: charAchUpdate, delete: cascadeDelete };
    if (table === "characters") return { update: statsUpdate };
    return { upsert };
  });

  // RPC: atomic unlock + reward grant; compensation is now a direct UPDATE (Fix P1)
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
    statsRevertSelect,
    cascadeDelete,
    cascadeDeleteEq,
    cascadeDeleteIn,
    from,
    rpc,
    rpcSingle,
  };
}

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
