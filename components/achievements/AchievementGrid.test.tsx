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

  it("shows category tabs with completion counts", () => {
    render(<AchievementGrid categories={MOCK_CATEGORIES} />);

    // Tab labels include unlocked/total counts (visible on all screen sizes)
    // Adventurer: 1 unlocked (ach-1), 2 total (both non-hidden)
    // Wealth: 0 unlocked, 1 total
    // All: 1 unlocked, 3 total
    expect(screen.getAllByText("All (1/3)")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Adventurer (1/2)")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Wealth (0/1)")[0]).toBeInTheDocument();
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

  it("calls onActiveCategoryChange when switching tabs", async () => {
    const user = userEvent.setup();
    const onCategoryChange = jest.fn();
    render(
      <AchievementGrid
        categories={MOCK_CATEGORIES}
        onActiveCategoryChange={onCategoryChange}
      />,
    );

    await user.click(screen.getByTestId("achievement-tab-cat-2"));
    expect(onCategoryChange).toHaveBeenCalledWith("cat-2");

    await user.click(screen.getByTestId("achievement-tab-all"));
    expect(onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("excludes locked hidden achievements from completion total", () => {
    const categoriesWithHidden: AchievementCategory[] = [
      {
        id: "cat-h",
        name: "Secrets",
        description: null,
        icon: null,
        display_order: 1,
        achievements: [
          {
            id: "visible-1",
            name: "Normal",
            description: "A normal achievement",
            icon: null,
            xp_reward: 10,
            gold_reward: 0,
            is_hidden: false,
            criteria_type: "test",
            unlocked_at: "2026-03-20T10:00:00Z",
            progress: null,
          },
          {
            id: "hidden-locked",
            name: "???",
            description: "???",
            icon: null,
            xp_reward: 10,
            gold_reward: 0,
            is_hidden: true,
            criteria_type: "test",
            unlocked_at: null,
            progress: null,
          },
          {
            id: "hidden-unlocked",
            name: "Secret Found",
            description: "Found a secret",
            icon: null,
            xp_reward: 10,
            gold_reward: 0,
            is_hidden: true,
            criteria_type: "test",
            unlocked_at: "2026-03-20T10:00:00Z",
            progress: null,
          },
        ],
      },
    ];
    render(<AchievementGrid categories={categoriesWithHidden} />);

    // 2 unlocked (visible-1 + hidden-unlocked), 2 total (excludes locked hidden)
    expect(screen.getAllByText("All (2/2)")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Secrets (2/2)")[0]).toBeInTheDocument();
  });

  it("resets to All tab when the active category is removed from categories", async () => {
    const user = userEvent.setup();
    const onCategoryChange = jest.fn();
    const { rerender } = render(
      <AchievementGrid
        categories={MOCK_CATEGORIES}
        onActiveCategoryChange={onCategoryChange}
      />,
    );

    // Select cat-2 (Wealth)
    await user.click(screen.getByTestId("achievement-tab-cat-2"));
    expect(onCategoryChange).toHaveBeenLastCalledWith("cat-2");

    // Re-render with cat-2 removed
    rerender(
      <AchievementGrid
        categories={[MOCK_CATEGORIES[0]]}
        onActiveCategoryChange={onCategoryChange}
      />,
    );

    // Should auto-reset to All and call the callback with null
    expect(screen.getByTestId("achievement-tab-all")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onCategoryChange).toHaveBeenLastCalledWith(null);

    // Remaining achievements should be visible
    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.queryByText("Rich Adventurer")).not.toBeInTheDocument();
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
