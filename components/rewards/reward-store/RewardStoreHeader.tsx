"use client";

import { Bell, Coins, Star } from "lucide-react";

type RewardStoreHeaderProps = {
  goldBalance: number;
  pendingCount: number;
  hasPendingRedemptions: boolean;
};

export function RewardStoreHeader({ goldBalance, pendingCount, hasPendingRedemptions }: RewardStoreHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold text-yellow-800 flex items-center gap-2"
          data-testid="reward-store-title"
        >
          <Star size={24} className="text-yellow-700" />
          Reward Store
        </h2>
        <div className="flex items-center space-x-4">
          {hasPendingRedemptions && (
            <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
              <Bell size={16} className="text-orange-600" />
              <span className="text-orange-600 font-medium">
                {pendingCount} pending
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Coins size={24} className="text-yellow-700" />
            <span
              className="text-xl font-bold text-yellow-700"
              data-testid="gold-balance"
            >
              {goldBalance} Gold
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
