import { renderHook, act, waitFor } from "@testing-library/react";
import type { RealtimeEvent } from "@/lib/realtime-context";
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

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ achievements: [], backfill_ok: true }),
});

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

function makeFamilyUnlockEvent(
  overrides: Partial<RealtimeEvent> = {},
): RealtimeEvent {
  return {
    type: "family_achievement_unlock_updated",
    table: "family_achievement_progress",
    action: "UPDATE",
    record: {
      id: FAP_ID,
      family_id: FAMILY_ID,
      family_achievement_id: FA_ID,
      unlocked_at: "2026-03-23",
      notified: false,
    },
    old_record: {
      id: FAP_ID,
      family_id: FAMILY_ID,
      family_achievement_id: FA_ID,
      unlocked_at: null,
      notified: false,
    },
    ...overrides,
  };
}

let _capturedIndividualListener: ((event: RealtimeEvent) => void) | null = null;
let capturedFamilyListener: ((event: RealtimeEvent) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  _capturedIndividualListener = null;
  capturedFamilyListener = null;
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ achievements: [], backfill_ok: true }),
  });

  mockOnAchievementUnlockUpdate.mockImplementation((listener) => {
    _capturedIndividualListener = listener;
    return () => {};
  });
  mockOnFamilyAchievementUnlockUpdate.mockImplementation((listener) => {
    capturedFamilyListener = listener;
    return () => {};
  });

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

describe("useAchievementNotifications — family catch-up", () => {
  it("loads unnotified family achievements on mount", async () => {
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
    expect(result.current.current?.isFamily).toBe(true);
    expect(result.current.current?.achievementId).toBe(`family_${FA_ID}`);
  });

  it("does not fetch family catch-up when familyId is null", async () => {
    renderHook(() => useAchievementNotifications(CHAR_ID, null));

    await new Promise((r) => setTimeout(r, 50));

    const familyProgressCalls = mockFrom.mock.calls.filter(
      ([table]: [string]) => table === "family_achievement_progress",
    );
    expect(familyProgressCalls).toHaveLength(0);
  });
});

describe("useAchievementNotifications — family realtime subscription", () => {
  it("subscribes to family achievement unlock events", () => {
    renderHook(() => useAchievementNotifications(CHAR_ID, FAMILY_ID));
    expect(mockOnFamilyAchievementUnlockUpdate).toHaveBeenCalled();
  });

  it("enqueues family achievement on realtime unlock event", async () => {
    const familyAchievement = {
      name: "Family Power",
      description: "All members reach level 5",
      icon: "⭐",
      xp_reward: 0,
      gold_reward: 0,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain([]);
      if (table === "achievements")
        return makeAchievementChain(makeAchievement());
      if (table === "family_achievements")
        return makeFamilyAchievementChain(familyAchievement);
      return {};
    });

    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    act(() => {
      capturedFamilyListener?.(makeFamilyUnlockEvent());
    });

    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.name).toBe("Family Power");
    expect(result.current.current?.isFamily).toBe(true);
  });

  it("ignores family events that are not unlock transitions", async () => {
    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    // Already-unlocked event (old_record has unlocked_at set)
    act(() => {
      capturedFamilyListener?.(
        makeFamilyUnlockEvent({
          old_record: {
            id: FAP_ID,
            family_id: FAMILY_ID,
            family_achievement_id: FA_ID,
            unlocked_at: "2026-03-22",
            notified: false,
          },
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });

  it("processes family unlock events regardless of notified flag on the row", async () => {
    // The shared `notified` flag on family_achievement_progress is no longer
    // used to gate realtime notifications — per-user tracking replaced it.
    // An event with notified=true should still surface to the current user.
    const familyAchievement = {
      name: "Family Power",
      description: "All members reach level 5",
      icon: "⭐",
      xp_reward: 0,
      gold_reward: 0,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain([]);
      if (table === "family_achievement_user_notifications")
        return makeUserNotificationsChain([]);
      if (table === "achievements")
        return makeAchievementChain(makeAchievement());
      if (table === "family_achievements")
        return makeFamilyAchievementChain(familyAchievement);
      return {};
    });

    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    act(() => {
      capturedFamilyListener?.(
        makeFamilyUnlockEvent({
          record: {
            id: FAP_ID,
            family_id: FAMILY_ID,
            family_achievement_id: FA_ID,
            unlocked_at: "2026-03-23",
            notified: true,
          },
        }),
      );
    });

    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.name).toBe("Family Power");
  });
});
