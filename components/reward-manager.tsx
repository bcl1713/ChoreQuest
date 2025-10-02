"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { RewardService } from "@/lib/reward-service";
import { Reward, RewardType } from "@/lib/types/database";
import { motion, AnimatePresence } from "framer-motion";

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

const rewardService = new RewardService();

export default function RewardManager() {
  const { profile } = useAuth();
  const { onRewardUpdate } = useRealtime();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "SCREEN_TIME" as RewardType,
    cost: "",
  });

  // Load rewards on mount
  useEffect(() => {
    if (!profile?.family_id) return;

    const loadRewards = async () => {
      try {
        setLoading(true);
        const data = await rewardService.getRewardsForFamily(profile.family_id!);
        setRewards(data);
      } catch (err) {
        console.error("Failed to load rewards:", err);
        setError("Failed to load rewards");
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, [profile?.family_id]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = onRewardUpdate((event) => {
      if (event.action === "INSERT") {
        const newReward = event.record as Reward;
        setRewards((prev) => [newReward, ...prev]);
      } else if (event.action === "UPDATE") {
        const updatedReward = event.record as Reward;
        setRewards((prev) =>
          prev.map((r) => (r.id === updatedReward.id ? updatedReward : r))
        );
      } else if (event.action === "DELETE") {
        const deletedId = event.old_record?.id as string;
        setRewards((prev) => prev.filter((r) => r.id !== deletedId));
      }
    });

    return unsubscribe;
  }, [onRewardUpdate]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "SCREEN_TIME",
      cost: "",
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (reward: Reward) => {
    setSelectedReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      cost: reward.cost.toString(),
    });
    setShowEditModal(true);
  };

  const handleDelete = (reward: Reward) => {
    setSelectedReward(reward);
    setShowDeleteConfirm(true);
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      // Toggle is_active field directly (like templates)
      await rewardService.updateReward(reward.id, {
        is_active: !reward.is_active,
      });
    } catch (err) {
      console.error("Failed to toggle reward status:", err);
      setError("Failed to update reward status");
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.family_id) return;

    try {
      await rewardService.createReward({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        cost: parseInt(formData.cost),
        family_id: profile.family_id,
      });

      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create reward:", err);
      setError("Failed to create reward");
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;

    try {
      await rewardService.updateReward(selectedReward.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        cost: parseInt(formData.cost),
      });

      setShowEditModal(false);
      setSelectedReward(null);
      resetForm();
    } catch (err) {
      console.error("Failed to update reward:", err);
      setError("Failed to update reward");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedReward) return;

    try {
      await rewardService.deleteReward(selectedReward.id);
      setShowDeleteConfirm(false);
      setSelectedReward(null);
    } catch (err) {
      console.error("Failed to delete reward:", err);
      setError("Failed to delete reward");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading rewards...</div>;
  }

  return (
    <div className="space-y-6" data-testid="reward-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reward Management</h2>
        <button
          onClick={handleCreate}
          data-testid="create-reward-button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Reward
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Rewards list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="reward-list">
        <AnimatePresence>
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              data-testid={`reward-card-${reward.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white border rounded-lg p-4 shadow-sm ${
                !reward.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {REWARD_TYPE_ICONS[reward.type]}
                  </span>
                  <div>
                    <h3 className="font-bold">{reward.name}</h3>
                    <p className="text-sm text-gray-600">
                      {REWARD_TYPE_LABELS[reward.type]}
                    </p>
                  </div>
                </div>
                {!reward.is_active && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-3">{reward.description}</p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-yellow-600">
                  {reward.cost} gold
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(reward)}
                  data-testid="edit-reward-button"
                  className="flex-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(reward)}
                  data-testid="toggle-reward-active"
                  className="flex-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  {reward.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(reward)}
                  data-testid="delete-reward-button"
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {rewards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No rewards yet. Create one to get started!
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            data-testid="create-reward-modal"
          >
            <h3 className="text-xl font-bold mb-4">Create New Reward</h3>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  data-testid="reward-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  data-testid="reward-description-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  data-testid="reward-type-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as RewardType })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Object.entries(REWARD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cost (gold)
                </label>
                <input
                  type="number"
                  data-testid="reward-cost-input"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-reward-button"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            data-testid="edit-reward-modal"
          >
            <h3 className="text-xl font-bold mb-4">Edit Reward</h3>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  data-testid="reward-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  data-testid="reward-description-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  data-testid="reward-type-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as RewardType })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Object.entries(REWARD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cost (gold)
                </label>
                <input
                  type="number"
                  data-testid="reward-cost-input"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReward(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-reward-button"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            data-testid="delete-confirmation-dialog"
          >
            <h3 className="text-xl font-bold mb-4">Delete Reward?</h3>
            <p className="mb-6">
              Are you sure you want to delete &ldquo;{selectedReward?.name}&rdquo;? This action
              will deactivate the reward.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedReward(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                data-testid="confirm-delete-button"
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
