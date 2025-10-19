"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RewardRedemption, UserProfile } from '@/lib/types/database';

interface RewardRedemptionWithDetails extends RewardRedemption {
  user_profiles: UserProfile;
  reward_name: string;
  reward_description: string;
  reward_type: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
}

interface RedemptionHistoryProps {
  redemptions: RewardRedemptionWithDetails[];
  isGuildMaster: boolean;
  onApprove?: (redemptionId: string) => void;
  onDeny?: (redemptionId: string) => void;
  onFulfill?: (redemptionId: string) => void;
}

const REWARD_TYPE_ICONS = {
  SCREEN_TIME: '📱',
  PRIVILEGE: '⭐',
  PURCHASE: '💰',
  EXPERIENCE: '🎈',
};

/**
 * RedemptionHistory - User's redemption history component
 *
 * Displays past and pending redemptions with status indicators.
 * For Guild Masters, provides approval/denial/fulfill actions.
 */
const RedemptionHistory = React.memo<RedemptionHistoryProps>(({
  redemptions,
  isGuildMaster,
  onApprove,
  onDeny,
  onFulfill,
}) => {
  const displayRedemptions = useMemo(() => {
    return redemptions.slice(0, 5);
  }, [redemptions]);

  if (redemptions.length === 0) {
    return (
      <div className="fantasy-card p-6">
        <h3 className="text-xl font-fantasy text-gray-200 mb-6 flex items-center">
          📜 Recent Redemptions
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-400 text-lg">No redemption history yet.</p>
          <p className="text-gray-500 text-sm mt-2">Your reward requests will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fantasy-card p-6">
      <h3 className="text-xl font-fantasy text-gray-200 mb-6 flex items-center">
        📜 Recent Redemptions
      </h3>
      <div className="space-y-4">
        {displayRedemptions.map((redemption) => (
          <motion.div
            key={redemption.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-dark-700 to-dark-800 border border-dark-600 rounded-lg p-4 hover:border-dark-500 transition-colors"
            data-testid={`redemption-${redemption.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg">{REWARD_TYPE_ICONS[redemption.reward_type]}</span>
                  <span className="font-medium text-gray-100">{redemption.reward_name}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-gold-400">🪙</span>
                    <span className="text-sm font-bold gold-text">{redemption.cost}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Requested by <span className="text-gray-300 font-medium">{redemption.user_profiles.name}</span> • {redemption.requested_at ? new Date(redemption.requested_at).toLocaleDateString() : 'N/A'}
                </div>
                {redemption.notes && (
                  <div className="text-sm text-gray-300 mb-2 bg-dark-600 p-2 rounded">
                    <span className="text-gray-400 font-medium">Notes:</span> {redemption.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  redemption.status === 'PENDING'
                    ? 'bg-yellow-900/30 text-yellow-300 border-yellow-600/50'
                    : redemption.status === 'APPROVED'
                    ? 'bg-green-900/30 text-green-300 border-green-600/50'
                    : redemption.status === 'FULFILLED'
                    ? 'bg-blue-900/30 text-blue-300 border-blue-600/50'
                    : 'bg-red-900/30 text-red-300 border-red-600/50'
                }`}>
                  {(redemption.status || 'unknown').toLowerCase()}
                </div>
              </div>
            </div>

            {/* Guild Master Approval Buttons */}
            {isGuildMaster && redemption.status === 'PENDING' && onApprove && onDeny && (
              <div className="mt-4 flex space-x-3 pt-3 border-t border-dark-600">
                <button
                  onClick={() => onApprove(redemption.id)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-green-500/50"
                  data-testid={`approve-${redemption.id}`}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => onDeny(redemption.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-red-500/50"
                  data-testid={`deny-${redemption.id}`}
                >
                  ❌ Deny
                </button>
              </div>
            )}

            {/* Mark as Fulfilled Button for Approved Items */}
            {isGuildMaster && redemption.status === 'APPROVED' && onFulfill && (
              <div className="mt-4 pt-3 border-t border-dark-600">
                <button
                  onClick={() => onFulfill(redemption.id)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-blue-500/50"
                  data-testid={`fulfill-${redemption.id}`}
                >
                  🎯 Mark as Fulfilled
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
});

RedemptionHistory.displayName = 'RedemptionHistory';

export default RedemptionHistory;
