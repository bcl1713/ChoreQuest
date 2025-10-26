import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AdhocQuestForm from "../adhoc-quest-form";
import { QuestDifficulty, QuestCategory } from "@/lib/types/database";

describe("AdhocQuestForm", () => {
  const mockProps = {
    title: "",
    description: "",
    xpReward: 50,
    goldReward: 10,
    difficulty: "EASY" as QuestDifficulty,
    category: "DAILY" as QuestCategory,
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    onXpRewardChange: jest.fn(),
    onGoldRewardChange: jest.fn(),
    onDifficultyChange: jest.fn(),
    onCategoryChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<AdhocQuestForm {...mockProps} />);

      expect(screen.getByTestId("quest-title-input")).toBeInTheDocument();
      expect(screen.getByTestId("quest-category-select")).toBeInTheDocument();
      expect(screen.getByTestId("quest-description-input")).toBeInTheDocument();
      expect(screen.getByTestId("quest-difficulty-select")).toBeInTheDocument();
      expect(screen.getByTestId("quest-xp-input")).toBeInTheDocument();
      expect(screen.getByTestId("quest-gold-input")).toBeInTheDocument();
    });

    it("should display current values in form fields", () => {
      const props = {
        ...mockProps,
        title: "Clean Room",
        description: "Tidy up your bedroom",
        xpReward: 100,
        goldReward: 25,
        difficulty: "MEDIUM" as QuestDifficulty,
        category: "WEEKLY" as QuestCategory,
      };

      render(<AdhocQuestForm {...props} />);

      expect(screen.getByTestId("quest-title-input")).toHaveValue("Clean Room");
      expect(screen.getByTestId("quest-description-input")).toHaveValue("Tidy up your bedroom");
      expect(screen.getByTestId("quest-xp-input")).toHaveValue(100);
      expect(screen.getByTestId("quest-gold-input")).toHaveValue(25);
      expect(screen.getByTestId("quest-difficulty-select")).toHaveValue("MEDIUM");
      expect(screen.getByTestId("quest-category-select")).toHaveValue("WEEKLY");
    });

    it("should render all difficulty options", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const difficultySelect = screen.getByTestId("quest-difficulty-select");
      const options = Array.from(difficultySelect.querySelectorAll("option"));

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue("EASY");
      expect(options[1]).toHaveValue("MEDIUM");
      expect(options[2]).toHaveValue("HARD");
    });

    it("should render all category options", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const categorySelect = screen.getByTestId("quest-category-select");
      const options = Array.from(categorySelect.querySelectorAll("option"));

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue("DAILY");
      expect(options[1]).toHaveValue("WEEKLY");
      expect(options[2]).toHaveValue("BOSS_BATTLE");
    });
  });

  describe("User Interactions", () => {
    it("should call onTitleChange when title input changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const titleInput = screen.getByTestId("quest-title-input");
      fireEvent.change(titleInput, { target: { value: "New Quest" } });

      expect(mockProps.onTitleChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onTitleChange).toHaveBeenCalledWith("New Quest");
    });

    it("should call onDescriptionChange when description changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const descriptionInput = screen.getByTestId("quest-description-input");
      fireEvent.change(descriptionInput, { target: { value: "Do something" } });

      expect(mockProps.onDescriptionChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onDescriptionChange).toHaveBeenCalledWith("Do something");
    });

    it("should call onCategoryChange when category select changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const categorySelect = screen.getByTestId("quest-category-select");
      fireEvent.change(categorySelect, { target: { value: "WEEKLY" } });

      expect(mockProps.onCategoryChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onCategoryChange).toHaveBeenCalledWith("WEEKLY");
    });

    it("should call onDifficultyChange when difficulty select changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const difficultySelect = screen.getByTestId("quest-difficulty-select");
      fireEvent.change(difficultySelect, { target: { value: "HARD" } });

      expect(mockProps.onDifficultyChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onDifficultyChange).toHaveBeenCalledWith("HARD");
    });

    it("should call onXpRewardChange when XP input changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("quest-xp-input");
      fireEvent.change(xpInput, { target: { value: "150" } });

      expect(mockProps.onXpRewardChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onXpRewardChange).toHaveBeenCalledWith(150);
    });

    it("should call onGoldRewardChange when gold input changes", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("quest-gold-input");
      fireEvent.change(goldInput, { target: { value: "50" } });

      expect(mockProps.onGoldRewardChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onGoldRewardChange).toHaveBeenCalledWith(50);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string for XP and convert to 0", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("quest-xp-input");
      fireEvent.change(xpInput, { target: { value: "" } });

      expect(mockProps.onXpRewardChange).toHaveBeenCalledWith(0);
    });

    it("should handle empty string for gold and convert to 0", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("quest-gold-input");
      fireEvent.change(goldInput, { target: { value: "" } });

      expect(mockProps.onGoldRewardChange).toHaveBeenCalledWith(0);
    });

    it("should handle non-numeric input for XP", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("quest-xp-input");
      fireEvent.change(xpInput, { target: { value: "abc" } });

      expect(mockProps.onXpRewardChange).toHaveBeenCalledWith(0);
    });

    it("should handle non-numeric input for gold", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("quest-gold-input");
      fireEvent.change(goldInput, { target: { value: "xyz" } });

      expect(mockProps.onGoldRewardChange).toHaveBeenCalledWith(0);
    });
  });

  describe("Required Fields", () => {
    it("should mark title as required", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const titleInput = screen.getByTestId("quest-title-input");
      expect(titleInput).toBeRequired();
    });

    it("should mark description as required", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const descriptionInput = screen.getByTestId("quest-description-input");
      expect(descriptionInput).toBeRequired();
    });

    it("should mark XP reward as required", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("quest-xp-input");
      expect(xpInput).toBeRequired();
    });

    it("should mark gold reward as required", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("quest-gold-input");
      expect(goldInput).toBeRequired();
    });
  });

  describe("Input Constraints", () => {
    it("should set minimum XP value to 1", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("quest-xp-input");
      expect(xpInput).toHaveAttribute("min", "1");
    });

    it("should set minimum gold value to 0", () => {
      render(<AdhocQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("quest-gold-input");
      expect(goldInput).toHaveAttribute("min", "0");
    });
  });
});
