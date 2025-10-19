"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RewardService } from "@/lib/reward-service";
import { Reward } from "@/lib/types/database";
import { useRewards } from "@/hooks/useRewards";
import { RewardList } from "./reward-list";
import { RewardForm, RewardFormData } from "./reward-form";
import { RedemptionList } from "./redemption-list";

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
  const [formData, setFormData] = useState<RewardFormData>({
    name: "",
    description: "",
    type: "SCREEN_TIME",
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

  const handleFormChange = (field: keyof RewardFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
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

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedReward(null);
    resetForm();
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

      {/* Redemption Lists */}
      <RedemptionList
        redemptions={redemptions}
        onApprove={handleApproveRedemption}
        onDeny={handleDenyRedemption}
        onFulfill={handleFulfillRedemption}
      />

      {/* Rewards list */}
      <RewardList
        rewards={rewards}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <RewardForm
          mode="create"
          formData={formData}
          onSubmit={handleSubmitCreate}
          onCancel={handleCancelCreate}
          onChange={handleFormChange}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <RewardForm
          mode="edit"
          formData={formData}
          onSubmit={handleSubmitEdit}
          onCancel={handleCancelEdit}
          onChange={handleFormChange}
        />
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
