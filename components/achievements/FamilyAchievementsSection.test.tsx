import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FamilyAchievementsSection } from "./FamilyAchievementsSection";

jest.mock("@/hooks/useReducedMotion");

const mockRetry = jest.fn();
const mockUseFamilyAchievements = jest.fn();
jest.mock("@/hooks/useFamilyAchievements", () => ({
  useFamilyAchievements: (...args: unknown[]) =>
    mockUseFamilyAchievements(...args),
}));

const CAT_A = {
  id: "cat-a",
  name: "Teamwork",
  icon: "star",
  display_order: 1,
  achievements: [
    {
      id: "fa-1",
      name: "Team Effort",
      description: "Complete 50 quests as a family",
      icon: "sword",
      xp_reward: 0,
      gold_reward: 0,
      is_hidden: false,
      criteria_type: "quest_complete",
      unlocked_at: "2026-03-20T10:00:00Z",
      progress: { current: 50, threshold: 50 },
      category: {
        id: "cat-a",
        name: "Teamwork",
        icon: "star",
        display_order: 1,
      },
    },
  ],
};

const CAT_B = {
  id: "cat-b",
  name: "Growth",
  icon: "flame",
  display_order: 2,
  achievements: [
    {
      id: "fa-2",
      name: "All Level 5",
      description: "All members reach level 5",
      icon: "shield",
      xp_reward: 0,
      gold_reward: 0,
      is_hidden: false,
      criteria_type: "level_reached",
      unlocked_at: null,
      progress: { current: 3, threshold: 5 },
      category: {
        id: "cat-b",
        name: "Growth",
        icon: "flame",
        display_order: 2,
      },
    },
  ],
};

describe("FamilyAchievementsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when familyId is null", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    const { container } = render(<FamilyAchievementsSection familyId={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders loading state", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    expect(
      screen.getByTestId("family-achievements-loading"),
    ).toBeInTheDocument();
  });

  it("renders error state with retry button", async () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [],
      isLoading: false,
      error: "Failed to load family achievements",
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    expect(screen.getByTestId("family-achievements-error")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("family-achievements-retry"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("renders family achievements section with summary and grid", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_A],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    expect(
      screen.getByTestId("family-achievements-section"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("family-achievement-summary"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("family-achievement-grid")).toBeInTheDocument();
  });

  it("shows correct unlock count in summary", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_A, CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    expect(screen.getByTestId("family-achievement-count")).toHaveTextContent(
      "1/2 Family Achievements Unlocked",
    );
  });

  it("renders badge for each family achievement", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_A, CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    expect(
      screen.getByTestId("family-achievement-badge-fa-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("family-achievement-badge-fa-2"),
    ).toBeInTheDocument();
  });

  it("resets selectedCategoryId when categories change", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_A, CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    const { rerender } = render(
      <FamilyAchievementsSection familyId="family-1" />,
    );

    act(() => {
      mockUseFamilyAchievements.mockReturnValue({
        categories: [CAT_A],
        isLoading: false,
        error: null,
        retry: mockRetry,
      });
      rerender(<FamilyAchievementsSection familyId="family-1" />);
    });

    expect(screen.getByTestId("family-achievement-count")).toHaveTextContent(
      "1/1 Family Achievements Unlocked",
    );
  });

  it("displays family indicator on badges", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_A],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    // Family indicator icons (Users icon with aria-label)
    expect(screen.getByLabelText("Family achievement")).toBeInTheDocument();
  });

  it("shows progress bar for in-progress family achievements", () => {
    mockUseFamilyAchievements.mockReturnValue({
      categories: [CAT_B],
      isLoading: false,
      error: null,
      retry: mockRetry,
    });

    render(<FamilyAchievementsSection familyId="family-1" />);
    // Progress bar shows current/threshold values
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
  });
});
