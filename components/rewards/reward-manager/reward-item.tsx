"use client";

import React from "react";
import { Reward } from "@/lib/types/database";
import { motion } from "framer-motion";

const REWARD_TYPE_ICONS = {
  SCREEN_TIME: "📱",
  PRIVILEGE: "⭐",
  PURCHASE: "💰",
  EXPERIENCE: "🎈",
};

const REWARD_TYPE_LABELS = {
  SCREEN_TIME: "Screen Time",
  PRIVILEGE: "Privilege",
  PURCHASE: "Purchase",
  EXPERIENCE: "Experience",
};

interface RewardItemProps {
  reward: Reward;
  onEdit: (reward: Reward) => void;
  onDelete: (reward: Reward) => void;
  onToggleActive: (reward: Reward) => void;
}

export const RewardItem = React.memo(function RewardItem({
  reward,
  onEdit,
  onDelete,
  onToggleActive,
}: RewardItemProps) {
  return (
    <motion.div
      key={reward.id}
      data-testid={`reward-card-${reward.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fantasy-card p-6 hover:border-gold-500/50 transition-all ${
        !reward.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {REWARD_TYPE_ICONS[reward.type]}
          </span>
          <div>
            <h3 className="font-fantasy text-lg text-gray-100">{reward.name}</h3>
            <p className="text-sm text-gray-400">
              {REWARD_TYPE_LABELS[reward.type]}
            </p>
          </div>
        </div>
        {!reward.is_active && (
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
            Inactive
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400 mb-4">{reward.description}</p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-bold gold-text">
          💰 {reward.cost} gold
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(reward)}
          data-testid="edit-reward-button"
          className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onToggleActive(reward)}
          data-testid="toggle-reward-active"
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            reward.is_active
              ? 'bg-dark-600 text-green-400 border border-green-500/50 hover:bg-dark-500'
              : 'bg-dark-600 text-gray-400 border border-gray-600 hover:bg-dark-500'
          }`}
        >
          {reward.is_active ? "✓ Active" : "○ Inactive"}
        </button>
        <button
          onClick={() => onDelete(reward)}
          data-testid="delete-reward-button"
          className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
});
