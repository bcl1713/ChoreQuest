import { renderHook, act, waitFor } from "@testing-library/react";
import type { RealtimeEvent } from "@/lib/realtime-context";
import { useAchievementNotifications } from "./useAchievementNotifications";
import {
  CHAR_ID,
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

describe("useAchievementNotifications — unlock detection", () => {
  it("enqueues a notification when UPDATE transitions unlocked_at null → non-null", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await waitFor(() => expect(result.current.current).not.toBeNull());
    expect(result.current.current?.achievementId).toBe(ACH_ID);
  });

  it("ignores events where unlocked_at was already set (non-null old_record)", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(
        makeUnlockEvent({
          old_record: { id: CA_ID, unlocked_at: "2026-01-01", notified: false },
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });

  it("ignores events where notified is already true", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(
        makeUnlockEvent({
          record: {
            id: CA_ID,
            character_id: CHAR_ID,
            achievement_id: ACH_ID,
            unlocked_at: "2026-03-22",
            notified: true,
          },
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });

  it("ignores INSERT events", async () => {
    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent({ action: "INSERT" }));
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });
});
