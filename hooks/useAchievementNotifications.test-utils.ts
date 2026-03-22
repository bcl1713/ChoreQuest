import type { RealtimeEvent } from "@/lib/realtime-context";

export const CHAR_ID = "char-1";
export const OTHER_CHAR_ID = "char-other";
export const ACH_ID = "ach-1";
export const CA_ID = "ca-1";

export function makeAchievement(overrides = {}) {
  return {
    name: "First Steps",
    description: "Complete your first quest",
    icon: "🏆",
    xp_reward: 100,
    gold_reward: 50,
    ...overrides,
  };
}

export function makeUnlockEvent(
  overrides: Partial<RealtimeEvent> = {},
): RealtimeEvent {
  return {
    type: "achievement_unlock_updated",
    table: "character_achievements",
    action: "UPDATE",
    record: {
      id: CA_ID,
      character_id: CHAR_ID,
      achievement_id: ACH_ID,
      unlocked_at: "2026-03-22",
      notified: false,
    },
    old_record: {
      id: CA_ID,
      character_id: CHAR_ID,
      achievement_id: ACH_ID,
      unlocked_at: null,
      notified: false,
    },
    ...overrides,
  };
}

export function makeCatchUpChain(rows: unknown[] = []) {
  const resolvedChain = {
    eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnValue(resolvedChain),
  };
}

export function makeAchievementChain(data: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data,
      error: data ? null : { message: "not found" },
    }),
  };
}
