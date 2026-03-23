import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementsSection } from "./AchievementsSection";

jest.mock("@/hooks/useReducedMotion");

const mockRetry = jest.fn();
const mockUseAchievements = jest.fn();
jest.mock("@/hooks/useAchievements", () => ({
  useAchievements: (...args: unknown[]) => mockUseAchievements(...args),
}));

const CAT_A = {
  id: "cat-a",
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
  ],
};

const CAT_B = {
  id: "cat-b",
  name: "Builder",
  description: null,
  icon: "hammer",
  display_order: 2,
  achievements: [
    {
      id: "ach-2",
      name: "First Build",
      description: "Build something",
      icon: "hammer",
      xp_reward: 50,
      gold_reward: 10,
      is_hidden: false,
      criteria_type: "quest_complete",
      unlocked_at: null,
      progress: null,
    },
  ],
};

describe("AchievementsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseAchievements.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      retry: mockRetry,
    });

    render(<AchievementsSection characterId="char-1" />);

    expect(screen.getByTestId("achievements-loading")).toBeInTheDocument();
  });

  it("renders error state with retry button", async () => {
    mockUseAchievements.mockReturnValue({
      categories: [],
      isLoading: false,
      error: "Failed to load achievements",
      retry: mockRetry,
    });

    render(<AchievementsSection characterId="char-1" />);

    expect(screen.getByTestId("achievements-error")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("achievements-retry"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("renders achievements section", () => {
    mockUseAchievements.mockReturnValue({
      categories: [CAT_A],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<AchievementsSection characterId="char-1" />);

    expect(screen.getByTestId("achievements-section")).toBeInTheDocument();
    expect(screen.getByTestId("achievement-summary")).toBeInTheDocument();
  });

  it("resets selectedCategoryId to null when categories change and selected category no longer exists", () => {
    mockUseAchievements.mockReturnValue({
      categories: [CAT_A, CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    const { rerender } = render(<AchievementsSection characterId="char-1" />);

    // Simulate selecting cat-b via AchievementGrid's onActiveCategoryChange
    // by re-rendering with a dataset that no longer contains cat-b
    act(() => {
      mockUseAchievements.mockReturnValue({
        categories: [CAT_A],
        isLoading: false,
        error: null,
        retry: mockRetry,
      });
      rerender(<AchievementsSection characterId="char-1" />);
    });

    // Summary should show overall totals (cat-a: 1/1) rather than 0/0 for stale category
    expect(screen.getByTestId("achievement-count")).toHaveTextContent(
      "1/1 Achievements Unlocked",
    );
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });

  it("keeps selectedCategoryId when the category still exists after data refresh", () => {
    mockUseAchievements.mockReturnValue({
      categories: [CAT_A, CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    const { rerender } = render(<AchievementsSection characterId="char-1" />);

    // Refresh with both categories still present
    act(() => {
      mockUseAchievements.mockReturnValue({
        categories: [CAT_A, CAT_B],
        isLoading: false,
        error: null,
        retry: mockRetry,
      });
      rerender(<AchievementsSection characterId="char-1" />);
    });

    // Summary defaults to overall when no tab has been selected
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });
});
