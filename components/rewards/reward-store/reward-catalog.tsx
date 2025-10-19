"use client";

import React from 'react';
import { Reward } from '@/lib/types/database';

interface RewardCatalogProps {
  rewards: Reward[];
  children: (reward: Reward) => React.ReactNode;
}

/**
 * RewardCatalog - Grid display of available rewards
 *
 * Renders rewards in a responsive grid layout and delegates individual
 * reward rendering to a render prop function.
 */
const RewardCatalog = React.memo<RewardCatalogProps>(({ rewards, children }) => {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p data-testid="no-rewards-message">No rewards available at this time.</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      data-testid="reward-store-grid"
    >
      {rewards.map((reward) => (
        <React.Fragment key={reward.id}>
          {children(reward)}
        </React.Fragment>
      ))}
    </div>
  );
});

RewardCatalog.displayName = 'RewardCatalog';

export default RewardCatalog;
