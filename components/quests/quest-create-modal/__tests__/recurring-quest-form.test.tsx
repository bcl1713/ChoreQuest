import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecurringQuestForm from "../recurring-quest-form";
import type { TemplateFormData } from "@/lib/types/quest-templates";

describe("RecurringQuestForm", () => {
  const mockFormData: TemplateFormData = {
    title: "",
    description: "",
    category: "DAILY",
    quest_type: "FAMILY",
    recurrence_pattern: "DAILY",
    difficulty: "MEDIUM",
    xp_reward: 50,
    gold_reward: 25,
    assigned_character_ids: [],
    class_bonuses: null,
  };

  const mockFamilyMembers = [
    { id: "user1", name: "Alice", email: "alice@example.com" },
    { id: "user2", name: "Bob", email: "bob@example.com" },
  ];

  const mockFamilyCharacters = [
    { id: "char1", name: "Warrior Alice", user_id: "user1" },
    { id: "char2", name: "Mage Bob", user_id: "user2" },
  ];

  const mockProps = {
    formData: mockFormData,
    familyMembers: mockFamilyMembers,
    familyCharacters: mockFamilyCharacters,
    onInputChange: jest.fn(),
    onToggleCharacter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<RecurringQuestForm {...mockProps} />);

      expect(screen.getByTestId("recurring-title-input")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-pattern-select")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-description-input")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-quest-type-select")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-difficulty-select")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-xp-input")).toBeInTheDocument();
      expect(screen.getByTestId("recurring-gold-input")).toBeInTheDocument();
    });

    it("should display current values in form fields", () => {
      const formData: TemplateFormData = {
        ...mockFormData,
        title: "Make Bed",
        description: "Make your bed every morning",
        recurrence_pattern: "WEEKLY",
        difficulty: "EASY",
        xp_reward: 100,
        gold_reward: 50,
      };

      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      expect(screen.getByTestId("recurring-title-input")).toHaveValue("Make Bed");
      expect(screen.getByTestId("recurring-description-input")).toHaveValue("Make your bed every morning");
      expect(screen.getByTestId("recurring-pattern-select")).toHaveValue("WEEKLY");
      expect(screen.getByTestId("recurring-difficulty-select")).toHaveValue("EASY");
      expect(screen.getByTestId("recurring-xp-input")).toHaveValue(100);
      expect(screen.getByTestId("recurring-gold-input")).toHaveValue(50);
    });

    it("should render all recurrence pattern options", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const patternSelect = screen.getByTestId("recurring-pattern-select");
      const options = Array.from(patternSelect.querySelectorAll("option"));

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue("DAILY");
      expect(options[1]).toHaveValue("WEEKLY");
    });

    it("should render all quest type options", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const questTypeSelect = screen.getByTestId("recurring-quest-type-select");
      const options = Array.from(questTypeSelect.querySelectorAll("option"));

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue("FAMILY");
      expect(options[1]).toHaveValue("INDIVIDUAL");
    });

    it("should render all difficulty options", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const difficultySelect = screen.getByTestId("recurring-difficulty-select");
      const options = Array.from(difficultySelect.querySelectorAll("option"));

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue("EASY");
      expect(options[1]).toHaveValue("MEDIUM");
      expect(options[2]).toHaveValue("HARD");
    });
  });

  describe("User Interactions", () => {
    it("should call onInputChange when title changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const titleInput = screen.getByTestId("recurring-title-input");
      fireEvent.change(titleInput, { target: { value: "New Template", name: "title" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when description changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const descriptionInput = screen.getByTestId("recurring-description-input");
      fireEvent.change(descriptionInput, { target: { value: "New description", name: "description" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when recurrence pattern changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const patternSelect = screen.getByTestId("recurring-pattern-select");
      fireEvent.change(patternSelect, { target: { value: "WEEKLY", name: "recurrence_pattern" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when quest type changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const questTypeSelect = screen.getByTestId("recurring-quest-type-select");
      fireEvent.change(questTypeSelect, { target: { value: "INDIVIDUAL", name: "quest_type" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when difficulty changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const difficultySelect = screen.getByTestId("recurring-difficulty-select");
      fireEvent.change(difficultySelect, { target: { value: "HARD", name: "difficulty" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when XP reward changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("recurring-xp-input");
      fireEvent.change(xpInput, { target: { value: "150", name: "xp_reward" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });

    it("should call onInputChange when gold reward changes", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("recurring-gold-input");
      fireEvent.change(goldInput, { target: { value: "75", name: "gold_reward" } });

      expect(mockProps.onInputChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Individual Quest Character Assignment", () => {
    it("should not show character assignment for FAMILY quest type", () => {
      render(<RecurringQuestForm {...mockProps} />);

      expect(screen.queryByText("Assign to Heroes")).not.toBeInTheDocument();
      expect(screen.queryByTestId("character-list")).not.toBeInTheDocument();
    });

    it("should show character assignment for INDIVIDUAL quest type", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      expect(screen.getByText("Assign to Heroes")).toBeInTheDocument();
      expect(screen.getByTestId("character-list")).toBeInTheDocument();
    });

    it("should render all family characters with owner names", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      expect(screen.getByText(/Warrior Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Mage Bob/)).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });

    it("should show message when no characters are available", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      render(<RecurringQuestForm {...mockProps} formData={formData} familyCharacters={[]} />);

      expect(screen.getByTestId("no-characters-message")).toBeInTheDocument();
      expect(screen.getByText(/No hero characters available yet/)).toBeInTheDocument();
    });

    it("should call onToggleCharacter when character checkbox is clicked", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      const checkbox = screen.getByTestId("character-checkbox-char1").querySelector("input");
      expect(checkbox).toBeInTheDocument();

      if (checkbox) {
        fireEvent.click(checkbox);
        expect(mockProps.onToggleCharacter).toHaveBeenCalledWith("char1");
      }
    });

    it("should check checkbox for assigned characters", () => {
      const formData = {
        ...mockFormData,
        quest_type: "INDIVIDUAL" as const,
        assigned_character_ids: ["char1"],
      };
      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      const checkbox1 = screen.getByTestId("character-checkbox-char1").querySelector("input");
      const checkbox2 = screen.getByTestId("character-checkbox-char2").querySelector("input");

      expect(checkbox1).toBeChecked();
      expect(checkbox2).not.toBeChecked();
    });

    it("should handle character without owner name", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      const charactersWithoutOwner = [
        { id: "char3", name: "Unknown Hero", user_id: "unknown" },
      ];

      render(
        <RecurringQuestForm
          {...mockProps}
          formData={formData}
          familyCharacters={charactersWithoutOwner}
        />
      );

      expect(screen.getByText("Unknown Hero")).toBeInTheDocument();
    });
  });

  describe("Required Fields", () => {
    it("should mark title as required", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const titleInput = screen.getByTestId("recurring-title-input");
      expect(titleInput).toBeRequired();
    });

    it("should mark description as required", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const descriptionInput = screen.getByTestId("recurring-description-input");
      expect(descriptionInput).toBeRequired();
    });
  });

  describe("Input Constraints", () => {
    it("should set minimum XP value to 0", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const xpInput = screen.getByTestId("recurring-xp-input");
      expect(xpInput).toHaveAttribute("min", "0");
    });

    it("should set minimum gold value to 0", () => {
      render(<RecurringQuestForm {...mockProps} />);

      const goldInput = screen.getByTestId("recurring-gold-input");
      expect(goldInput).toHaveAttribute("min", "0");
    });
  });

  describe("Helper Text", () => {
    it("should display recurrence pattern helper text", () => {
      render(<RecurringQuestForm {...mockProps} />);

      expect(screen.getByText(/Custom intervals coming soon/)).toBeInTheDocument();
    });

    it("should display volunteer bonus information", () => {
      render(<RecurringQuestForm {...mockProps} />);

      expect(screen.getByText(/Volunteer heroes receive a \+20% bonus/)).toBeInTheDocument();
    });

    it("should display individual quest explanation for INDIVIDUAL type", () => {
      const formData = { ...mockFormData, quest_type: "INDIVIDUAL" as const };
      render(<RecurringQuestForm {...mockProps} formData={formData} />);

      expect(screen.getByText(/Individual recurring quests generate one task per selected hero/)).toBeInTheDocument();
    });
  });
});
