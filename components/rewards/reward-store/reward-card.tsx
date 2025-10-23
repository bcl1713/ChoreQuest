"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Reward } from '@/lib/types/database';
import { Button } from '@/components/ui';
import { Smartphone, Star, Coins, Lightbulb, Loader, Lock, Zap } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  redemptionStatus: 'PENDING' | 'APPROVED' | null;
  isRedeeming: boolean;
  onRedeem: (reward: Reward) => void;
}

// Icon components for reward types
const REWARD_TYPE_ICONS: Record<string, typeof Smartphone> = {
  SCREEN_TIME: Smartphone,
  PRIVILEGE: Star,
  PURCHASE: Coins,
  EXPERIENCE: Lightbulb,
};

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
    if (redemptionStatus === 'PENDING') return 'Request Pending';
    if (redemptionStatus === 'APPROVED') return 'Approved';
    if (!canAfford) return 'Insufficient Gold';
    return 'Redeem Reward';
  }, [redemptionStatus, canAfford]);

  const getButtonIcon = () => {
    if (redemptionStatus === 'PENDING') return <Loader size={16} aria-hidden="true" />;
    if (!canAfford) return <Lock size={16} aria-hidden="true" />;
    return <Zap size={16} aria-hidden="true" />;
  };

  const isDisabled = !canAfford || !!redemptionStatus;
  const variant = canAfford && !redemptionStatus ? 'gold' : 'secondary';

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
          {(() => {
            const IconComponent = REWARD_TYPE_ICONS[reward.type];
            return <IconComponent size={32} aria-hidden="true" className="text-gold-400" />;
          })()}
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
        <span className="text-xl font-bold gold-text flex items-center gap-1">
          <Coins size={20} aria-hidden="true" className="text-gold-400" />
          {reward.cost} gold
        </span>
      </div>

      <Button
        data-testid="reward-store-redeem-button"
        onClick={() => onRedeem(reward)}
        disabled={isDisabled}
        isLoading={isRedeeming}
        variant={variant}
        size="sm"
        fullWidth
        startIcon={isRedeeming ? undefined : getButtonIcon()}
      >
        {isRedeeming ? 'Redeeming...' : buttonText}
      </Button>
    </motion.div>
  );
});

RewardCard.displayName = 'RewardCard';

export default RewardCard;
