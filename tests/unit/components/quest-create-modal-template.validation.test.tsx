import { fireEvent, screen, waitFor } from "@testing-library/react";
import { questTemplateService } from "@/lib/quest-template-service";
import { renderTemplateModal } from "./quest-create-modal-template.fixtures";

describe("QuestCreateModal - template validation", () => {
  const mockOnClose = jest.fn();
  const mockOnQuestCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents submission when no template selected", async () => {
    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("From Template"));

    expect(screen.getByRole("combobox", { name: /select template/i })).toHaveValue("");
    expect(questTemplateService.createQuestFromTemplate).not.toHaveBeenCalled();
    expect(mockOnQuestCreated).not.toHaveBeenCalled();
  });

  it("shows error when template service fails", async () => {
    (questTemplateService.createQuestFromTemplate as jest.Mock).mockRejectedValue(
      new Error("Failed to create quest from template"),
    );
    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });

    fireEvent.click(screen.getByText("From Template"));
    fireEvent.change(screen.getByLabelText(/select template/i), { target: { value: "template-1" } });
    fireEvent.click(screen.getByText(/create quest/i));

    await waitFor(() => {
      expect(screen.getByText(/failed to create quest from template/i)).toBeInTheDocument();
      expect(mockOnQuestCreated).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("validates future due date in template mode", async () => {
    renderTemplateModal({ onClose: mockOnClose, onQuestCreated: mockOnQuestCreated });

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /assign to/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("From Template"));
    fireEvent.change(screen.getByRole("combobox", { name: /select template/i }), { target: { value: "template-1" } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: "2020-01-01T00:00" } });
    fireEvent.click(screen.getByText(/create quest/i));

    await waitFor(() => {
      expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
      expect(questTemplateService.createQuestFromTemplate).not.toHaveBeenCalled();
    });
  });
});
