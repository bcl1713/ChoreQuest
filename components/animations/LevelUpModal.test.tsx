import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelUpModal } from './LevelUpModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Mock dependencies
jest.mock('@/hooks/useReducedMotion');
jest.mock('./ParticleEffect', () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe('LevelUpModal', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  describe('Visibility', () => {
    it('should render when show is true', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('LEVEL UP!')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(
        <LevelUpModal
          show={false}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText('LEVEL UP!')).not.toBeInTheDocument();
    });
  });

  describe('Level Display', () => {
    it('should display old and new levels', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={3}
          newLevel={4}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display correct levels for multi-level up', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={8}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should show multi-level message when gaining more than 1 level', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={8}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('You gained 3 levels!')).toBeInTheDocument();
    });

    it('should not show multi-level message for single level up', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText(/You gained \d+ levels!/)).not.toBeInTheDocument();
    });
  });

  describe('Character Information', () => {
    it('should display character name when provided', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          characterName="Aragorn"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Aragorn')).toBeInTheDocument();
    });

    it('should display character class when provided', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          characterClass="Knight"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Knight')).toBeInTheDocument();
    });

    it('should display both name and class together', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          characterName="Gandalf"
          characterClass="Wizard"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Gandalf')).toBeInTheDocument();
      expect(screen.getByText('Wizard')).toBeInTheDocument();
      expect(screen.getByText(/the/)).toBeInTheDocument(); // "the" separator
    });

    it('should not show character info section when neither name nor class provided', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      // Should just show level up text and levels
      expect(screen.getByText('LEVEL UP!')).toBeInTheDocument();
      expect(screen.queryByText(/the/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when Continue button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      const continueButton = screen.getByText('Continue Your Journey');
      await user.click(continueButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss for other key presses', async () => {
      const user = userEvent.setup();
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      await user.keyboard('{Enter}');
      await user.keyboard('a');

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Particle Effects', () => {
    it('should render particle effect when shown', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId('particle-effect')).toBeInTheDocument();
    });

    it('should not render particle effect when hidden', () => {
      render(
        <LevelUpModal
          show={false}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByTestId('particle-effect')).not.toBeInTheDocument();
    });
  });
});
