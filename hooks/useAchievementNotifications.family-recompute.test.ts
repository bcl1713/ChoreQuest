import { renderHook, waitFor } from "@testing-library/react";
import { useAchievementNotifications } from "./useAchievementNotifications";
import {
  CHAR_ID,
  makeAchievement,
  makeCatchUpChain,
  makeAchievementChain,
} from "./useAchievementNotifications.test-utils";

const FAMILY_ID = "family-1";
const FA_ID = "fa-1";
const FAP_ID = "fap-1";

const mockFrom = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: { access_token: "tok" } } }),
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-001" } } }),
    },
  },
}));

const mockOnAchievementUnlockUpdate = jest.fn();
const mockOnFamilyAchievementUnlockUpdate = jest.fn();
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onAchievementUnlockUpdate: mockOnAchievementUnlockUpdate,
    onFamilyAchievementUnlockUpdate: mockOnFamilyAchievementUnlockUpdate,
  }),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

function makeFamilyCatchUpChain(rows: unknown[] = []) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

function makeUserNotificationsChain(notifiedIds: string[] = []) {
  const rows = notifiedIds.map((id) => ({
    family_achievement_progress_id: id,
  }));
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

function makeFamilyAchievementChain(data: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data,
      error: data ? null : { message: "not found" },
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  mockOnAchievementUnlockUpdate.mockImplementation(() => () => {});
  mockOnFamilyAchievementUnlockUpdate.mockImplementation(() => () => {});
  mockFrom.mockImplementation((table: string) => {
    if (table === "character_achievements") return makeCatchUpChain([]);
    if (table === "family_achievement_progress")
      return makeFamilyCatchUpChain([]);
    if (table === "family_achievement_user_notifications")
      return makeUserNotificationsChain([]);
    if (table === "achievements")
      return makeAchievementChain(makeAchievement());
    if (table === "family_achievements")
      return makeFamilyAchievementChain(makeAchievement());
    return {};
  });
});

describe("useAchievementNotifications — family recompute before catch-up", () => {
  it("calls /api/family-achievements before querying progress rows", async () => {
    const familyCatchUpRows = [
      {
        id: FAP_ID,
        family_achievement_id: FA_ID,
        family_achievements: {
          name: "Team Effort",
          description: "Complete 50 quests as a family",
          icon: "👨‍👩‍👧‍👦",
          xp_reward: 0,
          gold_reward: 0,
        },
      },
    ];

    const callOrder: string[] = [];
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      callOrder.push(url);
      return Promise.resolve({ ok: true });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress") {
        callOrder.push("family_achievement_progress");
        return makeFamilyCatchUpChain(familyCatchUpRows);
      }
      if (table === "family_achievement_user_notifications")
        return makeUserNotificationsChain([]);
      if (table === "achievements")
        return makeAchievementChain(makeAchievement());
      if (table === "family_achievements")
        return makeFamilyAchievementChain(makeAchievement());
      return {};
    });

    renderHook(() => useAchievementNotifications(CHAR_ID, FAMILY_ID));

    await waitFor(() =>
      expect(callOrder).toContain("family_achievement_progress"),
    );

    const recomputeIdx = callOrder.findIndex((c) =>
      c.includes("/api/family-achievements"),
    );
    const progressIdx = callOrder.indexOf("family_achievement_progress");
    expect(recomputeIdx).toBeGreaterThanOrEqual(0);
    expect(recomputeIdx).toBeLessThan(progressIdx);
  });

  it("still loads notifications when the recompute fetch fails", async () => {
    const familyCatchUpRows = [
      {
        id: FAP_ID,
        family_achievement_id: FA_ID,
        family_achievements: {
          name: "Team Effort",
          description: "Complete 50 quests as a family",
          icon: "👨‍👩‍👧‍👦",
          xp_reward: 0,
          gold_reward: 0,
        },
      },
    ];

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if ((url as string).includes("/api/family-achievements")) {
        return Promise.reject(new Error("network error"));
      }
      return Promise.resolve({ ok: true });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain(familyCatchUpRows);
      if (table === "family_achievement_user_notifications")
        return makeUserNotificationsChain([]);
      if (table === "achievements")
        return makeAchievementChain(makeAchievement());
      if (table === "family_achievements")
        return makeFamilyAchievementChain(makeAchievement());
      return {};
    });

    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.name).toBe("Team Effort");
  });

  it("does not call /api/family-achievements when familyId is null", async () => {
    renderHook(() => useAchievementNotifications(CHAR_ID, null));

    await new Promise((r) => setTimeout(r, 50));

    const recomputeCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) => url.includes("/api/family-achievements"),
    );
    expect(recomputeCalls).toHaveLength(0);
  });
});
