import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementGrid } from "./AchievementGrid";
import type { AchievementCategory } from "@/hooks/useAchievements";

jest.mock("@/hooks/useReducedMotion");

const MOCK_CATEGORIES: AchievementCategory[] = [
  {
    id: "cat-1",
    name: "Adventurer",
    description: "Quest achievements",
    icon: "sword",
    display_order: 1,
    achievements: [
      {
        id: "ach-1",
        name: "First Quest",
        description: "Complete your first quest",
        icon: "sword",
        xp_reward: 50,
        gold_reward: 10,
        is_hidden: false,
        criteria_type: "quest_complete",
        unlocked_at: "2026-03-20T10:00:00Z",
        progress: null,
      },
      {
        id: "ach-2",
        name: "Quest Master",
        description: "Complete 50 quests",
        icon: "sword",
        xp_reward: 200,
        gold_reward: 50,
        is_hidden: false,
        criteria_type: "quest_complete",
        unlocked_at: null,
        progress: { current: 25, threshold: 50 },
      },
    ],
  },
  {
    id: "cat-2",
    name: "Wealth",
    description: "Gold achievements",
    icon: "coins",
    display_order: 2,
    achievements: [
      {
        id: "ach-3",
        name: "Rich Adventurer",
        description: "Earn 1000 gold",
        icon: "coins",
        xp_reward: 100,
        gold_reward: 25,
        is_hidden: false,
        criteria_type: "gold_earned",
        unlocked_at: null,
        progress: null,
      },
    ],
  },
];

describe("AchievementGrid", () => {
  it("renders all achievements by default with 'All' tab active", () => {
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    // All tab should be active
    const allTab = screen.getByTestId("achievement-tab-all");
    expect(allTab).toHaveAttribute("aria-selected", "true");

    // All 3 achievements visible
    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Quest Master")).toBeInTheDocument();
    expect(screen.getByText("Rich Adventurer")).toBeInTheDocument();
  });

  it("shows category tabs with achievement counts", () => {
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    // Tab labels include counts (visible on larger screens)
    expect(screen.getByText("All (3)")).toBeInTheDocument();
    expect(screen.getByText("Adventurer (2)")).toBeInTheDocument();
    expect(screen.getByText("Wealth (1)")).toBeInTheDocument();
  });

  it("filters achievements when a category tab is clicked", async () => {
    const user = userEvent.setup();
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    // Click the Wealth tab
    const wealthTab = screen.getByTestId("achievement-tab-cat-2");
    await user.click(wealthTab);

    // Only Wealth achievements should be visible
    expect(screen.getByText("Rich Adventurer")).toBeInTheDocument();
    expect(screen.queryByText("First Quest")).not.toBeInTheDocument();
    expect(screen.queryByText("Quest Master")).not.toBeInTheDocument();
  });

  it("shows all achievements when clicking back to All tab", async () => {
    const user = userEvent.setup();
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    // Click Wealth tab first
    await user.click(screen.getByTestId("achievement-tab-cat-2"));
    expect(screen.queryByText("First Quest")).not.toBeInTheDocument();

    // Click All tab
    await user.click(screen.getByTestId("achievement-tab-all"));
    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Rich Adventurer")).toBeInTheDocument();
  });

  it("maintains category ordering from display_order", () => {
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    const tabs = screen.getAllByRole("tab");
    // All tab first, then Adventurer, then Wealth
    expect(tabs[0]).toHaveTextContent("All");
    expect(tabs[1]).toHaveTextContent("Adventurer");
    expect(tabs[2]).toHaveTextContent("Wealth");
  });

  it("calls onBadgeClick when an achievement badge is clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <AchievementGrid categories={MOCK_CATEGORIES} onBadgeClick={onClick} />,
    );

    await user.click(screen.getByTestId("achievement-badge-ach-1"));
    expect(onClick).toHaveBeenCalledWith(MOCK_CATEGORIES[0].achievements[0]);
  });

  it("shows empty state when category has no achievements", async () => {
    const user = userEvent.setup();
    const emptyCategory: AchievementCategory[] = [
      {
        id: "cat-empty",
        name: "Empty",
        description: null,
        icon: null,
        display_order: 1,
        achievements: [],
      },
    ];
    render(<AchievementGrid categories={emptyCategory} />);

    await user.click(screen.getByTestId("achievement-tab-cat-empty"));
    expect(
      screen.getByText("No achievements in this category."),
    ).toBeInTheDocument();
  });
});
