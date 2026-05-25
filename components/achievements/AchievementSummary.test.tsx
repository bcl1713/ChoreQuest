import React from "react";
import { render, screen } from "@testing-library/react";
import { AchievementSummary } from "./AchievementSummary";
import type { AchievementCategory } from "@/hooks/useAchievements";

jest.mock("@/hooks/useReducedMotion");

const MOCK_CATEGORIES: AchievementCategory[] = [
  {
    id: "cat-1",
    name: "Adventurer",
    description: null,
    icon: "sword",
    display_order: 1,
    achievements: [
      {
        id: "ach-1",
        name: "First Quest",
        description: "Complete first quest",
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
    name: "Secret",
    description: null,
    icon: "eye-off",
    display_order: 6,
    achievements: [
      {
        id: "ach-3",
        name: "Hidden Gem",
        description: "Find the gem",
        icon: "eye-off",
        xp_reward: 100,
        gold_reward: 25,
        is_hidden: true,
        criteria_type: "quest_complete",
        unlocked_at: null,
        progress: null,
      },
      {
        id: "ach-4",
        name: "Revealed Secret",
        description: "Discovered a secret",
        icon: "eye-off",
        xp_reward: 100,
        gold_reward: 25,
        is_hidden: true,
        criteria_type: "quest_complete",
        unlocked_at: "2026-03-21T10:00:00Z",
        progress: null,
      },
    ],
  },
];

describe("AchievementSummary", () => {
  it("displays correct unlock count and total", () => {
    render(<AchievementSummary categories={MOCK_CATEGORIES} />);

    // Unlocked: ach-1 + ach-4 = 2
    // Total: ach-1 (non-hidden) + ach-2 (non-hidden) + ach-4 (hidden but unlocked) = 3
    // ach-3 is hidden and locked, excluded from total
    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "2/3 Achievements Unlocked",
    );
  });

  it("excludes locked hidden achievements from total count", () => {
    const categoriesWithOnlyHiddenLocked: AchievementCategory[] = [
      {
        id: "cat-1",
        name: "Secret",
        description: null,
        icon: "eye-off",
        display_order: 1,
        achievements: [
          {
            id: "ach-hidden",
            name: "Hidden",
            description: "Hidden",
            icon: null,
            xp_reward: 0,
            gold_reward: 0,
            is_hidden: true,
            criteria_type: "quest_complete",
            unlocked_at: null,
            progress: null,
          },
        ],
      },
    ];

    render(<AchievementSummary categories={categoriesWithOnlyHiddenLocked} />);

    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "0/0 Achievements Unlocked",
    );
  });

  it("includes unlocked hidden achievements in both unlocked and total", () => {
    const categoriesWithUnlockedHidden: AchievementCategory[] = [
      {
        id: "cat-1",
        name: "Secret",
        description: null,
        icon: "eye-off",
        display_order: 1,
        achievements: [
          {
            id: "ach-hidden-unlocked",
            name: "Found It",
            description: "Found",
            icon: null,
            xp_reward: 0,
            gold_reward: 0,
            is_hidden: true,
            criteria_type: "quest_complete",
            unlocked_at: "2026-03-20T10:00:00Z",
            progress: null,
          },
        ],
      },
    ];

    render(<AchievementSummary categories={categoriesWithUnlockedHidden} />);

    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "1/1 Achievements Unlocked",
    );
  });

  it("renders the summary component with progress bar", () => {
    render(<AchievementSummary categories={MOCK_CATEGORIES} />);

    expect(screen.getByTestId("achievement-summary")).toBeInTheDocument();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });

  it("handles empty categories", () => {
    render(<AchievementSummary categories={[]} />);

    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "0/0 Achievements Unlocked",
    );
  });

  it("shows category-scoped counts when selectedCategoryId is set", () => {
    render(
      <AchievementSummary
        categories={MOCK_CATEGORIES}
        selectedCategoryId="cat-1"
      />,
    );

    // cat-1 (Adventurer): 1 unlocked (ach-1), 2 total (ach-1 + ach-2)
    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "1/2 Achievements Unlocked",
    );
    expect(screen.getByText("Adventurer")).toBeInTheDocument();
  });

  it("shows all counts when selectedCategoryId is null", () => {
    render(
      <AchievementSummary
        categories={MOCK_CATEGORIES}
        selectedCategoryId={null}
      />,
    );

    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "2/3 Achievements Unlocked",
    );
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });
});
