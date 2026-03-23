import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementDetailModal } from "./AchievementDetailModal";
import type { AchievementDisplay } from "@/hooks/useAchievements";

jest.mock("@/hooks/useReducedMotion");

function makeAchievement(
  overrides: Partial<AchievementDisplay> = {},
): AchievementDisplay {
  return {
    id: "ach-1",
    name: "First Quest",
    description: "Complete your first quest",
    icon: "sword",
    xp_reward: 50,
    gold_reward: 10,
    is_hidden: false,
    criteria_type: "quest_complete",
    unlocked_at: null,
    progress: null,
    ...overrides,
  };
}

describe("AchievementDetailModal", () => {
  it("renders nothing when achievement is null", () => {
    const { container } = render(
      <AchievementDetailModal achievement={null} onClose={jest.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders unlocked achievement with name, description, rewards, and unlock date", () => {
    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Complete your first quest")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText("+10 Gold")).toBeInTheDocument();
    expect(screen.getByTestId("achievement-unlock-date")).toBeInTheDocument();
  });

  it("renders locked achievement with rewards but no unlock date", () => {
    render(
      <AchievementDetailModal
        achievement={makeAchievement()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText("+10 Gold")).toBeInTheDocument();
    expect(
      screen.queryByTestId("achievement-unlock-date"),
    ).not.toBeInTheDocument();
  });

  it("renders locked achievement with progress bar", () => {
    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          progress: { current: 25, threshold: 50 },
        })}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("25 / 50")).toBeInTheDocument();
  });

  it("renders hidden locked achievement with ??? and no rewards", () => {
    render(
      <AchievementDetailModal
        achievement={makeAchievement({ is_hidden: true })}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("???")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This achievement is hidden. Keep playing to discover it!",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("+50 XP")).not.toBeInTheDocument();
    expect(screen.queryByText("+10 Gold")).not.toBeInTheDocument();
    expect(screen.queryByText("First Quest")).not.toBeInTheDocument();
  });

  it("renders hidden unlocked achievement with full details and rewards", () => {
    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          is_hidden: true,
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Complete your first quest")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText("+10 Gold")).toBeInTheDocument();
    expect(screen.queryByText("???")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId("achievement-detail-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId("achievement-detail-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when modal content is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <AchievementDetailModal
        achievement={makeAchievement({
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId("achievement-detail-modal"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
