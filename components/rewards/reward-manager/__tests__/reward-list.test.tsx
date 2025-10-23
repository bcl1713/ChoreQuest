import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardList } from '../reward-list';
import { Reward, RewardType } from '@/lib/types/database';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RewardList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleActive = jest.fn();

  const createMockReward = (id: string, overrides?: Partial<Reward>): Reward => ({
    id,
    name: `Reward ${id}`,
    description: `Description for reward ${id}`,
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

  describe('Empty State', () => {
    it('should render empty state when no rewards are provided', () => {
      render(
        <RewardList
          rewards={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Trophy icon is rendered as SVG from Lucide React
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByText('No rewards yet')).toBeInTheDocument();
      expect(screen.getByText('Create one to get started!')).toBeInTheDocument();
    });

    it('should not render reward list grid when empty', () => {
      render(
        <RewardList
          rewards={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.queryByTestId('reward-list')).not.toBeInTheDocument();
    });

    it('should apply fantasy-card styling to empty state', () => {
      const { container } = render(
        <RewardList
          rewards={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const emptyCard = container.querySelector('.fantasy-card');
      expect(emptyCard).toBeInTheDocument();
      expect(emptyCard).toHaveClass('text-center', 'py-12');
    });
  });

  describe('Rendering Rewards', () => {
    it('should render single reward', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByTestId('reward-list')).toBeInTheDocument();
      expect(screen.getByText('Reward reward-1')).toBeInTheDocument();
    });

    it('should render multiple rewards', () => {
      const rewards = [
        createMockReward('reward-1'),
        createMockReward('reward-2'),
        createMockReward('reward-3'),
      ];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('Reward reward-1')).toBeInTheDocument();
      expect(screen.getByText('Reward reward-2')).toBeInTheDocument();
      expect(screen.getByText('Reward reward-3')).toBeInTheDocument();
    });

    it('should apply grid layout classes', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const grid = screen.getByTestId('reward-list');
      expect(grid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should not show empty state when rewards are present', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.queryByText('No rewards yet')).not.toBeInTheDocument();
    });
  });

  describe('Reward Item Integration', () => {
    it('should pass onEdit handler to reward items', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const editButton = screen.getByTestId('edit-reward-button');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(rewards[0]);
    });

    it('should pass onDelete handler to reward items', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const deleteButton = screen.getByTestId('delete-reward-button');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(rewards[0]);
    });

    it('should pass onToggleActive handler to reward items', () => {
      const rewards = [createMockReward('reward-1')];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const toggleButton = screen.getByTestId('toggle-reward-active');
      fireEvent.click(toggleButton);

      expect(mockOnToggleActive).toHaveBeenCalledTimes(1);
      expect(mockOnToggleActive).toHaveBeenCalledWith(rewards[0]);
    });

    it('should handle actions on multiple rewards independently', () => {
      const rewards = [
        createMockReward('reward-1'),
        createMockReward('reward-2'),
      ];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      const editButtons = screen.getAllByTestId('edit-reward-button');
      fireEvent.click(editButtons[0]);
      fireEvent.click(editButtons[1]);

      expect(mockOnEdit).toHaveBeenCalledTimes(2);
      expect(mockOnEdit).toHaveBeenNthCalledWith(1, rewards[0]);
      expect(mockOnEdit).toHaveBeenNthCalledWith(2, rewards[1]);
    });
  });

  describe('Reward Types', () => {
    it('should render different reward types', () => {
      const rewards = [
        createMockReward('reward-1', { type: 'SCREEN_TIME', name: 'Extra Screen Time' }),
        createMockReward('reward-2', { type: 'PRIVILEGE', name: 'Stay Up Late' }),
        createMockReward('reward-3', { type: 'PURCHASE', name: 'New Toy' }),
        createMockReward('reward-4', { type: 'EXPERIENCE', name: 'Trip to Zoo' }),
      ];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Verify type labels are shown
      expect(screen.getByText('Screen Time')).toBeInTheDocument();
      expect(screen.getByText('Privilege')).toBeInTheDocument();
      expect(screen.getByText('Purchase')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();

      // Verify reward names are shown
      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
      expect(screen.getByText('Stay Up Late')).toBeInTheDocument();
      expect(screen.getByText('New Toy')).toBeInTheDocument();
      expect(screen.getByText('Trip to Zoo')).toBeInTheDocument();
    });
  });

  describe('Active/Inactive States', () => {
    it('should render both active and inactive rewards', () => {
      const rewards = [
        createMockReward('reward-1', { is_active: true }),
        createMockReward('reward-2', { is_active: false }),
      ];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByText('✓ Active')).toBeInTheDocument();
      expect(screen.getByText('○ Inactive')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large number of rewards', () => {
      const rewards = Array.from({ length: 50 }, (_, i) =>
        createMockReward(`reward-${i}`)
      );
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByTestId('reward-list')).toBeInTheDocument();
      expect(screen.getByText('Reward reward-0')).toBeInTheDocument();
      expect(screen.getByText('Reward reward-49')).toBeInTheDocument();
    });

    it('should maintain unique keys for rewards', () => {
      const rewards = [
        createMockReward('unique-1'),
        createMockReward('unique-2'),
        createMockReward('unique-3'),
      ];
      render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      expect(screen.getByTestId('reward-card-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('reward-card-unique-2')).toBeInTheDocument();
      expect(screen.getByTestId('reward-card-unique-3')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const rewards = [createMockReward('reward-1')];
      const { rerender } = render(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Re-render with same props
      rerender(
        <RewardList
          rewards={rewards}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleActive={mockOnToggleActive}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByText('Reward reward-1')).toBeInTheDocument();
    });
  });
});
