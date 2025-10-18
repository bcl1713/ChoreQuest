import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelUpModal } from './LevelUpModal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';

// Mock dependencies
jest.mock('@/hooks/useReducedMotion');
jest.mock('./ParticleEffect', () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

jest.mock('framer-motion', () => {
  // Filter out framer-motion specific props
  const filterProps = ({ whileHover, whileTap, animate, initial, exit, variants, transition, ...rest }: Record<string, unknown>): Record<string, unknown> => {
    // Void the unused variables to satisfy linter
    void whileHover; void whileTap; void animate; void initial; void exit; void variants; void transition;
    return rest;
  };

  const MockMotionDiv = ({ children, className, ...props }: Record<string, unknown>) => (
    <div className={className as string} {...filterProps(props)}>
      {children as React.ReactNode}
    </div>
  );
  MockMotionDiv.displayName = 'motion.div';

  const MockMotionButton = React.forwardRef<HTMLButtonElement, Record<string, unknown>>(
    ({ children, className, ...props }: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) => (
      <button ref={ref} className={className as string} {...filterProps(props)}>
        {children as React.ReactNode}
      </button>
    )
  );
  MockMotionButton.displayName = 'motion.button';

  const MockAnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockAnimatePresence.displayName = 'AnimatePresence';

  return {
    motion: {
      div: MockMotionDiv,
      button: MockMotionButton,
    },
    AnimatePresence: MockAnimatePresence,
  };
});

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

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'level-up-title');
    });

    it('should have properly labeled title', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      const title = screen.getByText('LEVEL UP!');
      expect(title).toHaveAttribute('id', 'level-up-title');
    });

    it('should have aria-hidden on backdrop', () => {
      const { container } = render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have a focusable dismiss button', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      const continueButton = screen.getByRole('button', {
        name: /continue your journey/i,
      });

      // Verify button exists and can receive focus
      expect(continueButton).toBeInTheDocument();
      expect(continueButton.tagName).toBe('BUTTON');

      // Note: Auto-focus happens via useEffect with setTimeout,
      // which is difficult to test reliably in JSDOM environment
    });
  });

  describe('Edge Cases', () => {
    it('should handle level 1 to level 2', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={1}
          newLevel={2}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText(/You gained \d+ levels!/)).not.toBeInTheDocument();
    });

    it('should handle large level numbers', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={99}
          newLevel={100}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle large level jumps', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={1}
          newLevel={10}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('You gained 9 levels!')).toBeInTheDocument();
    });

    it('should display congratulations message', () => {
      render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(
        screen.getByText("Congratulations! You've grown stronger on your quest!")
      ).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners when unmounted', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <LevelUpModal
          show={true}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should not set up event listeners when show is false', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(
        <LevelUpModal
          show={false}
          oldLevel={5}
          newLevel={6}
          onDismiss={mockOnDismiss}
        />
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });
});
