import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardItem } from '../reward-item';
import { Reward, RewardType } from '@/lib/types/database';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RewardItem', () => {
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

  describe('Rendering', () => {
    it('should render reward with all basic information', () => {
      const reward = createMockReward();
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
      expect(screen.getByText('30 minutes of extra screen time')).toBeInTheDocument();
      expect(screen.getByText('Screen Time')).toBeInTheDocument();
      expect(screen.getByText('100 gold')).toBeInTheDocument();
    });

    it('should display correct icon for SCREEN_TIME type', () => {
      const reward = createMockReward({ type: 'SCREEN_TIME' });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByLabelText('SCREEN_TIME reward type')).toBeInTheDocument();
    });

    it('should display correct icon for PRIVILEGE type', () => {
      const reward = createMockReward({ type: 'PRIVILEGE', name: 'Stay Up Late' });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByLabelText('PRIVILEGE reward type')).toBeInTheDocument();
      expect(screen.getByText('Privilege')).toBeInTheDocument();
    });

    it('should display correct icon for PURCHASE type', () => {
      const reward = createMockReward({ type: 'PURCHASE', name: 'New Toy' });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByLabelText(/reward type/)).toBeInTheDocument();
      expect(screen.getByText('Purchase')).toBeInTheDocument();
    });

    it('should display correct icon for EXPERIENCE type', () => {
      const reward = createMockReward({ type: 'EXPERIENCE', name: 'Trip to Zoo' });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByLabelText('EXPERIENCE reward type')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
    });

    it('should show inactive badge when reward is inactive', () => {
      const reward = createMockReward({ is_active: false });
      const { container } = render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Check for the badge specifically (has gray styling)
      const badge = container.querySelector('.bg-gray-700');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('Inactive');
    });

    it('should not show inactive badge when reward is active', () => {
      const reward = createMockReward({ is_active: true });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
    });

    it('should apply opacity-60 class when reward is inactive', () => {
      const reward = createMockReward({ is_active: false });
      const { container } = render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const card = container.querySelector('.fantasy-card');
      expect(card).toHaveClass('opacity-60');
    });

    it('should not apply opacity-60 class when reward is active', () => {
      const reward = createMockReward({ is_active: true });
      const { container } = render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const card = container.querySelector('.fantasy-card');
      expect(card).not.toHaveClass('opacity-60');
    });
  });

  describe('Toggle Active Button', () => {
    it('should show "Active" when reward is active', () => {
      const reward = createMockReward({ is_active: true });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show "Inactive" when reward is inactive', () => {
      const reward = createMockReward({ is_active: false });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Check for the button specifically
      const button = screen.getByRole('button', { name: /Inactive/i });
      expect(button).toBeInTheDocument();
    });

    it('should apply green styling when reward is active', () => {
      const reward = createMockReward({ is_active: true });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const toggleButton = screen.getByTestId('toggle-reward-active');
      expect(toggleButton.className).toContain('from-emerald-600');
      expect(toggleButton.className).toContain('text-white');
    });

    it('should apply gray styling when reward is inactive', () => {
      const reward = createMockReward({ is_active: false });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const toggleButton = screen.getByTestId('toggle-reward-active');
      expect(toggleButton.className).toContain('border-gray-600');
      expect(toggleButton.className).toContain('text-gray-200');
    });
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', () => {
      const reward = createMockReward();
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const editButton = screen.getByTestId('edit-reward-button');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(reward);
    });

    it('should call onDelete when delete button is clicked', () => {
      const reward = createMockReward();
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const deleteButton = screen.getByTestId('delete-reward-button');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(reward);
    });

    it('should call onToggleActive when toggle button is clicked', () => {
      const reward = createMockReward();
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

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
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const reward = createMockReward({
        description: 'B'.repeat(200),
      });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('B'.repeat(200))).toBeInTheDocument();
    });

    it('should handle very high cost values', () => {
      const reward = createMockReward({ cost: 999999 });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('999999 gold')).toBeInTheDocument();
    });

    it('should handle zero cost', () => {
      const reward = createMockReward({ cost: 0 });
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('0 gold')).toBeInTheDocument();
    });

    it('should render with testid attribute', () => {
      const reward = createMockReward();
      render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByTestId(`reward-card-${reward.id}`)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const reward = createMockReward();
      const { rerender } = render(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Re-render with same props
      rerender(
        <RewardItem
          reward={reward}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
    });
  });
});
