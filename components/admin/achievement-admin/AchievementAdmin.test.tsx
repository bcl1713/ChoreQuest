import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AchievementAdmin from "./index";

const mockAchievements = [
  {
    id: "ach-1",
    name: "First Quest",
    description: "Complete your first quest",
    icon: "sword",
    category_id: "cat-1",
    category_name: "Adventurer",
    xp_reward: 50,
    gold_reward: 10,
    is_hidden: false,
    criteria_type: "quest_complete",
    criteria_config: {},
    family_id: "fam-1",
  },
  {
    id: "ach-2",
    name: "Hidden Treasure",
    description: "Find the hidden treasure",
    icon: "gem",
    category_id: "cat-2",
    category_name: "Wealth",
    xp_reward: 100,
    gold_reward: 50,
    is_hidden: true,
    criteria_type: "gold_earned",
    criteria_config: { threshold: 1000 },
    family_id: "fam-1",
  },
];

const mockCategories = [
  { id: "cat-1", name: "Adventurer" },
  { id: "cat-2", name: "Wealth" },
];

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      achievements: mockAchievements,
      categories: mockCategories,
    }),
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AchievementAdmin", () => {
  it("renders achievement list after loading", async () => {
    render(<AchievementAdmin />);

    expect(screen.getByText("Loading achievements...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });
    expect(screen.getByText("Hidden Treasure")).toBeInTheDocument();
  });

  it("shows hidden icon for hidden achievements", async () => {
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    expect(screen.getByTestId("visible-icon-ach-1")).toBeInTheDocument();
    expect(screen.getByTestId("hidden-icon-ach-2")).toBeInTheDocument();
  });

  it("opens create form when clicking create button", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-achievement-button"));
    expect(screen.getByTestId("achievement-form")).toBeInTheDocument();
  });

  it("opens edit form when clicking edit button", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("edit-achievement-ach-1"));
    expect(screen.getByTestId("achievement-form")).toBeInTheDocument();
    expect(screen.getByTestId("achievement-name-input")).toHaveValue(
      "First Quest",
    );
  });

  it("filters achievements by category", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByTestId("achievement-category-filter"),
      "cat-2",
    );

    expect(screen.queryByText("First Quest")).not.toBeInTheDocument();
    expect(screen.getByText("Hidden Treasure")).toBeInTheDocument();
  });

  it("shows category dropdown in form", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-achievement-button"));
    const select = screen.getByTestId("achievement-category-select");
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3); // "Select category" + 2 categories
  });

  it("shows hidden toggle in form", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-achievement-button"));
    expect(screen.getByTestId("achievement-hidden-toggle")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("First Quest")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-achievement-button"));
    const submitButton = screen.getByTestId("achievement-submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("shows error when API fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Access denied" }),
    }) as jest.Mock;

    render(<AchievementAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
  });
});
