import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestCompleteOverlay, QuestReward } from "./QuestCompleteOverlay";
import { useReducedMotion } from "@/hooks/useReducedMotion";

jest.mock("@/hooks/useReducedMotion");
jest.mock("./ParticleEffect", () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe("QuestCompleteOverlay - rewards and interactions", () => {
  const mockOnDismiss = jest.fn();
  const defaultRewards: QuestReward = {
    gold: 100,
    xp: 50,
    gems: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Rewards Display", () => {
    it("should display rewards correctly", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText(/100 Gold/)).toBeInTheDocument();
      expect(screen.getByText(/50 XP/)).toBeInTheDocument();
      expect(screen.getByText(/5 Gems/)).toBeInTheDocument();
    });

    it("should not render reward rows when rewards are zero", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={{ gold: 0, xp: 0, gems: 0 }}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.queryByText(/Gold/)).not.toBeInTheDocument();
      expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gems/)).not.toBeInTheDocument();
    });

    it("should display custom reward when provided", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={{ customReward: "Special Trophy" }}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("Special Trophy")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    it("should call onDismiss when button clicked", async () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /Continue/i });
      await user.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not render button when show is false", () => {
      render(
        <QuestCompleteOverlay
          show={false}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Continue/i }),
      ).not.toBeInTheDocument();
    });

    it("should call onDismiss on each click", async () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /Continue/i });
      await user.click(closeButton);
      await user.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(2);
    });

    it("should handle keyboard interaction", async () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /Continue/i });
      closeButton.focus();
      await user.keyboard("{Enter}");

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should render the continue button when overlay is shown", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Continue/i }),
      ).toBeInTheDocument();
    });
  });
});
