/**
 * Unit tests for quest-create-modal.tsx template functionality
 * Tests template-based quest creation workflow
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuestCreateModal from "@/components/quests/quest-create-modal";
import { questTemplateService } from "@/lib/quest-template-service";
import { QuestTemplate } from "@/lib/types/database";

// Mock dependencies
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    profile: { family_id: "test-family-id", role: "GUILD_MASTER" },
  }),
}));

jest.mock("@/hooks/useFamilyMembers", () => ({
  useFamilyMembers: () => ({
    familyMembers: [
      {
        id: "member-1",
        name: "Test Member",
        role: "HERO",
      },
    ],
    familyCharacters: [
      {
        id: "character-1",
        user_id: "member-1",
        name: "Sir Test",
        class: "KNIGHT",
        level: 1,
        xp: 0,
        gold: 0,
        gems: 0,
        honor_points: 0,
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        active_family_quest_id: null,
      },
    ],
    loading: false,
    error: null,
    reload: jest.fn(),
  }),
}));

jest.mock("@/lib/supabase", () => {
  const from = jest.fn((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
            return {
              data: [
                {
                  id: "member-1",
                  name: "Test Member",
                  role: "HERO",
                },
              ],
              error: null,
            };
          }),
        })),
      };
    }

    if (table === "characters") {
      return {
        select: jest.fn(() => ({
          in: jest.fn(async () => ({
            data: [
              {
                id: "character-1",
                user_id: "member-1",
                name: "Sir Test",
                class: "KNIGHT",
                level: 1,
                xp: 0,
                gold: 0,
                gems: 0,
                honor_points: 0,
                avatar_url: null,
                created_at: "2025-01-01T00:00:00Z",
                updated_at: "2025-01-01T00:00:00Z",
                active_family_quest_id: null,
              },
            ],
            error: null,
          })),
        })),
      };
    }

    if (table === "quest_instances") {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }

    if (table === "quest_templates") {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }

    return {
      select: jest.fn(() => ({
        eq: jest.fn(async () => ({ data: null, error: null })),
      })),
    };
  });

  return {
    supabase: {
      from,
    },
  };
});

jest.mock("@/lib/quest-template-service");

describe("QuestCreateModal - Template Mode", () => {
  const mockTemplates: QuestTemplate[] = [
    {
      id: "template-1",
      family_id: "test-family-id",
      title: "Clean Your Room",
      description: "Tidy up your bedroom",
      xp_reward: 100,
      gold_reward: 20,
      difficulty: "EASY",
      category: "DAILY",
      class_bonuses: {
        KNIGHT: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        MAGE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        RANGER: { xp_multiplier: 1.2, gold_multiplier: 1.1 },
        ROGUE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        HEALER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      },
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "template-2",
      family_id: "test-family-id",
      title: "Do Homework",
      description: "Complete school assignments",
      xp_reward: 150,
      gold_reward: 30,
      difficulty: "MEDIUM",
      category: "DAILY",
      class_bonuses: {
        KNIGHT: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        MAGE: { xp_multiplier: 1.3, gold_multiplier: 1.2 },
        RANGER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        ROGUE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
        HEALER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      },
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  ];

  const mockOnClose = jest.fn();
  const mockOnQuestCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully create quest from template with default options", async () => {
    const mockCreatedQuest = {
      id: "quest-1",
      title: "Clean Your Room",
      description: "Tidy up your bedroom",
      xp_reward: 100,
      gold_reward: 20,
      difficulty: "EASY",
      category: "DAILY",
      status: "PENDING",
      family_id: "test-family-id",
      template_id: "template-1",
      created_by_id: "test-user-id",
      assigned_to_id: null,
      due_date: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(
      mockCreatedQuest
    );

    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Select a template
    const templateSelect = screen.getByRole("combobox", { name: /select template/i });
    fireEvent.change(templateSelect, { target: { value: "template-1" } });

    // Submit form
    const submitButton = screen.getByText(/create quest/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith(
        "template-1",
        "test-user-id",
        {
          assignedToId: undefined,
          dueDate: undefined,
        }
      );
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("should create quest from template with assignment override", async () => {
    const mockCreatedQuest = {
      id: "quest-2",
      title: "Do Homework",
      description: "Complete school assignments",
      xp_reward: 150,
      gold_reward: 30,
      difficulty: "MEDIUM",
      category: "DAILY",
      status: "PENDING",
      family_id: "test-family-id",
      template_id: "template-2",
      created_by_id: "test-user-id",
      assigned_to_id: "member-1",
      due_date: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(
      mockCreatedQuest
    );

    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Wait for family members to load
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Select template
    const templateSelect = screen.getByRole("combobox", { name: /select template/i });
    fireEvent.change(templateSelect, { target: { value: "template-2" } });

    // Assign to member
    const assignSelect = screen.getByRole("combobox", { name: /assign to/i });
    fireEvent.change(assignSelect, { target: { value: "member-1" } });

    // Submit
    const submitButton = screen.getByText(/create quest/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith(
        "template-2",
        "test-user-id",
        {
          assignedToId: "member-1",
          dueDate: undefined,
        }
      );
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("should create quest from template with due date override", async () => {
    const mockCreatedQuest = {
      id: "quest-3",
      title: "Clean Your Room",
      description: "Tidy up your bedroom",
      xp_reward: 100,
      gold_reward: 20,
      difficulty: "EASY",
      category: "DAILY",
      status: "PENDING",
      family_id: "test-family-id",
      template_id: "template-1",
      created_by_id: "test-user-id",
      assigned_to_id: null,
      due_date: "2025-12-31T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(
      mockCreatedQuest
    );

    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Wait for family members to load
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Select template
    const templateSelect = screen.getByRole("combobox", { name: /select template/i });
    fireEvent.change(templateSelect, { target: { value: "template-1" } });

    // Set due date
    const dueDateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dueDateInput, { target: { value: "2025-12-31T23:59" } });

    // Submit
    const submitButton = screen.getByText(/create quest/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith(
        "template-1",
        "test-user-id",
        expect.objectContaining({
          dueDate: expect.any(String),
        })
      );
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("should not allow submission when no template selected", async () => {
    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Wait for family members to load
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Verify template select exists and is empty
    const templateSelect = screen.getByRole("combobox", { name: /select template/i });
    expect(templateSelect).toHaveValue("");

    // Template service should not be called without selection
    expect(questTemplateService.createQuestFromTemplate).not.toHaveBeenCalled();
    expect(mockOnQuestCreated).not.toHaveBeenCalled();
  });

  test("should show error when template service fails", async () => {
    (questTemplateService.createQuestFromTemplate as jest.Mock).mockRejectedValue(
      new Error("Failed to create quest from template")
    );

    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Select template
    const templateSelect = screen.getByLabelText(/select template/i);
    fireEvent.change(templateSelect, { target: { value: "template-1" } });

    // Submit
    const submitButton = screen.getByText(/create quest/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create quest from template/i)).toBeInTheDocument();
      expect(mockOnQuestCreated).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  test("should validate future due date in template mode", async () => {
    render(
      <QuestCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onQuestCreated={mockOnQuestCreated}
        templates={mockTemplates}
      />
    );

    // Wait for family members to load
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });

    // Switch to template mode
    const templateTab = screen.getByText("From Template");
    fireEvent.click(templateTab);

    // Select template
    const templateSelect = screen.getByRole("combobox", { name: /select template/i });
    fireEvent.change(templateSelect, { target: { value: "template-1" } });

    // Set past due date
    const dueDateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dueDateInput, { target: { value: "2020-01-01T00:00" } });

    // Submit
    const submitButton = screen.getByText(/create quest/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
      expect(questTemplateService.createQuestFromTemplate).not.toHaveBeenCalled();
    });
  });
});
