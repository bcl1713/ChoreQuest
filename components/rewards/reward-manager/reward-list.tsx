"use client";

import React from "react";
import { Reward } from "@/lib/types/database";
import { AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { RewardItem } from "./reward-item";

interface RewardListProps {
  rewards: Reward[];
  onEdit: (reward: Reward) => void;
  onDelete: (reward: Reward) => void;
  onToggleActive: (reward: Reward) => void;
}

export const RewardList = React.memo(function RewardList({
  rewards,
  onEdit,
  onDelete,
  onToggleActive,
}: RewardListProps) {
  // Empty state
  if (rewards.length === 0) {
    return (
      <div className="fantasy-card text-center py-12">
        <div className="flex justify-center mb-4">
          <Trophy size={48} aria-hidden="true" className="text-gold-400" />
        </div>
        <p className="text-gray-300 text-lg">No rewards yet</p>
        <p className="text-gray-500 text-sm mt-2">Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="reward-list">
      <AnimatePresence>
        {rewards.map((reward) => (
          <RewardItem
            key={reward.id}
            reward={reward}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
