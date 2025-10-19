"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Reward } from '@/lib/types/database';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  redemptionStatus: 'PENDING' | 'APPROVED' | null;
  isRedeeming: boolean;
  onRedeem: (reward: Reward) => void;
}

// Constants defined outside component for performance
const REWARD_TYPE_ICONS: Record<string, string> = {
  SCREEN_TIME: '📱',
  PRIVILEGE: '⭐',
  PURCHASE: '💰',
  EXPERIENCE: '🎈',
} as const;

const REWARD_TYPE_LABELS: Record<string, string> = {
  SCREEN_TIME: 'Screen Time',
  PRIVILEGE: 'Privilege',
  PURCHASE: 'Purchase',
  EXPERIENCE: 'Experience',
} as const;

/**
 * RewardCard - Individual reward display card
 *
 * Displays a single reward with icon, name, description, cost, and redemption button.
 * Handles different states: affordable, insufficient gold, pending, approved, redeeming.
 */
const RewardCard = React.memo<RewardCardProps>(({
  reward,
  canAfford,
  redemptionStatus,
  isRedeeming,
  onRedeem,
}) => {
  const buttonText = useMemo(() => {
    if (isRedeeming) return null; // Spinner will be shown
    if (redemptionStatus === 'PENDING') return '⏳ Request Pending';
    if (redemptionStatus === 'APPROVED') return '✓ Approved';
    if (!canAfford) return '🔒 Insufficient Gold';
    return '⚡ Redeem Reward';
  }, [isRedeeming, redemptionStatus, canAfford]);

  const isDisabled = !canAfford || !!redemptionStatus || isRedeeming;

  const buttonClasses = useMemo(() => {
    return `w-full py-2 px-4 rounded-lg font-medium transition-all ${
      canAfford && !redemptionStatus && !isRedeeming
        ? 'bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white shadow-md'
        : 'bg-dark-600 text-gray-400 border border-dark-500 cursor-not-allowed'
    }`;
  }, [canAfford, redemptionStatus, isRedeeming]);

  return (
    <motion.div
      data-testid={`reward-store-card-${reward.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fantasy-card p-6 hover:border-gold-500/50 transition-all ${
        !canAfford && !redemptionStatus ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{REWARD_TYPE_ICONS[reward.type]}</span>
          <div>
            <h3 className="font-fantasy text-lg text-gray-100">{reward.name}</h3>
            <p className="text-sm text-gray-400">
              {REWARD_TYPE_LABELS[reward.type]}
            </p>
          </div>
        </div>
        {redemptionStatus && (
          <span className={`text-xs px-2 py-1 rounded ${
            redemptionStatus === 'PENDING'
              ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-600/50'
              : 'bg-green-900/30 text-green-300 border border-green-600/50'
          }`}>
            {redemptionStatus === 'PENDING' ? 'Pending' : 'Approved'}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400 mb-4">{reward.description}</p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-bold gold-text">
          💰 {reward.cost} gold
        </span>
      </div>

      <button
        data-testid="reward-store-redeem-button"
        onClick={() => onRedeem(reward)}
        disabled={isDisabled}
        className={buttonClasses}
      >
        {isRedeeming ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Redeeming...</span>
          </div>
        ) : (
          buttonText
        )}
      </button>
    </motion.div>
  );
});

RewardCard.displayName = 'RewardCard';

export default RewardCard;
