"use client";

import React from "react";
import { Reward } from "@/lib/types/database";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import { Smartphone, Star, Coins, Lightbulb, Edit, Check, Circle, Trash2 } from "lucide-react";

// Map reward types to Lucide icon names
const REWARD_TYPE_ICON_NAMES = {
  SCREEN_TIME: "Smartphone",
  PRIVILEGE: "Star",
  PURCHASE: "Coins",
  EXPERIENCE: "Lightbulb",
};

// Map icon names to Lucide components
const ICON_COMPONENT_MAP = {
  Smartphone: Smartphone,
  Star: Star,
  Coins: Coins,
  Lightbulb: Lightbulb,
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
          <FantasyIcon
            icon={ICON_COMPONENT_MAP[REWARD_TYPE_ICON_NAMES[reward.type] as keyof typeof ICON_COMPONENT_MAP]}
            size="lg"
            aria-label={`${reward.type} reward type`}
          />
          <div>
            <h3 className="font-fantasy text-lg text-gray-100">
              {reward.name}
            </h3>
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
        <div className="flex items-center gap-2 text-xl font-bold gold-text">
          <Coins size={20} />
          {reward.cost} gold
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => onEdit(reward)}
          data-testid="edit-reward-button"
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          onClick={() => onToggleActive(reward)}
          data-testid="toggle-reward-active"
          variant={reward.is_active ? "success" : "outline"}
          size="sm"
          className="flex-1"
        >
          {reward.is_active ? "Active" : "Inactive"}
        </Button>
        <Button
          onClick={() => onDelete(reward)}
          data-testid="delete-reward-button"
          variant="destructive"
          size="icon-sm"
          aria-label="Delete reward"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </motion.div>
  );
});
