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

let capturedFamilyListener: ((event: RealtimeEvent) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  capturedFamilyListener = null;
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ achievements: [], backfill_ok: true }),
  });

  mockOnAchievementUnlockUpdate.mockImplementation(() => () => {});
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

describe("useAchievementNotifications — family re-lock/re-unlock", () => {
  it("calls markNotified again after the same progress row is re-locked then re-unlocked", async () => {
    // Mount with empty catch-up so the first notification comes via realtime.
    const { result } = renderHook(() =>
      useAchievementNotifications(CHAR_ID, FAMILY_ID),
    );

    await waitFor(() => expect(result.current.current).toBeNull());

    // First unlock (null → non-null): markNotified fires and sets prevCurrentIdRef.
    act(() => {
      capturedFamilyListener?.(makeFamilyUnlockEvent());
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/family-achievement-progress/${FAP_ID}/notified`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );

    act(() => result.current.onDismiss());
    await waitFor(() => expect(result.current.current).toBeNull());

    const callsAfterFirst = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) =>
        url === `/api/family-achievement-progress/${FAP_ID}/notified`,
    ).length;

    // Re-lock (non-null → null): prevCurrentIdRef must be cleared.
    act(() => {
      capturedFamilyListener?.(
        makeFamilyUnlockEvent({
          record: {
            id: FAP_ID,
            family_id: FAMILY_ID,
            family_achievement_id: FA_ID,
            unlocked_at: null,
            notified: false,
          },
          old_record: {
            id: FAP_ID,
            family_id: FAMILY_ID,
            family_achievement_id: FA_ID,
            unlocked_at: "2026-03-23",
            notified: false,
          },
        }),
      );
    });

    // Re-unlock (null → non-null) with the same progress id: markNotified must fire again.
    act(() => {
      capturedFamilyListener?.(makeFamilyUnlockEvent());
    });

    await waitFor(() => {
      const total = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) =>
          url === `/api/family-achievement-progress/${FAP_ID}/notified`,
      ).length;
      expect(total).toBeGreaterThan(callsAfterFirst);
    });
  });
});
