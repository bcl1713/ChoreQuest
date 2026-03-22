import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import type { RealtimeEvent } from "@/lib/realtime-context";
import { AchievementNotificationManager } from "./AchievementNotificationManager";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.PropsWithChildren<{
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }>) => {
      void initial;
      void animate;
      void exit;
      void transition;
      return (
        <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>
          {children}
        </div>
      );
    },
  },
}));

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHAR_ID = "char-1";
const ACH_ID = "ach-1";
const CA_ID = "ca-1";

function makeUnlockEvent(
  overrides: Partial<RealtimeEvent> = {},
): RealtimeEvent {
  return {
    type: "achievement_unlock_updated",
    table: "character_achievements",
    action: "UPDATE",
    record: {
      id: CA_ID,
      character_id: CHAR_ID,
      achievement_id: ACH_ID,
      unlocked_at: "2026-03-22",
      notified: false,
    },
    old_record: {
      id: CA_ID,
      character_id: CHAR_ID,
      achievement_id: ACH_ID,
      unlocked_at: null,
      notified: false,
    },
    ...overrides,
  };
}

const ACHIEVEMENT_DATA = {
  name: "First Steps",
  description: "Complete your first quest",
  icon: "🏆",
  xp_reward: 100,
  gold_reward: 50,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

let capturedListener: ((event: RealtimeEvent) => void) | null = null;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  capturedListener = null;
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

  mockOnAchievementUnlockUpdate.mockImplementation((listener) => {
    capturedListener = listener;
    return () => {};
  });

  mockFrom.mockImplementation((table: string) => {
    if (table === "character_achievements") {
      const resolvedChain = {
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnValue(resolvedChain),
      };
    }
    if (table === "achievements") {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: ACHIEVEMENT_DATA, error: null }),
      };
    }
    return {};
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("AchievementNotificationManager — integration", () => {
  it("renders a toast when a realtime unlock event arrives", async () => {
    render(<AchievementNotificationManager characterId={CHAR_ID} />);

    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await waitFor(() =>
      expect(screen.getByText("First Steps")).toBeInTheDocument(),
    );
    expect(screen.getByText("Complete your first quest")).toBeInTheDocument();
    expect(screen.getByText("+100 XP")).toBeInTheDocument();
    expect(screen.getByText("+50 Gold")).toBeInTheDocument();
  });

  it("calls notified API when toast is displayed", async () => {
    render(<AchievementNotificationManager characterId={CHAR_ID} />);

    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/character-achievements/${CA_ID}/notified`,
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
  });

  it("auto-dismisses toast after 5 seconds", async () => {
    render(<AchievementNotificationManager characterId={CHAR_ID} />);

    await waitFor(() =>
      expect(mockOnAchievementUnlockUpdate).toHaveBeenCalled(),
    );

    act(() => {
      capturedListener?.(makeUnlockEvent());
    });

    await waitFor(() =>
      expect(screen.getByText("First Steps")).toBeInTheDocument(),
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() =>
      expect(screen.queryByText("First Steps")).not.toBeInTheDocument(),
    );
  });

  it("renders nothing when characterId is null", () => {
    render(<AchievementNotificationManager characterId={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
