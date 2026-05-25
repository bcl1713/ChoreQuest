import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementBadge, getAchievementState } from "./AchievementBadge";
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

describe("getAchievementState", () => {
  it("returns 'unlocked' when unlocked_at is set", () => {
    expect(
      getAchievementState(
        makeAchievement({ unlocked_at: "2026-03-20T10:00:00Z" }),
      ),
    ).toBe("unlocked");
  });

  it("returns 'unlocked' for hidden achievements that are unlocked", () => {
    expect(
      getAchievementState(
        makeAchievement({
          is_hidden: true,
          unlocked_at: "2026-03-20T10:00:00Z",
        }),
      ),
    ).toBe("unlocked");
  });

  it("returns 'hidden' for hidden achievements that are locked", () => {
    expect(getAchievementState(makeAchievement({ is_hidden: true }))).toBe(
      "hidden",
    );
  });

  it("returns 'locked-progress' when progress exists with current > 0", () => {
    expect(
      getAchievementState(
        makeAchievement({ progress: { current: 5, threshold: 10 } }),
      ),
    ).toBe("locked-progress");
  });

  it("returns 'locked' when no progress and not hidden", () => {
    expect(getAchievementState(makeAchievement())).toBe("locked");
  });

  it("returns 'locked' when progress current is 0", () => {
    expect(
      getAchievementState(
        makeAchievement({ progress: { current: 0, threshold: 10 } }),
      ),
    ).toBe("locked");
  });
});

describe("AchievementBadge", () => {
  it("renders unlocked state with gold styling and achievement name", () => {
    render(
      <AchievementBadge
        achievement={makeAchievement({
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Complete your first quest")).toBeInTheDocument();
  });

  it("renders locked state with dimmed styling", () => {
    const { container } = render(
      <AchievementBadge achievement={makeAchievement()} />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    // Should have opacity-50 class for dimmed state
    const card = container.querySelector(
      '[data-testid="achievement-badge-ach-1"]',
    );
    expect(card?.className).toContain("opacity-50");
  });

  it("renders locked-progress state with progress bar", () => {
    render(
      <AchievementBadge
        achievement={makeAchievement({
          progress: { current: 5, threshold: 10 },
        })}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    // Progress bar shows values
    expect(screen.getByText("5 / 10")).toBeInTheDocument();
  });

  it("renders hidden state with ??? and obscured description", () => {
    render(
      <AchievementBadge achievement={makeAchievement({ is_hidden: true })} />,
    );

    expect(screen.getByText("???")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This achievement is hidden. Keep playing to discover it!",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("First Quest")).not.toBeInTheDocument();
  });

  it("renders hidden-unlocked as normal unlocked with full name", () => {
    render(
      <AchievementBadge
        achievement={makeAchievement({
          is_hidden: true,
          unlocked_at: "2026-03-20T10:00:00Z",
        })}
      />,
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.queryByText("???")).not.toBeInTheDocument();
  });

  it("calls onClick when badge is clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const achievement = makeAchievement({
      unlocked_at: "2026-03-20T10:00:00Z",
    });

    render(<AchievementBadge achievement={achievement} onClick={onClick} />);

    const badge = screen.getByTestId("achievement-badge-ach-1");
    await user.click(badge);

    expect(onClick).toHaveBeenCalledWith(achievement);
  });

  it("does not show progress bar for locked achievements without progress", () => {
    render(<AchievementBadge achievement={makeAchievement()} />);

    // No progress values should be displayed
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });
});
