import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementUnlockToast } from "./AchievementUnlockToast";
import type { AchievementNotification } from "@/hooks/useAchievementNotifications";

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

const makeNotification = (
  overrides: Partial<AchievementNotification> = {},
): AchievementNotification => ({
  id: "ca-1",
  achievementId: "ach-1",
  name: "First Steps",
  description: "Complete your first quest",
  icon: "🏆",
  xpReward: 100,
  goldReward: 50,
  ...overrides,
});

describe("AchievementUnlockToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("renders achievement name and description", () => {
      render(
        <AchievementUnlockToast
          notification={makeNotification()}
          onDismiss={jest.fn()}
        />,
      );

      expect(screen.getByText("First Steps")).toBeInTheDocument();
      expect(screen.getByText("Complete your first quest")).toBeInTheDocument();
    });

    it("renders the icon", () => {
      render(
        <AchievementUnlockToast
          notification={makeNotification({ icon: "🏆" })}
          onDismiss={jest.fn()}
        />,
      );

      expect(screen.getByText("🏆")).toBeInTheDocument();
    });

    it("renders XP and gold rewards", () => {
      render(
        <AchievementUnlockToast
          notification={makeNotification({ xpReward: 100, goldReward: 50 })}
          onDismiss={jest.fn()}
        />,
      );

      expect(screen.getByText("+100 XP")).toBeInTheDocument();
      expect(screen.getByText("+50 Gold")).toBeInTheDocument();
    });

    it("hides rewards section when both are null", () => {
      render(
        <AchievementUnlockToast
          notification={makeNotification({ xpReward: null, goldReward: null })}
          onDismiss={jest.fn()}
        />,
      );

      expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gold/)).not.toBeInTheDocument();
    });

    it("renders nothing when notification is null", () => {
      const { container } = render(
        <AchievementUnlockToast notification={null} onDismiss={jest.fn()} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("renders dismiss button", () => {
      render(
        <AchievementUnlockToast
          notification={makeNotification()}
          onDismiss={jest.fn()}
        />,
      );

      expect(
        screen.getByRole("button", { name: /dismiss/i }),
      ).toBeInTheDocument();
    });
  });

  describe("auto-dismiss", () => {
    it("calls onDismiss after 5 seconds", () => {
      const onDismiss = jest.fn();
      render(
        <AchievementUnlockToast
          notification={makeNotification()}
          onDismiss={onDismiss}
        />,
      );

      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("does not call onDismiss before 5 seconds", () => {
      const onDismiss = jest.fn();
      render(
        <AchievementUnlockToast
          notification={makeNotification()}
          onDismiss={onDismiss}
        />,
      );

      act(() => {
        jest.advanceTimersByTime(4999);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("manual dismiss", () => {
    it("calls onDismiss when dismiss button is clicked", async () => {
      const onDismiss = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <AchievementUnlockToast
          notification={makeNotification()}
          onDismiss={onDismiss}
        />,
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
