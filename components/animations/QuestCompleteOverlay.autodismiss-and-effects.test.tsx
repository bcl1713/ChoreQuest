import { render, screen, waitFor } from '@testing-library/react';
import { QuestCompleteOverlay, QuestReward } from './QuestCompleteOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';

jest.mock('@/hooks/useReducedMotion');
jest.mock('./ParticleEffect', () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe('QuestCompleteOverlay - auto-dismiss and effects', () => {
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

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after duration when autoDismiss is true', async () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismiss
          dismissDuration={2000}
        />,
      );

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-dismiss when autoDismiss is false', () => {
      render(
        <QuestCompleteOverlay
          show
          rewards={defaultRewards}
          onDismiss={mockOnDismiss}
          autoDismiss={false}
          dismissDuration={2000}
        />,
      );

      jest.advanceTimersByTime(2000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Particle Effects', () => {
    it('should render particle effects when not reduced motion', () => {
      (useReducedMotion as jest.Mock).mockReturnValue(false);
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      expect(screen.getByTestId('particle-effect')).toBeInTheDocument();
    });

    it('should not render particle effects when reduced motion is enabled', () => {
      (useReducedMotion as jest.Mock).mockReturnValue(true);
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      expect(screen.queryByTestId('particle-effect')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should announce quest completion to screen readers', () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should include aria-live region for updates', () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});
