import { render, screen, waitFor } from "@testing-library/react";
import { QuestCompleteOverlay, QuestReward } from "./QuestCompleteOverlay";
import { useReducedMotion } from "@/hooks/useReducedMotion";

jest.mock("@/hooks/useReducedMotion");
jest.mock("./ParticleEffect", () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe("QuestCompleteOverlay - auto-dismiss and effects", () => {
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

  describe("Auto-dismiss", () => {
    it("should auto-dismiss after duration", async () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={2000}
        />,
      );

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      });
    });

    it("should not auto-dismiss when autoDismissDuration is 0", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={0}
        />,
      );

      jest.advanceTimersByTime(10000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe("Particle Effects", () => {
    it("should render particle effects when not reduced motion", () => {
      (useReducedMotion as jest.Mock).mockReturnValue(false);
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByTestId("particle-effect")).toBeInTheDocument();
    });

    it("should still render particle effects when reduced motion is enabled", () => {
      (useReducedMotion as jest.Mock).mockReturnValue(true);
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      // ParticleEffect is always rendered when show is true;
      // reduced motion only affects the modal animation variants
      expect(screen.getByTestId("particle-effect")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render as a dialog for screen readers", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should include aria-modal attribute on dialog", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });
});
