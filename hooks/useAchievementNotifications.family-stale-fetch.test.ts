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
const FAMILY_ID_2 = "family-2";
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

  mockOnAchievementUnlockUpdate.mockImplementation((listener) => {
    void listener;
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
    return {};
  });
});

describe("useAchievementNotifications — family stale fetch guard", () => {
  it("discards in-flight fetch when family changes before fetch resolves", async () => {
    let resolveFamilyFetch!: (data: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolveFamilyFetch = resolve;
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
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnValue(pendingFetch),
        };
      return {};
    });

    const { result, rerender } = renderHook(
      ({ familyId }: { familyId: string | null }) =>
        useAchievementNotifications(CHAR_ID, familyId),
      { initialProps: { familyId: FAMILY_ID } },
    );

    await waitFor(() =>
      expect(mockOnFamilyAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    // Fire unlock event — starts async fetch but doesn't resolve yet
    act(() => {
      capturedFamilyListener?.(makeFamilyUnlockEvent());
    });

    // Switch to a different family before the fetch resolves
    rerender({ familyId: FAMILY_ID_2 });

    // Resolve the fetch for the old family
    act(() => {
      resolveFamilyFetch({
        data: {
          name: "Old Family Achievement",
          description: "desc",
          icon: null,
          xp_reward: 0,
          gold_reward: 0,
        },
        error: null,
      });
    });

    await new Promise((r) => setTimeout(r, 50));

    // Stale result from the old family must not appear
    expect(result.current.current).toBeNull();
  });
});
