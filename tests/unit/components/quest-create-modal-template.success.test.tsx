import { fireEvent, screen, waitFor } from "@testing-library/react";
import { questTemplateService } from "@/lib/quest-template-service";
import { renderTemplateModal } from "./quest-create-modal-template.fixtures";

describe("QuestCreateModal - template success paths", () => {
  const mockOnClose = jest.fn();
  const mockOnQuestCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates quest from template with default options", async () => {
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
    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(mockCreatedQuest);

    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });
    fireEvent.click(screen.getByText("From Template"));
    fireEvent.change(screen.getByRole("combobox", { name: /select template/i }), { target: { value: "template-1" } });
    fireEvent.click(screen.getByText(/create quest/i));

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith("template-1", "test-user-id", {
        assignedToId: undefined,
        dueDate: undefined,
      });
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("creates quest from template with assignment override", async () => {
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
    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(mockCreatedQuest);

    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });
    fireEvent.click(screen.getByText("From Template"));
    fireEvent.change(screen.getByRole("combobox", { name: /select template/i }), { target: { value: "template-2" } });
    fireEvent.change(screen.getByRole("combobox", { name: /assign to/i }), { target: { value: "member-1" } });
    fireEvent.click(screen.getByText(/create quest/i));

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith("template-2", "test-user-id", {
        assignedToId: "member-1",
        dueDate: undefined,
      });
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("creates quest from template with due date override", async () => {
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
    (questTemplateService.createQuestFromTemplate as jest.Mock).mockResolvedValue(mockCreatedQuest);

    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });
    fireEvent.click(screen.getByText("From Template"));
    fireEvent.change(screen.getByRole("combobox", { name: /select template/i }), { target: { value: "template-1" } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: "2025-12-31T23:59" } });
    fireEvent.click(screen.getByText(/create quest/i));

    await waitFor(() => {
      expect(questTemplateService.createQuestFromTemplate).toHaveBeenCalledWith(
        "template-1",
        "test-user-id",
        expect.objectContaining({ dueDate: expect.any(String) }),
      );
      expect(mockOnQuestCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
