import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CharacterCreation from "./CharacterCreation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Character } from "@/lib/types/database";

// Mock dependencies
jest.mock("@/lib/auth-context");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock("framer-motion", () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
}));
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));
jest.mock("@/components/ui", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FantasyButton: ({ children, className, disabled, type, isLoading, ...props }: any) => (
    <button className={className} disabled={disabled} type={type} {...props}>
      {isLoading ? "Loading..." : children}
    </button>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("CharacterCreation - Class Selection Visual Indicator", () => {
  const mockOnCharacterCreated = jest.fn();
  const mockUser = { id: "test-user-id", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateUserProfile: jest.fn(),
    });
  });

  describe("Visual styling for selected class", () => {
    it("should apply strong visual indicators (ring-4, glow-effect-gold, bg-gold-900/40) to selected class", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      // Find and click the Knight class card
      const knightCard = screen.getByTestId("class-knight");
      fireEvent.click(knightCard);

      // Verify all required visual classes are applied
      expect(knightCard.className).toContain("ring-4");
      expect(knightCard.className).toContain("ring-gold-500");
      expect(knightCard.className).toContain("bg-gold-900/40");
      expect(knightCard.className).toContain("border-gold-500/50");
      expect(knightCard.className).toContain("glow-effect-gold");
    });

    it("should not apply selected styles to unselected classes", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      // Click Knight
      const knightCard = screen.getByTestId("class-knight");
      fireEvent.click(knightCard);

      // Verify other classes don't have selected styling
      const mageCard = screen.getByTestId("class-mage");
      expect(mageCard.className).not.toContain("ring-4");
      expect(mageCard.className).not.toContain("glow-effect-gold");
      expect(mageCard.className).not.toContain("bg-gold-900/40");
    });

    it("should transfer selection styling when clicking a different class", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      const knightCard = screen.getByTestId("class-knight");
      const mageCard = screen.getByTestId("class-mage");

      // Select Knight first
      fireEvent.click(knightCard);
      expect(knightCard.className).toContain("ring-4");
      expect(knightCard.className).toContain("glow-effect-gold");

      // Select Mage
      fireEvent.click(mageCard);

      // Knight should no longer have selected styling
      expect(knightCard.className).not.toContain("ring-4");
      expect(knightCard.className).not.toContain("glow-effect-gold");
      expect(knightCard.className).not.toContain("bg-gold-900/40");

      // Mage should now have selected styling
      expect(mageCard.className).toContain("ring-4");
      expect(mageCard.className).toContain("ring-gold-500");
      expect(mageCard.className).toContain("bg-gold-900/40");
      expect(mageCard.className).toContain("glow-effect-gold");
    });

    it("should only allow one class to be selected at a time", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      const knightCard = screen.getByTestId("class-knight");
      const mageCard = screen.getByTestId("class-mage");
      const rogueCard = screen.getByTestId("class-rogue");

      // Click through multiple classes
      fireEvent.click(knightCard);
      fireEvent.click(mageCard);
      fireEvent.click(rogueCard);

      // Count how many cards have the selected styling
      const allCards = [knightCard, mageCard, rogueCard];
      const selectedCards = allCards.filter((card) =>
        card.className.includes("ring-4") &&
        card.className.includes("glow-effect-gold")
      );

      expect(selectedCards).toHaveLength(1);
      expect(rogueCard.className).toContain("ring-4");
      expect(rogueCard.className).toContain("glow-effect-gold");
    });

    it("should maintain hover styling for unselected classes", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      const knightCard = screen.getByTestId("class-knight");
      const mageCard = screen.getByTestId("class-mage");

      // Select Knight
      fireEvent.click(knightCard);

      // Verify unselected Mage still has hover border style
      expect(mageCard.className).toContain("hover:border-gold-500/30");
    });
  });

  describe("Character creation with selected class", () => {
    it("should create character with selected class when form is submitted", async () => {
      const mockCharacter: Character = {
        id: "char-1",
        user_id: mockUser.id,
        name: "Test Hero",
        class: "KNIGHT",
        level: 1,
        xp: 0,
        gold: 0,
        honor: 0,
        gems: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock the database calls
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockUser.id,
              name: "Test User",
              role: "player",
              family_id: "family-1",
            },
            error: null,
          }),
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCharacter,
            error: null,
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockImplementation((table: string): any => {
        if (table === "user_profiles") {
          return { select: mockSelect };
        }
        if (table === "characters") {
          return { insert: mockInsert };
        }
        return {};
      });

      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      // Fill in character name
      const nameInput = screen.getByLabelText(/Hero Name/i);
      fireEvent.change(nameInput, { target: { value: "Test Hero" } });

      // Select a class
      const knightCard = screen.getByTestId("class-knight");
      fireEvent.click(knightCard);

      // Submit form
      const submitButton = screen.getByRole("button", { name: /Begin Your Quest/i });
      fireEvent.click(submitButton);

      // Wait for character creation to complete
      await waitFor(() => {
        expect(mockOnCharacterCreated).toHaveBeenCalledWith(mockCharacter);
      });
    });

    it("should disable submit button when no class is selected", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      const nameInput = screen.getByLabelText(/Hero Name/i);
      fireEvent.change(nameInput, { target: { value: "Test Hero" } });

      const submitButton = screen.getByRole("button", { name: /Begin Your Quest/i });

      // Button should be disabled when no class is selected
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when class is selected and name is entered", () => {
      render(<CharacterCreation onCharacterCreated={mockOnCharacterCreated} />);

      const nameInput = screen.getByLabelText(/Hero Name/i);
      fireEvent.change(nameInput, { target: { value: "Test Hero" } });

      const knightCard = screen.getByTestId("class-knight");
      fireEvent.click(knightCard);

      const submitButton = screen.getByRole("button", { name: /Begin Your Quest/i });

      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });
});
