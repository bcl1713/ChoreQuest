import { render, screen } from "@testing-library/react";
import { QuestCompleteOverlay, QuestReward } from "./QuestCompleteOverlay";
import { useReducedMotion } from "@/hooks/useReducedMotion";

jest.mock("@/hooks/useReducedMotion");
jest.mock("./ParticleEffect", () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe("QuestCompleteOverlay - visibility and title", () => {
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

  describe("Visibility", () => {
    it("should render when show is true", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("Quest Complete!")).toBeInTheDocument();
    });

    it("should not render when show is false", () => {
      render(
        <QuestCompleteOverlay
          show={false}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.queryByText("Quest Complete!")).not.toBeInTheDocument();
    });
  });

  describe("Quest Title", () => {
    it("should display default quest title", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("Quest Complete!")).toBeInTheDocument();
    });

    it("should display custom quest title", () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          questTitle="Dragon Slayer"
        />,
      );

      expect(screen.getByText("Dragon Slayer")).toBeInTheDocument();
    });
  });
});
