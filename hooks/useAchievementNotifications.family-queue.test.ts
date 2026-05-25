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

describe("useAchievementNotifications — family queue integration", () => {
  it("processes individual and family notifications in the same queue", async () => {
    const individualRows = [
      {
        id: "ca-1",
        achievement_id: "ach-1",
        achievements: makeAchievement({ name: "Individual Win" }),
      },
    ];
    const familyRows = [
      {
        id: FAP_ID,
        family_achievement_id: FA_ID,
        family_achievements: {
          name: "Family Win",
          description: "desc",
          icon: null,
          xp_reward: 0,
          gold_reward: 0,
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(individualRows);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain(familyRows);
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

    // First item in queue
    const first = result.current.current;
    expect(first).not.toBeNull();

    // Dismiss first, should get the second
    act(() => result.current.onDismiss());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
      expect(result.current.current?.achievementId).not.toBe(
        first?.achievementId,
      );
    });
  });

  it("deduplicates family achievements between catch-up and realtime", async () => {
    const familyRows = [
      {
        id: FAP_ID,
        family_achievement_id: FA_ID,
        family_achievements: {
          name: "Family Win",
          description: "desc",
          icon: null,
          xp_reward: 0,
          gold_reward: 0,
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain(familyRows);
      if (table === "family_achievement_user_notifications")
        return makeUserNotificationsChain([]);
      if (table === "family_achievements")
        return makeFamilyAchievementChain(makeAchievement());
      return {};
    });

    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    await waitFor(() => expect(result.current.current).not.toBeNull());

    // Fire realtime event for same family achievement
    act(() => {
      capturedFamilyListener?.(makeFamilyUnlockEvent());
    });

    await new Promise((r) => setTimeout(r, 50));

    // Dismiss the first — should be empty (no duplicate)
    act(() => result.current.onDismiss());
    await waitFor(() => expect(result.current.current).toBeNull());
  });

  it("calls family notified API for family achievement notifications", async () => {
    const familyRows = [
      {
        id: FAP_ID,
        family_achievement_id: FA_ID,
        family_achievements: {
          name: "Family Win",
          description: "desc",
          icon: null,
          xp_reward: 0,
          gold_reward: 0,
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "family_achievement_progress")
        return makeFamilyCatchUpChain(familyRows);
      if (table === "family_achievement_user_notifications")
        return makeUserNotificationsChain([]);
      if (table === "family_achievements")
        return makeFamilyAchievementChain(makeAchievement());
      return {};
    });

    renderHook(() => useAchievementNotifications(CHAR_ID, FAMILY_ID));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/family-achievement-progress/${FAP_ID}/notified`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});
