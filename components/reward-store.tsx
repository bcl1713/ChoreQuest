"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCharacter } from "@/lib/character-context";
import { motion } from "framer-motion";

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
  cost: number;
}

interface RewardRedemption {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'DENIED';
  requestedAt: string;
  reward: Reward;
  user: {
    id: string;
    name: string;
  };
  notes?: string;
}


interface RewardStoreProps {
  onError?: (error: string) => void;
}

const REWARD_TYPE_ICONS = {
  SCREEN_TIME: '📱',
  PRIVILEGE: '⭐',
  PURCHASE: '💰',
  EXPERIENCE: '🎈',
};

const REWARD_TYPE_LABELS = {
  SCREEN_TIME: 'Screen Time',
  PRIVILEGE: 'Privilege',
  PURCHASE: 'Purchase',
  EXPERIENCE: 'Experience',
};

export default function RewardStore({ onError }: RewardStoreProps) {
  const { user, token } = useAuth();
  const { character, refreshCharacter } = useCharacter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!user || !token || !character) {
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    const loadData = async () => {
      setLoading(true);

      try {
        // Load rewards
        const rewardsResponse = await fetch('/api/rewards', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          setRewards(rewardsData.rewards);
        } else {
          console.error('Failed to load rewards');
          onError?.('Failed to load rewards');
        }

        // Load redemptions
        const redemptionsResponse = await fetch('/api/rewards/redemptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (redemptionsResponse.ok) {
          const redemptionsData = await redemptionsResponse.json();
          setRedemptions(redemptionsData.redemptions);
        } else {
          console.error('Failed to load redemptions');
          onError?.('Failed to load redemption history');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        onError?.('Failed to load reward store data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, token, character, onError]); // Proper dependencies - onError is stable via useCallback

  const handleRedeem = async (reward: Reward, notes?: string) => {
    if (!token || !character) return;

    if (character.gold < reward.cost) {
      onError?.('Insufficient gold to redeem this reward');
      return;
    }

    setRedeeming(reward.id);

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId: reward.id,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem reward');
      }

      await response.json();

      // Refresh character data to get updated gold balance
      await refreshCharacter();

      // Reload redemptions to show new request
      try {
        const response = await fetch('/api/rewards/redemptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRedemptions(data.redemptions);
        }
      } catch (error) {
        console.error('Failed to reload redemptions:', error);
      }

      // UI will update to show pending status automatically

    } catch (error) {
      console.error('Failed to redeem reward:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  const canAfford = (cost: number) => character ? character.gold >= cost : false;

  const handleApproval = async (redemptionId: string, status: 'APPROVED' | 'DENIED' | 'FULFILLED', notes?: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/rewards/redemptions/${redemptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update redemption');
      }

      // Reload redemptions to reflect changes
      try {
        const response = await fetch('/api/rewards/redemptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRedemptions(data.redemptions);
        }
      } catch (error) {
        console.error('Failed to reload redemptions:', error);
      }

      // If this was a refund, refresh character data for all users
      if (status === 'DENIED') {
        await refreshCharacter();
      }

      // No need for alert messages - the UI updates provide sufficient feedback

    } catch (error) {
      console.error('Failed to update redemption:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to update redemption');
    }
  };

  const getRedemptionStatus = (rewardId: string) => {
    const pending = redemptions.find(r =>
      r.reward.id === rewardId &&
      r.user.id === user?.id &&  // Only check current user's redemptions
      ['PENDING', 'APPROVED'].includes(r.status)
    );
    return pending ? pending.status : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingRedemptions = redemptions.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header with Gold Balance */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-800">⭐ Reward Store</h2>
          <div className="flex items-center space-x-4">
            {user?.role === 'GUILD_MASTER' && pendingRedemptions.length > 0 && (
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                <span className="text-orange-600 font-medium">🔔 {pendingRedemptions.length} pending</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-bold text-yellow-700">
                {character?.gold || 0} Gold
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const affordable = canAfford(reward.cost);
          const redemptionStatus = getRedemptionStatus(reward.id);
          const isRedeeming = redeeming === reward.id;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-4 ${
                affordable && !redemptionStatus
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-gray-200 bg-gray-50'
              } transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{REWARD_TYPE_ICONS[reward.type]}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-sm text-gray-500">
                      {REWARD_TYPE_LABELS[reward.type]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🪙</span>
                    <span className="font-bold text-yellow-600">{reward.cost}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

              {redemptionStatus && (
                <div className={`mb-3 px-2 py-1 rounded text-xs font-medium ${
                  redemptionStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {redemptionStatus === 'PENDING' ? 'Awaiting Approval' : 'Approved'}
                </div>
              )}

              <button
                onClick={() => handleRedeem(reward)}
                disabled={!affordable || !!redemptionStatus || isRedeeming}
                className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                  affordable && !redemptionStatus && !isRedeeming
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isRedeeming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Redeeming...</span>
                  </div>
                ) : redemptionStatus ? (
                  redemptionStatus === 'PENDING' ? 'Request Pending' : 'Approved'
                ) : !affordable ? (
                  'Insufficient Gold'
                ) : (
                  'Redeem Reward'
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No rewards available at this time.</p>
        </div>
      )}

      {/* Pending Requests Section for Guild Masters */}
      {user?.role === 'GUILD_MASTER' && pendingRedemptions.length > 0 && (
        <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
            🔔 Pending Approval Requests
          </h3>
          <div className="space-y-4">
            {pendingRedemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-gray-900">{redemption.reward.name}</span>
                      <span className="text-lg">{REWARD_TYPE_ICONS[redemption.reward.type]}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">🪙</span>
                        <span className="text-sm font-bold text-yellow-600">{redemption.reward.cost}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Requested by:</strong> {redemption.user.name}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <strong>Request Date:</strong> {new Date(redemption.requestedAt).toLocaleDateString()}
                    </div>
                    {redemption.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Notes:</strong> {redemption.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApproval(redemption.id, 'APPROVED')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleApproval(redemption.id, 'DENIED')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    ❌ Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Redemptions */}
      {redemptions.length > 0 && (
        <div className="fantasy-card p-6">
          <h3 className="text-xl font-fantasy text-gray-200 mb-6 flex items-center">
            📜 Recent Redemptions
          </h3>
          <div className="space-y-4">
            {redemptions.slice(0, 5).map((redemption) => (
              <motion.div
                key={redemption.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-dark-700 to-dark-800 border border-dark-600 rounded-lg p-4 hover:border-dark-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{REWARD_TYPE_ICONS[redemption.reward.type]}</span>
                      <span className="font-medium text-gray-100">{redemption.reward.name}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gold-400">🪙</span>
                        <span className="text-sm font-bold gold-text">{redemption.reward.cost}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      Requested by <span className="text-gray-300 font-medium">{redemption.user.name}</span> • {new Date(redemption.requestedAt).toLocaleDateString()}
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
                      {redemption.status.toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* Guild Master Approval Buttons */}
                {user?.role === 'GUILD_MASTER' && redemption.status === 'PENDING' && (
                  <div className="mt-4 flex space-x-3 pt-3 border-t border-dark-600">
                    <button
                      onClick={() => handleApproval(redemption.id, 'APPROVED')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-green-500/50"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleApproval(redemption.id, 'DENIED')}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-red-500/50"
                    >
                      ❌ Deny
                    </button>
                  </div>
                )}

                {/* Mark as Fulfilled Button for Approved Items */}
                {user?.role === 'GUILD_MASTER' && redemption.status === 'APPROVED' && (
                  <div className="mt-4 pt-3 border-t border-dark-600">
                    <button
                      onClick={() => handleApproval(redemption.id, 'FULFILLED')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-blue-500/50"
                    >
                      🎯 Mark as Fulfilled
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {redemptions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📜</div>
              <p className="text-gray-400 text-lg">No redemption history yet.</p>
              <p className="text-gray-500 text-sm mt-2">Your reward requests will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}