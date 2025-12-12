import { render, screen } from "@testing-library/react";
import { LevelUpModal } from "./LevelUpModal";
import { useReducedMotion } from "@/hooks/useReducedMotion";

jest.mock("@/hooks/useReducedMotion");
jest.mock("./ParticleEffect", () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe("LevelUpModal accessibility and edge cases", () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const { container } = render(
        <LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "level-up-title");
    });

    it("should have properly labeled title", () => {
      render(<LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />);
      const title = screen.getByText("LEVEL UP!");
      expect(title).toHaveAttribute("id", "level-up-title");
    });

    it("should have aria-hidden on backdrop", () => {
      const { container } = render(
        <LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it("should have a focusable dismiss button", () => {
      render(<LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />);

      const continueButton = screen.getByRole("button", {
        name: /continue your journey/i,
      });

      expect(continueButton).toBeInTheDocument();
      expect(continueButton.tagName).toBe("BUTTON");
    });
  });

  describe("Edge Cases", () => {
    it("should handle level 1 to level 2", () => {
      render(<LevelUpModal show oldLevel={1} newLevel={2} onDismiss={mockOnDismiss} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.queryByText(/You gained \d+ levels!/)).not.toBeInTheDocument();
    });

    it("should handle large level numbers", () => {
      render(<LevelUpModal show oldLevel={99} newLevel={100} onDismiss={mockOnDismiss} />);

      expect(screen.getByText("99")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("should handle large level jumps", () => {
      render(<LevelUpModal show oldLevel={1} newLevel={10} onDismiss={mockOnDismiss} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("You gained 9 levels!")).toBeInTheDocument();
    });

    it("should display congratulations message", () => {
      render(<LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />);

      expect(screen.getByText("Congratulations! You've grown stronger on your quest!")).toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("should remove event listeners when unmounted", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <LevelUpModal show oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it("should not set up event listeners when show is false", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      render(<LevelUpModal show={false} oldLevel={5} newLevel={6} onDismiss={mockOnDismiss} />);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });
});
