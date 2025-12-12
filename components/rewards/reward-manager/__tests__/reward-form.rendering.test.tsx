import React from "react";
import { render, screen } from "@testing-library/react";
import { RewardForm, REWARD_TYPE_LABELS } from "../reward-form";
import { defaultFormData, filledFormData, createHandlers } from "./reward-form.fixtures";

describe("RewardForm rendering", () => {
  const handlers = createHandlers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constants", () => {
    it("should export REWARD_TYPE_LABELS", () => {
      expect(REWARD_TYPE_LABELS).toEqual({
        SCREEN_TIME: "Screen Time",
        PRIVILEGE: "Privilege",
        PURCHASE: "Purchase",
        EXPERIENCE: "Experience",
      });
    });
  });

  describe("Create Mode", () => {
    it("should render create mode with correct title and button", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByText("Create New Reward")).toBeInTheDocument();
      expect(screen.getByText("Create Reward")).toBeInTheDocument();
      expect(screen.getByTestId("create-reward-modal")).toBeInTheDocument();
    });

    it("should show placeholder text in create mode", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByPlaceholderText("Enter reward name...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Describe the reward...")).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("should render edit mode with correct title and button", () => {
      render(<RewardForm mode="edit" formData={filledFormData} {...handlers} />);
      expect(screen.getByText("Edit Reward")).toBeInTheDocument();
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
      expect(screen.getByTestId("edit-reward-modal")).toBeInTheDocument();
    });

    it("should not show placeholder text in edit mode", () => {
      render(<RewardForm mode="edit" formData={filledFormData} {...handlers} />);
      const nameInput = screen.getByTestId("reward-name-input") as HTMLInputElement;
      expect(nameInput.placeholder).toBe("");
    });
  });

  describe("Form Fields", () => {
    it("should render all form fields", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByTestId("reward-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("reward-description-input")).toBeInTheDocument();
      expect(screen.getByTestId("reward-type-select")).toBeInTheDocument();
      expect(screen.getByTestId("reward-cost-input")).toBeInTheDocument();
    });

    it("should display form data values", () => {
      render(<RewardForm mode="edit" formData={filledFormData} {...handlers} />);
      const nameInput = screen.getByTestId("reward-name-input") as HTMLInputElement;
      const descInput = screen.getByTestId("reward-description-input") as HTMLTextAreaElement;
      const typeSelect = screen.getByTestId("reward-type-select") as HTMLSelectElement;
      const costInput = screen.getByTestId("reward-cost-input") as HTMLInputElement;
      expect(nameInput.value).toBe("Extra Screen Time");
      expect(descInput.value).toBe("30 minutes of extra screen time");
      expect(typeSelect.value).toBe("SCREEN_TIME");
      expect(costInput.value).toBe("100");
    });

    it("should have required attribute on all fields and min on cost", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByTestId("reward-name-input")).toBeRequired();
      expect(screen.getByTestId("reward-description-input")).toBeRequired();
      expect(screen.getByTestId("reward-type-select")).toBeRequired();
      const costInput = screen.getByTestId("reward-cost-input") as HTMLInputElement;
      expect(costInput).toBeRequired();
      expect(costInput.min).toBe("1");
    });

    it("should render all reward type options", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByRole("option", { name: "Screen Time" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Privilege" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Purchase" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Experience" })).toBeInTheDocument();
    });
  });

  describe("Styling and Layout", () => {
    it("should render modal overlay", () => {
      const { container } = render(
        <RewardForm mode="create" formData={defaultFormData} {...handlers} />
      );
      const overlay = container.querySelector(".fixed.inset-0.bg-black.bg-opacity-50");
      expect(overlay).toBeInTheDocument();
    });

    it("should apply fantasy-card styling to modal", () => {
      const { container } = render(
        <RewardForm mode="create" formData={defaultFormData} {...handlers} />
      );
      const modal = container.querySelector(".fantasy-card");
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass("p-6", "max-w-md", "w-full");
    });

    it("should render labels for all fields", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByText("Reward Name")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Cost (gold)")).toBeInTheDocument();
    });
  });
});
