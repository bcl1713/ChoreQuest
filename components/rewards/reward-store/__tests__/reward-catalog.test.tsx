import React from 'react';
import { render, screen } from '@testing-library/react';
import RewardCatalog from '../reward-catalog';
import { Reward } from '@/lib/types/database';

describe('RewardCatalog', () => {
  const mockRewards: Reward[] = [
    {
      id: '1',
      family_id: 'family-1',
      name: 'Extra Screen Time',
      description: '30 minutes of extra screen time',
      type: 'SCREEN_TIME',
      cost: 50,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
    },
    {
      id: '2',
      family_id: 'family-1',
      name: 'Choose Dinner',
      description: 'Pick what we have for dinner',
      type: 'PRIVILEGE',
      cost: 75,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'user-1',
    },
  ];

  it('renders rewards in a grid layout', () => {
    render(
      <RewardCatalog rewards={mockRewards}>
        {(reward) => <div data-testid={`reward-${reward.id}`}>{reward.name}</div>}
      </RewardCatalog>
    );

    expect(screen.getByTestId('reward-store-grid')).toBeInTheDocument();
    expect(screen.getByTestId('reward-1')).toBeInTheDocument();
    expect(screen.getByTestId('reward-2')).toBeInTheDocument();
  });

  it('applies correct grid classes for responsive layout', () => {
    render(
      <RewardCatalog rewards={mockRewards}>
        {(reward) => <div>{reward.name}</div>}
      </RewardCatalog>
    );

    const grid = screen.getByTestId('reward-store-grid');
    expect(grid).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('displays empty state when no rewards available', () => {
    render(
      <RewardCatalog rewards={[]}>
        {(reward) => <div>{reward.name}</div>}
      </RewardCatalog>
    );

    expect(screen.getByTestId('no-rewards-message')).toBeInTheDocument();
    expect(screen.getByText('No rewards available at this time.')).toBeInTheDocument();
  });

  it('does not render grid when empty', () => {
    render(
      <RewardCatalog rewards={[]}>
        {(reward) => <div>{reward.name}</div>}
      </RewardCatalog>
    );

    expect(screen.queryByTestId('reward-store-grid')).not.toBeInTheDocument();
  });

  it('renders all rewards using render prop', () => {
    render(
      <RewardCatalog rewards={mockRewards}>
        {(reward) => (
          <div data-testid={`custom-${reward.id}`}>
            Custom: {reward.name} - {reward.cost} gold
          </div>
        )}
      </RewardCatalog>
    );

    expect(screen.getByTestId('custom-1')).toHaveTextContent('Custom: Extra Screen Time - 50 gold');
    expect(screen.getByTestId('custom-2')).toHaveTextContent('Custom: Choose Dinner - 75 gold');
  });

  it('handles single reward', () => {
    const singleReward = [mockRewards[0]];
    render(
      <RewardCatalog rewards={singleReward}>
        {(reward) => <div data-testid="single-reward">{reward.name}</div>}
      </RewardCatalog>
    );

    expect(screen.getByTestId('single-reward')).toBeInTheDocument();
    expect(screen.getByTestId('reward-store-grid')).toBeInTheDocument();
  });

  it('maintains unique keys for each reward', () => {
    const { container } = render(
      <RewardCatalog rewards={mockRewards}>
        {(reward) => <div data-reward-id={reward.id}>{reward.name}</div>}
      </RewardCatalog>
    );

    const rewardElements = container.querySelectorAll('[data-reward-id]');
    expect(rewardElements).toHaveLength(2);
    expect(rewardElements[0]).toHaveAttribute('data-reward-id', '1');
    expect(rewardElements[1]).toHaveAttribute('data-reward-id', '2');
  });
});
