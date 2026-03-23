import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AchievementCategoryAdmin from "./index";

const mockCategories = [
  {
    id: "cat-1",
    name: "Adventurer",
    description: "Quest achievements",
    icon: "sword",
    display_order: 1,
    achievement_count: 5,
  },
  {
    id: "cat-2",
    name: "Wealth",
    description: "Gold achievements",
    icon: "coins",
    display_order: 2,
    achievement_count: 0,
  },
];

const mockGetSession = jest.fn().mockResolvedValue({
  data: { session: { access_token: "test-token" } },
});

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

let fetchMockResponses: Array<{ ok: boolean; json: () => Promise<unknown> }> =
  [];
let fetchCallIndex = 0;

beforeEach(() => {
  fetchCallIndex = 0;
  fetchMockResponses = [
    {
      ok: true,
      json: async () => ({ categories: mockCategories }),
    },
  ];
  global.fetch = jest.fn(() => {
    const response =
      fetchMockResponses[fetchCallIndex] ?? fetchMockResponses[0];
    fetchCallIndex++;
    return Promise.resolve(response);
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AchievementCategoryAdmin", () => {
  it("renders category list after loading", async () => {
    render(<AchievementCategoryAdmin />);

    expect(screen.getByText("Loading categories...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });
    expect(screen.getByText("Wealth")).toBeInTheDocument();
  });

  it("shows empty state when no categories", async () => {
    fetchMockResponses = [{ ok: true, json: async () => ({ categories: [] }) }];

    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByTestId("category-empty-state")).toBeInTheDocument();
    });
  });

  it("opens create form when clicking create button", async () => {
    const user = userEvent.setup();
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-category-button"));
    expect(screen.getByTestId("category-form")).toBeInTheDocument();
    expect(screen.getByText("Create Achievement Category")).toBeInTheDocument();
  });

  it("opens edit form when clicking edit button", async () => {
    const user = userEvent.setup();
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("edit-category-cat-1"));
    expect(screen.getByTestId("category-form")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-input")).toHaveValue("Adventurer");
  });

  it("shows delete dialog when clicking delete button", async () => {
    const user = userEvent.setup();
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("delete-category-cat-1"));
    expect(screen.getByTestId("delete-category-dialog")).toBeInTheDocument();
  });

  it("shows protection message for categories with achievements", async () => {
    const user = userEvent.setup();
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("delete-category-cat-1"));
    expect(screen.getByText(/Cannot delete/)).toBeInTheDocument();
    expect(
      screen.getByText(/Remove or reassign achievements/),
    ).toBeInTheDocument();
  });

  it("validates that name is required in form", async () => {
    const user = userEvent.setup();
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("create-category-button"));
    const submitButton = screen.getByTestId("category-submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("shows error when API request fails", async () => {
    fetchMockResponses = [
      {
        ok: false,
        json: async () => ({ error: "Something went wrong" }),
      },
    ];

    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("displays achievement counts in the table", async () => {
    render(<AchievementCategoryAdmin />);

    await waitFor(() => {
      expect(screen.getByText("Adventurer")).toBeInTheDocument();
    });

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
