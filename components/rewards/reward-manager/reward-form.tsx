"use client";

import React, { useMemo } from "react";
import { RewardType } from "@/lib/types/database";
import { Button } from "@/components/ui";
import { Smartphone, Star, Coins, Lightbulb } from "lucide-react";

export const REWARD_TYPE_ICONS = {
  SCREEN_TIME: Smartphone,
  PRIVILEGE: Star,
  PURCHASE: Coins,
  EXPERIENCE: Lightbulb,
};

export const REWARD_TYPE_LABELS = {
  SCREEN_TIME: "Screen Time",
  PRIVILEGE: "Privilege",
  PURCHASE: "Purchase",
  EXPERIENCE: "Experience",
};

export interface RewardFormData {
  name: string;
  description: string;
  type: RewardType;
  cost: string;
}

interface RewardFormProps {
  mode: "create" | "edit";
  formData: RewardFormData;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (field: keyof RewardFormData, value: string) => void;
}

export const RewardForm = React.memo(function RewardForm({
  mode,
  formData,
  onSubmit,
  onCancel,
  onChange,
}: RewardFormProps) {
  // Memoize computed values to prevent recalculation on every render
  const title = useMemo(
    () => (mode === "create" ? "Create New Reward" : "Edit Reward"),
    [mode],
  );

  const submitButtonText = useMemo(
    () => (mode === "create" ? "Create Reward" : "Save Changes"),
    [mode],
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="fantasy-card p-6 max-w-md w-full"
        data-testid={
          mode === "create" ? "create-reward-modal" : "edit-reward-modal"
        }
      >
        <h3 className="text-xl font-fantasy text-gray-100 mb-6">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Reward Name
            </label>
            <input
              type="text"
              data-testid="reward-name-input"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              required
              placeholder={
                mode === "create" ? "Enter reward name..." : undefined
              }
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              data-testid="reward-description-input"
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              required
              rows={3}
              placeholder={
                mode === "create" ? "Describe the reward..." : undefined
              }
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Type
            </label>
            <select
              data-testid="reward-type-select"
              value={formData.type}
              onChange={(e) => onChange("type", e.target.value)}
              required
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {Object.entries(REWARD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-1">
              <Coins size={16} aria-hidden="true" className="text-gold-400" />
              Cost (gold)
            </label>
            <input
              type="number"
              data-testid="reward-cost-input"
              value={formData.cost}
              onChange={(e) => onChange("cost", e.target.value)}
              required
              min="1"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="save-reward-button"
              variant="gold"
              size="sm"
              fullWidth
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
