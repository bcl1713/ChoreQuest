import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RewardForm } from "../reward-form";
import { defaultFormData, filledFormData, createHandlers } from "./reward-form.fixtures";
import { RewardType } from "@/lib/types/database";

describe("RewardForm interactions", () => {
  let handlers = createHandlers();

  beforeEach(() => {
    handlers = createHandlers();
    jest.clearAllMocks();
  });

  describe("User Interactions", () => {
    it("should call onChange when fields change", () => {
      render(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      fireEvent.change(screen.getByTestId("reward-name-input"), {
        target: { value: "New Reward" },
      });
      expect(handlers.onChange).toHaveBeenCalledWith("name", "New Reward");

      fireEvent.change(screen.getByTestId("reward-description-input"), {
        target: { value: "New Description" },
      });
      expect(handlers.onChange).toHaveBeenCalledWith("description", "New Description");

      fireEvent.change(screen.getByTestId("reward-type-select"), {
        target: { value: "PRIVILEGE" },
      });
      expect(handlers.onChange).toHaveBeenCalledWith("type", "PRIVILEGE");

      fireEvent.change(screen.getByTestId("reward-cost-input"), {
        target: { value: "50" },
      });
      expect(handlers.onChange).toHaveBeenCalledWith("cost", "50");
    });

    it("should submit and cancel", () => {
      const { container } = render(
        <RewardForm mode="create" formData={filledFormData} {...handlers} />
      );
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
      expect(handlers.onSubmit).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText("Cancel"));
      expect(handlers.onCancel).toHaveBeenCalledTimes(1);
      expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long reward names", () => {
      const longName = "A".repeat(200);
      render(
        <RewardForm
          mode="edit"
          formData={{ ...defaultFormData, name: longName }}
          {...handlers}
        />
      );
      const nameInput = screen.getByTestId("reward-name-input") as HTMLInputElement;
      expect(nameInput.value).toBe(longName);
    });

    it("should handle very long descriptions", () => {
      const longDesc = "B".repeat(500);
      render(
        <RewardForm
          mode="edit"
          formData={{ ...defaultFormData, description: longDesc }}
          {...handlers}
        />
      );
      const descInput = screen.getByTestId("reward-description-input") as HTMLTextAreaElement;
      expect(descInput.value).toBe(longDesc);
    });

    it("should handle zero and large cost values", () => {
      render(
        <RewardForm
          mode="edit"
          formData={{ ...defaultFormData, cost: "0" }}
          {...handlers}
        />
      );
      expect((screen.getByTestId("reward-cost-input") as HTMLInputElement).value).toBe("0");

      render(
        <RewardForm
          mode="edit"
          formData={{ ...defaultFormData, cost: "999999" }}
          {...handlers}
        />
      );
      expect((screen.getByTestId("reward-cost-input") as HTMLInputElement).value).toBe(
        "999999"
      );
    });

    it("should handle all reward types", () => {
      const types: RewardType[] = ["SCREEN_TIME", "PRIVILEGE", "PURCHASE", "EXPERIENCE"];
      types.forEach((type) => {
        const { unmount } = render(
          <RewardForm mode="edit" formData={{ ...defaultFormData, type }} {...handlers} />
        );
        const typeSelect = screen.getByTestId("reward-type-select") as HTMLSelectElement;
        expect(typeSelect.value).toBe(type);
        unmount();
      });
    });
  });

  describe("Memoization", () => {
    it("should not re-render when props have not changed", () => {
      const { rerender } = render(
        <RewardForm mode="create" formData={defaultFormData} {...handlers} />
      );
      rerender(<RewardForm mode="create" formData={defaultFormData} {...handlers} />);
      expect(screen.getByText("Create New Reward")).toBeInTheDocument();
    });
  });
});
