import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestCompleteOverlay, QuestReward } from './QuestCompleteOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Mock dependencies
jest.mock('@/hooks/useReducedMotion');
jest.mock('./ParticleEffect', () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe('QuestCompleteOverlay', () => {
  const mockOnDismiss = jest.fn();
  const defaultRewards: QuestReward = {
    gold: 100,
    xp: 50,
    gems: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Visibility', () => {
    it('should render when show is true', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Quest Complete!')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(
        <QuestCompleteOverlay
          show={false}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText('Quest Complete!')).not.toBeInTheDocument();
    });
  });

  describe('Quest Title', () => {
    it('should display default quest title', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Quest Complete!')).toBeInTheDocument();
    });

    it('should display custom quest title', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          questTitle="Epic Quest Completed!"
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Epic Quest Completed!')).toBeInTheDocument();
    });
  });

  describe('Rewards Display', () => {
    it('should display gold reward', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ gold: 250 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('250 Gold')).toBeInTheDocument();
    });

    it('should display XP reward', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ xp: 150 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('150 XP')).toBeInTheDocument();
    });

    it('should display gems reward', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ gems: 10 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('10 Gems')).toBeInTheDocument();
    });

    it('should display all rewards together', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ gold: 100, xp: 50, gems: 5 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('100 Gold')).toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
      expect(screen.getByText('5 Gems')).toBeInTheDocument();
    });

    it('should display custom reward', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ customReward: 'Legendary Sword Unlocked!' }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Legendary Sword Unlocked!')).toBeInTheDocument();
    });

    it('should format large numbers with locale string', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ gold: 1000000 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('1,000,000 Gold')).toBeInTheDocument();
    });

    it('should not display rewards with 0 value', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ gold: 0, xp: 100 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText('0 Gold')).not.toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
    });

    it('should not display undefined rewards', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={{ xp: 50 }}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByText(/Gold/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Gems/)).not.toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Continue Adventure button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      const continueButton = screen.getByText('Continue Adventure');
      await user.click(continueButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when backdrop is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      // Backdrop is the first motion.div with backdrop-blur
      const backdrop = container.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration (5000ms)', async () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Fast-forward time by 5000ms
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      });
    });

    it('should auto-dismiss after custom duration', async () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={3000}
        />
      );

      expect(mockOnDismiss).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-dismiss if duration is 0', async () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={0}
        />
      );

      jest.advanceTimersByTime(10000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should reset auto-dismiss timer when show changes', () => {
      const { rerender } = render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={5000}
        />
      );

      jest.advanceTimersByTime(3000);

      // Hide the overlay
      rerender(
        <QuestCompleteOverlay
          show={false}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={5000}
        />
      );

      // Show it again
      rerender(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismissDuration={5000}
        />
      );

      // Timer should have reset, so advancing by 3000ms shouldn't trigger dismiss
      jest.advanceTimersByTime(3000);
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // But advancing by full 5000ms should
      jest.advanceTimersByTime(2000);
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  describe('Particle Effects', () => {
    it('should render particle effect when shown', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByTestId('particle-effect')).toBeInTheDocument();
    });

    it('should not render particle effect when hidden', () => {
      render(
        <QuestCompleteOverlay
          show={false}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.queryByTestId('particle-effect')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on close button', () => {
      render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have aria-hidden on backdrop', () => {
      const { container } = render(
        <QuestCompleteOverlay
          show={true}
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
        />
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
