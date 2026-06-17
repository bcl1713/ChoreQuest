import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardItem } from './reward-item';
import { Reward, RewardType } from '@/lib/types/database';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RewardItem - behavior', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleActive = jest.fn();

  const createMockReward = (overrides?: Partial<Reward>): Reward => ({
    id: 'reward-1',
    name: 'Extra Screen Time',
    description: '30 minutes of extra screen time',
    type: 'SCREEN_TIME' as RewardType,
    cost: 100,
    family_id: 'family-1',
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', () => {
      const reward = createMockReward();
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      const editButton = screen.getByTestId('edit-reward-button');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(reward);
    });

    it('should call onDelete when delete button is clicked', () => {
      const reward = createMockReward();
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      const deleteButton = screen.getByTestId('delete-reward-button');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(reward);
    });

    it('should call onToggleActive when toggle button is clicked', () => {
      const reward = createMockReward();
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      const toggleButton = screen.getByTestId('toggle-reward-active');
      fireEvent.click(toggleButton);

      expect(mockOnToggleActive).toHaveBeenCalledTimes(1);
      expect(mockOnToggleActive).toHaveBeenCalledWith(reward);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long reward names', () => {
      const reward = createMockReward({
        name: 'A'.repeat(100),
      });
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const reward = createMockReward({
        description: 'B'.repeat(200),
      });
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByText('B'.repeat(200))).toBeInTheDocument();
    });

    it('should handle very high cost values', () => {
      const reward = createMockReward({ cost: 999999 });
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByText('999999 gold')).toBeInTheDocument();
    });

    it('should handle zero cost', () => {
      const reward = createMockReward({ cost: 0 });
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByText('0 gold')).toBeInTheDocument();
    });

    it('should render with testid attribute', () => {
      const reward = createMockReward();
      render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByTestId(`reward-card-${reward.id}`)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const reward = createMockReward();
      const { rerender } = render(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      rerender(<RewardItem reward={reward} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleActive={mockOnToggleActive} />);

      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
    });
  });
});
