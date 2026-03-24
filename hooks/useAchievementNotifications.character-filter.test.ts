import { renderHook, act, waitFor } from "@testing-library/react";
import type { RealtimeEvent } from "@/lib/realtime-context";
import { useAchievementNotifications } from "./useAchievementNotifications";
import {
  CHAR_ID,
  OTHER_CHAR_ID,
  ACH_ID,
  CA_ID,
  makeAchievement,
  makeUnlockEvent,
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

function makeFamilyCatchUpChain(rows: unknown[] = []) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockResolvedValue({ data: rows, error: null }),
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

const mockOnAchievementUnlockUpdate = jest.fn();
const mockOnFamilyAchievementUnlockUpdate = jest.fn();
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onAchievementUnlockUpdate: mockOnAchievementUnlockUpdate,
    onFamilyAchievementUnlockUpdate: mockOnFamilyAchievementUnlockUpdate,
  }),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

let capturedListener: ((event: RealtimeEvent) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  capturedListener = null;
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  mockOnAchievementUnlockUpdate.mockImplementation((listener) => {
    capturedListener = listener;
    return () => {};
  });
  mockFrom.mockImplementation((table: string) => {
    if (table === "character_achievements") return makeCatchUpChain([]);
    if (table === "achievements")
      return makeAchievementChain(makeAchievement());
    return {};
  });
});

describe("useAchievementNotifications — character-scoped filtering", () => {
  it("ignores realtime events for a different character", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(
        makeUnlockEvent({
          record: {
            id: "ca-other",
            character_id: OTHER_CHAR_ID,
            achievement_id: ACH_ID,
            unlocked_at: "2026-03-22",
            notified: false,
          },
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });

  it("only shows events for the current character", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      // Event for current character — should enqueue
      capturedListener?.(makeUnlockEvent());
      // Event for other character — should be ignored
      capturedListener?.(
        makeUnlockEvent({
          record: {
            id: "ca-other",
            character_id: OTHER_CHAR_ID,
            achievement_id: "ach-other",
            unlocked_at: "2026-03-22",
            notified: false,
          },
        }),
      );
    });

    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.id).toBe(CA_ID);

    // After dismiss, nothing more to show
    act(() => result.current.onDismiss());
    await waitFor(() => expect(result.current.current).toBeNull());
  });

  it("clears queue and re-runs catch-up when character changes", async () => {
    let currentCharId = CHAR_ID;
    const catchUpRows = [
      { id: CA_ID, achievement_id: ACH_ID, achievements: makeAchievement() },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(currentCharId === CHAR_ID ? catchUpRows : []);
      return makeAchievementChain(makeAchievement());
    });

    const { result, rerender } = renderHook(
      ({ charId }) => useAchievementNotifications(charId),
      { initialProps: { charId: CHAR_ID } },
    );

    await waitFor(() => expect(result.current.current).not.toBeNull());

    currentCharId = "char-2";
    rerender({ charId: "char-2" });

    await waitFor(() => expect(result.current.current).toBeNull());
  });

  it("does not subscribe when characterId is null", () => {
    renderHook(() => useAchievementNotifications(null));
    expect(mockOnAchievementUnlockUpdate).not.toHaveBeenCalled();
  });

  it("preserves pending family notifications when characterId changes within the same family", async () => {
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

    const { result, rerender } = renderHook(
      ({ charId }: { charId: string }) =>
        useAchievementNotifications(charId, FAMILY_ID),
      { initialProps: { charId: CHAR_ID } },
    );

    await waitFor(() => expect(result.current.current?.isFamily).toBe(true));

    // Switch to a different character within the same family
    rerender({ charId: OTHER_CHAR_ID });

    // Family notification must survive the character switch
    expect(result.current.current?.isFamily).toBe(true);
    expect(result.current.current?.achievementId).toBe(`family_${FA_ID}`);
  });

  it("discards in-flight fetch results when character changes before fetch resolves", async () => {
    let resolveAchievementFetch!: (data: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolveAchievementFetch = resolve;
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements") return makeCatchUpChain([]);
      if (table === "achievements")
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnValue(pendingFetch),
        };
      return {};
    });

    const { result, rerender } = renderHook(
      ({ charId }: { charId: string | null }) =>
        useAchievementNotifications(charId),
      { initialProps: { charId: CHAR_ID } },
    );

    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    // Fire unlock event for CHAR_ID — starts the async fetch but doesn't resolve yet
    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    // Switch to a different character before fetch resolves
    rerender({ charId: null });

    // Now resolve the fetch for the old character
    act(() => {
      resolveAchievementFetch({ data: makeAchievement(), error: null });
    });

    await new Promise((r) => setTimeout(r, 50));

    // The stale result must not appear in the queue
    expect(result.current.current).toBeNull();
  });
});
