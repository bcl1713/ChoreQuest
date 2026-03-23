import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FamilyAchievementAdmin from "./index";

const mockUseFamilyAchievementAdmin = jest.fn();
jest.mock("./useFamilyAchievementAdmin", () => ({
  useFamilyAchievementAdmin: () => mockUseFamilyAchievementAdmin(),
}));

const CATEGORIES = [
  { id: "cat-1", name: "Teamwork" },
  { id: "cat-2", name: "Growth" },
];

const ACHIEVEMENTS = [
  {
    id: "fa-1",
    name: "Team Effort",
    description: "Complete 50 quests as a family",
    icon: "sword",
    category_id: "cat-1",
    category_name: "Teamwork",
    xp_reward: 0,
    gold_reward: 0,
    is_hidden: false,
    criteria_type: "quest_complete",
    criteria_config: { threshold: 50, family_evaluation_mode: "sum" },
    progress: { current: 30, threshold: 50 },
    unlocked_at: null,
  },
  {
    id: "fa-2",
    name: "All Level 5",
    description: "All members reach level 5",
    icon: "shield",
    category_id: "cat-2",
    category_name: "Growth",
    xp_reward: 0,
    gold_reward: 0,
    is_hidden: false,
    criteria_type: "level_reached",
    criteria_config: { threshold: 5, family_evaluation_mode: "all" },
    progress: { current: 5, threshold: 5 },
    unlocked_at: "2026-03-20T10:00:00Z",
  },
];

function makeDefaultReturn(overrides = {}) {
  return {
    achievements: ACHIEVEMENTS,
    categories: CATEGORIES,
    loading: false,
    error: null,
    showForm: false,
    editingAchievement: null,
    formData: {
      name: "",
      description: "",
      icon: "",
      category_id: "",
      xp_reward: "0",
      gold_reward: "0",
      is_hidden: false,
      criteria_type: "",
      criteria_config: "{}",
    },
    actionLoading: false,
    categoryFilter: "all",
    setCategoryFilter: jest.fn(),
    handleCreate: jest.fn(),
    handleEdit: jest.fn(),
    handleDelete: jest.fn(),
    handleFormChange: jest.fn(),
    handleSubmit: jest.fn(),
    handleCancelForm: jest.fn(),
    ...overrides,
  };
}

describe("FamilyAchievementAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ loading: true, achievements: [] }),
    );

    render(<FamilyAchievementAdmin />);
    expect(
      screen.getByText("Loading family achievements..."),
    ).toBeInTheDocument();
  });

  it("renders achievements list", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(makeDefaultReturn());

    render(<FamilyAchievementAdmin />);
    expect(screen.getByTestId("family-achievement-admin")).toBeInTheDocument();
    expect(screen.getByText("Team Effort")).toBeInTheDocument();
    expect(screen.getByText("All Level 5")).toBeInTheDocument();
  });

  it("shows progress values for each achievement", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(makeDefaultReturn());

    render(<FamilyAchievementAdmin />);
    expect(screen.getByText("30/50")).toBeInTheDocument();
    expect(screen.getByText("5/5")).toBeInTheDocument();
  });

  it("shows unlock status icons", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(makeDefaultReturn());

    render(<FamilyAchievementAdmin />);
    expect(screen.getByTestId("locked-icon-fa-1")).toBeInTheDocument();
    expect(screen.getByTestId("unlocked-icon-fa-2")).toBeInTheDocument();
  });

  it("calls handleCreate when create button clicked", async () => {
    const handleCreate = jest.fn();
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ handleCreate }),
    );

    render(<FamilyAchievementAdmin />);
    await userEvent.click(
      screen.getByTestId("create-family-achievement-button"),
    );
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it("calls handleEdit when edit button clicked", async () => {
    const handleEdit = jest.fn();
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ handleEdit }),
    );

    render(<FamilyAchievementAdmin />);
    await userEvent.click(screen.getByTestId("edit-family-achievement-fa-1"));
    expect(handleEdit).toHaveBeenCalledWith(ACHIEVEMENTS[0]);
  });

  it("calls handleDelete when delete button clicked", async () => {
    const handleDelete = jest.fn();
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ handleDelete }),
    );

    render(<FamilyAchievementAdmin />);
    await userEvent.click(screen.getByTestId("delete-family-achievement-fa-1"));
    expect(handleDelete).toHaveBeenCalledWith("fa-1");
  });

  it("renders form when showForm is true", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ showForm: true }),
    );

    render(<FamilyAchievementAdmin />);
    expect(screen.getByTestId("family-achievement-form")).toBeInTheDocument();
  });

  it("renders error message", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ error: "Something went wrong" }),
    );

    render(<FamilyAchievementAdmin />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders empty state when no achievements", () => {
    mockUseFamilyAchievementAdmin.mockReturnValue(
      makeDefaultReturn({ achievements: [] }),
    );

    render(<FamilyAchievementAdmin />);
    expect(
      screen.getByTestId("family-achievement-empty-state"),
    ).toBeInTheDocument();
  });
});
