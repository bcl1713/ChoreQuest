"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RewardService } from "@/lib/reward-service";
import { Reward, RewardType } from "@/lib/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { useRewards } from "@/hooks/useRewards";

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
  const { profile, user } = useAuth();

  // Use custom hook for rewards and redemptions
  const { rewards, redemptions, loading, error } = useRewards();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "SCREEN_TIME" as RewardType,
    cost: "",
  });

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
    setDeleteTarget(reward);
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
      // Error will be shown via the hook's error state
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
        is_active: true,
      });

      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create reward:", err);
      // Error will be shown via the hook's error state
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
      // Error will be shown via the hook's error state
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);

    try {
      await rewardService.deleteReward(deleteTarget.id);
      requestAnimationFrame(() => {
        setShowDeleteConfirm(false);
        setSelectedReward(null);
        setDeleteTarget(null);
      });
    } catch (err) {
      console.error("Failed to delete reward:", err);
      // Error will be shown via the hook's error state
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveRedemption = async (redemptionId: string) => {
    if (!user) return;

    try {
      await rewardService.updateRedemptionStatus(redemptionId, "APPROVED", user.id);
    } catch (err) {
      console.error("Failed to approve redemption:", err);
      // Error will be shown via the hook's error state
    }
  };

  const handleDenyRedemption = async (redemptionId: string) => {
    if (!user) return;

    try {
      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption || !redemption.user_id) return;

      await rewardService.updateRedemptionStatus(redemptionId, "DENIED");
      await rewardService.refundGold(redemption.user_id, redemption.cost);
    } catch (err) {
      console.error("Failed to deny redemption:", err);
      // Error will be shown via the hook's error state
    }
  };

  const handleFulfillRedemption = async (redemptionId: string) => {
    try {
      await rewardService.updateRedemptionStatus(redemptionId, "FULFILLED");
    } catch (err) {
      console.error("Failed to fulfill redemption:", err);
      // Error will be shown via the hook's error state
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading rewards...</div>;
  }

  const pendingRedemptions = redemptions.filter(r => r.status === 'PENDING');
  const approvedRedemptions = redemptions.filter(r => r.status === 'APPROVED');
  const completedRedemptions = redemptions.filter(r => ['DENIED', 'FULFILLED'].includes(r.status || ''));

  return (
    <div className="space-y-6" data-testid="reward-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100">🏆 Reward Management</h2>
        <button
          onClick={handleCreate}
          data-testid="create-reward-button"
          className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
        >
          ⚡ Create Reward
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Pending Redemptions Section */}
      {pendingRedemptions.length > 0 && (
        <div data-testid="pending-redemptions-section" className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-orange-900 mb-3">Pending Redemptions</h3>
          <div className="space-y-2">
            {pendingRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                data-testid="pending-redemption-item"
                className="bg-white border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <div className="text-sm text-gray-600">
                    {redemption.reward_name} ({redemption.cost} gold)
                  </div>
                  {redemption.notes && (
                    <div className="text-sm text-gray-500 italic mt-1">{redemption.notes}</div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApproveRedemption(redemption.id)}
                    data-testid="approve-redemption-button"
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDenyRedemption(redemption.id)}
                    data-testid="deny-redemption-button"
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Redemptions (Awaiting Fulfillment) */}
      {approvedRedemptions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-green-900 mb-3">Approved - Awaiting Fulfillment</h3>
          <div className="space-y-2">
            {approvedRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                data-testid="approved-redemption-item"
                className="bg-white border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <div className="text-sm text-gray-600">
                    {redemption.reward_name} ({redemption.cost} gold)
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Approved {new Date(redemption.approved_at!).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleFulfillRedemption(redemption.id)}
                  data-testid="fulfill-redemption-button"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ml-4"
                >
                  Mark Fulfilled
                </button>
              </div>
            ))}
          </div>
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
                  onClick={() => handleEdit(reward)}
                  data-testid="edit-reward-button"
                  className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleActive(reward)}
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
                  onClick={() => handleDelete(reward)}
                  data-testid="delete-reward-button"
                  className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {rewards.length === 0 && (
        <div className="fantasy-card text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-300 text-lg">No rewards yet</p>
          <p className="text-gray-500 text-sm mt-2">Create one to get started!</p>
        </div>
      )}

      {/* Redemption History */}
      {completedRedemptions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Redemption History</h3>
          <div className="space-y-2">
            {completedRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="bg-white border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    redemption.status === 'FULFILLED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {redemption.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {redemption.reward_name} ({redemption.cost} gold)
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Requested {redemption.requested_at ? new Date(redemption.requested_at).toLocaleString() : 'Unknown'}
                  {redemption.fulfilled_at && (
                    <> • Fulfilled {new Date(redemption.fulfilled_at).toLocaleString()}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="fantasy-card p-6 max-w-md w-full"
            data-testid="create-reward-modal"
          >
            <h3 className="text-xl font-fantasy text-gray-100 mb-6">⚡ Create New Reward</h3>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Reward Name</label>
                <input
                  type="text"
                  data-testid="reward-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter reward name..."
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  placeholder="Describe the reward..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Type</label>
                <select
                  data-testid="reward-type-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as RewardType })
                  }
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
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  💰 Cost (gold)
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
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-reward-button"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
                >
                  💾 Create Reward
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
            className="fantasy-card p-6 max-w-md w-full"
            data-testid="edit-reward-modal"
          >
            <h3 className="text-xl font-fantasy text-gray-100 mb-6">✏️ Edit Reward</h3>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Reward Name</label>
                <input
                  type="text"
                  data-testid="reward-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Type</label>
                <select
                  data-testid="reward-type-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as RewardType })
                  }
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
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  💰 Cost (gold)
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
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReward(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-reward-button"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-700 hover:to-gold-800 text-white rounded-lg font-medium transition-all shadow-md"
                >
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="fantasy-card p-6 max-w-md w-full"
            data-testid="delete-confirmation-dialog"
          >
            <h3 className="text-xl font-fantasy text-red-400 mb-4">⚠️ Delete Reward?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-100">&ldquo;{deleteTarget.name}&rdquo;</span>?
              This action will deactivate the reward.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (deleteLoading) return;
                  setShowDeleteConfirm(false);
                  setSelectedReward(null);
                  setDeleteTarget(null);
                  setDeleteLoading(false);
                }}
                className={`flex-1 px-4 py-2 rounded-lg ${deleteLoading ? "bg-dark-700 text-gray-500 cursor-not-allowed" : "bg-dark-600 text-gray-300 border border-dark-500 hover:bg-dark-500 transition-colors"}`}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                data-testid="confirm-delete-button"
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all ${deleteLoading ? "bg-red-400 cursor-not-allowed" : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"}`}
              >
                {deleteLoading ? "⏳ Deleting..." : "🗑️ Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
