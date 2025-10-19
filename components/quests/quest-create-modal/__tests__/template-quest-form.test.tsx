import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplateQuestForm from "../template-quest-form";
import { QuestTemplate } from "@/lib/types/database";

describe("TemplateQuestForm", () => {
  const mockTemplates: QuestTemplate[] = [
    {
      id: "template1",
      title: "Clean Room",
      description: "Tidy up your bedroom",
      category: "DAILY",
      quest_type: "FAMILY",
      recurrence_pattern: "DAILY",
      difficulty: "EASY",
      xp_reward: 50,
      gold_reward: 10,
      family_id: "family1",
      is_active: true,
      is_paused: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      assigned_character_ids: [],
      class_bonuses: null,
    },
    {
      id: "template2",
      title: "Do Homework",
      description: "Complete all homework assignments",
      category: "DAILY",
      quest_type: "INDIVIDUAL",
      recurrence_pattern: "DAILY",
      difficulty: "MEDIUM",
      xp_reward: 100,
      gold_reward: 25,
      family_id: "family1",
      is_active: true,
      is_paused: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      assigned_character_ids: [],
      class_bonuses: null,
    },
    {
      id: "template3",
      title: "Boss Battle",
      description: "Complete epic challenge",
      category: "BOSS_BATTLE",
      quest_type: "FAMILY",
      recurrence_pattern: "WEEKLY",
      difficulty: "HARD",
      xp_reward: 500,
      gold_reward: 100,
      family_id: "family1",
      is_active: true,
      is_paused: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      assigned_character_ids: [],
      class_bonuses: null,
    },
  ];

  const mockProps = {
    templates: mockTemplates,
    selectedTemplateId: "",
    onTemplateSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render template select dropdown", () => {
      render(<TemplateQuestForm {...mockProps} />);

      expect(screen.getByTestId("template-select")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Template")).toBeInTheDocument();
    });

    it("should render default placeholder option", () => {
      render(<TemplateQuestForm {...mockProps} />);

      expect(screen.getByText("Choose a quest template...")).toBeInTheDocument();
    });

    it("should render all template options", () => {
      render(<TemplateQuestForm {...mockProps} />);

      const select = screen.getByTestId("template-select");
      const options = Array.from(select.querySelectorAll("option"));

      // +1 for the placeholder option
      expect(options).toHaveLength(mockTemplates.length + 1);
    });

    it("should display template info in option text", () => {
      render(<TemplateQuestForm {...mockProps} />);

      expect(screen.getByText(/Clean Room - EASY \(50 XP, 10 Gold\)/)).toBeInTheDocument();
      expect(screen.getByText(/Do Homework - MEDIUM \(100 XP, 25 Gold\)/)).toBeInTheDocument();
      expect(screen.getByText(/Boss Battle - HARD \(500 XP, 100 Gold\)/)).toBeInTheDocument();
    });

    it("should not show preview when no template is selected", () => {
      render(<TemplateQuestForm {...mockProps} />);

      expect(screen.queryByTestId("template-preview")).not.toBeInTheDocument();
    });

    it("should show preview when a template is selected", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      expect(screen.getByTestId("template-preview")).toBeInTheDocument();
    });
  });

  describe("Template Preview", () => {
    it("should display selected template title", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("Clean Room");
    });

    it("should display selected template description", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("Tidy up your bedroom");
    });

    it("should display selected template difficulty", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("EASY");
    });

    it("should display selected template category", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("DAILY");
    });

    it("should display selected template XP reward", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("⚡ 50 XP");
    });

    it("should display selected template gold reward", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("💰 10");
    });

    it("should update preview when different template is selected", () => {
      const { rerender } = render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      expect(screen.getByTestId("template-preview")).toHaveTextContent("Clean Room");

      rerender(<TemplateQuestForm {...mockProps} selectedTemplateId="template2" />);

      expect(screen.getByTestId("template-preview")).toHaveTextContent("Do Homework");
      expect(screen.getByTestId("template-preview")).toHaveTextContent("Complete all homework assignments");
    });

    it("should show different difficulty in preview", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template3" />);

      const preview = screen.getByTestId("template-preview");
      expect(preview).toHaveTextContent("HARD");
    });
  });

  describe("User Interactions", () => {
    it("should call onTemplateSelect when template is chosen", () => {
      render(<TemplateQuestForm {...mockProps} />);

      const select = screen.getByTestId("template-select");
      fireEvent.change(select, { target: { value: "template1" } });

      expect(mockProps.onTemplateSelect).toHaveBeenCalledTimes(1);
      expect(mockProps.onTemplateSelect).toHaveBeenCalledWith("template1");
    });

    it("should call onTemplateSelect when template is changed", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const select = screen.getByTestId("template-select");
      fireEvent.change(select, { target: { value: "template2" } });

      expect(mockProps.onTemplateSelect).toHaveBeenCalledTimes(1);
      expect(mockProps.onTemplateSelect).toHaveBeenCalledWith("template2");
    });

    it("should allow deselecting template by choosing placeholder", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template1" />);

      const select = screen.getByTestId("template-select");
      fireEvent.change(select, { target: { value: "" } });

      expect(mockProps.onTemplateSelect).toHaveBeenCalledWith("");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty template array", () => {
      render(<TemplateQuestForm {...mockProps} templates={[]} />);

      const select = screen.getByTestId("template-select");
      const options = Array.from(select.querySelectorAll("option"));

      expect(options).toHaveLength(1); // Only placeholder
      expect(screen.getByText("Choose a quest template...")).toBeInTheDocument();
    });

    it("should handle invalid selectedTemplateId gracefully", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="nonexistent" />);

      expect(screen.queryByTestId("template-preview")).not.toBeInTheDocument();
    });

    it("should display select value correctly when template is selected", () => {
      render(<TemplateQuestForm {...mockProps} selectedTemplateId="template2" />);

      const select = screen.getByTestId("template-select") as HTMLSelectElement;
      expect(select.value).toBe("template2");
    });
  });

  describe("Required Field", () => {
    it("should mark template select as required", () => {
      render(<TemplateQuestForm {...mockProps} />);

      const select = screen.getByTestId("template-select");
      expect(select).toBeRequired();
    });
  });
});
