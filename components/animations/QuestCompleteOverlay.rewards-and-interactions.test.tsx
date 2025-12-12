import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestCompleteOverlay, QuestReward } from './QuestCompleteOverlay';
import { useReducedMotion } from '@/hooks/useReducedMotion';

jest.mock('@/hooks/useReducedMotion');
jest.mock('./ParticleEffect', () => ({
  ParticleEffect: ({ active }: { active: boolean }) =>
    active ? <div data-testid="particle-effect" /> : null,
}));

describe('QuestCompleteOverlay - rewards and interactions', () => {
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

  describe('Rewards Display', () => {
    it('should display rewards correctly', () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      expect(screen.getByText(/Gold/)).toBeInTheDocument();
      expect(screen.getByText(/XP/)).toBeInTheDocument();
      expect(screen.getByText(/Gems/)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle missing rewards gracefully', () => {
      render(<QuestCompleteOverlay show rewards={null as unknown as QuestReward} onDismiss={mockOnDismiss} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle zero rewards', () => {
      render(<QuestCompleteOverlay show rewards={{ gold: 0, xp: 0, gems: 0 }} onDismiss={mockOnDismiss} />);

      expect(screen.getAllByText('0')).toHaveLength(3);
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when button clicked', async () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      const closeButton = screen.getByRole('button', { name: /Continue/i });
      await userEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render button when show is false', () => {
      render(<QuestCompleteOverlay show={false} rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      expect(screen.queryByRole('button', { name: /Continue/i })).not.toBeInTheDocument();
    });

    it('should not call onDismiss multiple times from rapid clicks', async () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      const closeButton = screen.getByRole('button', { name: /Continue/i });
      await userEvent.click(closeButton);
      await userEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard interaction', async () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      const closeButton = screen.getByRole('button', { name: /Continue/i });
      closeButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should focus the continue button when overlay is shown', async () => {
      render(<QuestCompleteOverlay show rewards={defaultRewards} onDismiss={mockOnDismiss} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue/i })).toHaveFocus();
      });
    });
  });
});
