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

const mockFrom = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: { access_token: "tok" } } }),
    },
  },
}));

const mockOnAchievementUnlockUpdate = jest.fn();
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onAchievementUnlockUpdate: mockOnAchievementUnlockUpdate,
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
