import { renderHook, act, waitFor } from "@testing-library/react";
import type { RealtimeEvent } from "@/lib/realtime-context";
import { useAchievementNotifications } from "./useAchievementNotifications";
import {
  CHAR_ID,
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

describe("useAchievementNotifications — queue management", () => {
  it("shows one notification at a time and advances on dismiss", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(
        makeUnlockEvent({
          record: {
            id: "ca-1",
            character_id: CHAR_ID,
            achievement_id: "ach-1",
            unlocked_at: "2026-03-22",
            notified: false,
          },
        }),
      );
      capturedListener?.(
        makeUnlockEvent({
          record: {
            id: "ca-2",
            character_id: CHAR_ID,
            achievement_id: "ach-2",
            unlocked_at: "2026-03-22",
            notified: false,
          },
          old_record: { id: "ca-2", unlocked_at: null, notified: false },
        }),
      );
    });

    await waitFor(() => expect(result.current.current?.id).toBe("ca-1"));

    act(() => {
      result.current.onDismiss();
    });

    await waitFor(() => expect(result.current.current?.id).toBe("ca-2"));
  });

  it("returns null when queue is empty", () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    expect(result.current.current).toBeNull();
  });

  it("calls unsubscribe on unmount", async () => {
    const unsubscribe = jest.fn();
    mockOnAchievementUnlockUpdate.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("queue is empty after dismissing the last notification", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await waitFor(() => expect(result.current.current).not.toBeNull());

    act(() => {
      result.current.onDismiss();
    });

    await waitFor(() => expect(result.current.current).toBeNull());
  });
});
