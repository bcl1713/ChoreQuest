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

describe("useAchievementNotifications — catch-up query and deduplication", () => {
  it("loads unnotified achievements on mount", async () => {
    const catchUpRows = [
      {
        id: "ca-10",
        achievement_id: "ach-10",
        achievements: {
          name: "Veteran",
          description: "Complete 10 quests",
          icon: "⚔️",
          xp_reward: 200,
          gold_reward: 100,
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(catchUpRows);
      return makeAchievementChain(makeAchievement());
    });

    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));

    await waitFor(() =>
      expect(result.current.current?.achievementId).toBe("ach-10"),
    );
    expect(result.current.current?.name).toBe("Veteran");
  });

  it("deduplicates when realtime event arrives for achievement already in catch-up queue", async () => {
    const catchUpRows = [
      { id: CA_ID, achievement_id: ACH_ID, achievements: makeAchievement() },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(catchUpRows);
      return makeAchievementChain(makeAchievement());
    });

    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));
    await waitFor(() => expect(result.current.current).not.toBeNull());

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await new Promise((r) => setTimeout(r, 50));

    // Dismiss the first item — queue should now be empty (no duplicate)
    act(() => result.current.onDismiss());
    await waitFor(() => expect(result.current.current).toBeNull());
  });

  it("skips catch-up rows with no joined achievement data", async () => {
    const catchUpRows = [
      { id: "ca-bad", achievement_id: "ach-bad", achievements: null },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(catchUpRows);
      return makeAchievementChain(null);
    });

    const { result } = renderHook(() => useAchievementNotifications(CHAR_ID));

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.current).toBeNull();
  });

  it("clears queue when characterId transitions to null", async () => {
    const catchUpRows = [
      { id: CA_ID, achievement_id: ACH_ID, achievements: makeAchievement() },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(catchUpRows);
      return makeAchievementChain(makeAchievement());
    });

    const { result, rerender } = renderHook(
      ({ charId }: { charId: string | null }) =>
        useAchievementNotifications(charId),
      { initialProps: { charId: CHAR_ID } },
    );

    await waitFor(() => expect(result.current.current).not.toBeNull());

    rerender({ charId: null });

    await waitFor(() => expect(result.current.current).toBeNull());
  });

  it("calls notified API when an item becomes current", async () => {
    const catchUpRows = [
      { id: CA_ID, achievement_id: ACH_ID, achievements: makeAchievement() },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "character_achievements")
        return makeCatchUpChain(catchUpRows);
      return makeAchievementChain(makeAchievement());
    });

    renderHook(() => useAchievementNotifications(CHAR_ID));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/character-achievements/${CA_ID}/notified`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });
});
