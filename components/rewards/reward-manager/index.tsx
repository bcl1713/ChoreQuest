"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { RewardService } from "@/lib/reward-service";
import { Reward } from "@/lib/types/database";
import { useRewards } from "@/hooks/useRewards";
import { Button } from "@/components/ui";
import { Trophy, Loader, Trash2, AlertTriangle } from "lucide-react";
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

  // Memoized handlers for stable references
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      type: "SCREEN_TIME",
      cost: "",
    });
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((reward: Reward) => {
    setSelectedReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      cost: reward.cost.toString(),
    });
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback((reward: Reward) => {
    setSelectedReward(reward);
    setDeleteTarget(reward);
    setShowDeleteConfirm(true);
  }, []);

  const handleToggleActive = useCallback(async (reward: Reward) => {
    try {
      // Toggle is_active field directly (like templates)
      await rewardService.updateReward(reward.id, {
        is_active: !reward.is_active,
      });
    } catch (err) {
      console.error("Failed to toggle reward status:", err);
      // Error will be shown via the hook's error state
    }
  }, []);

  const handleFormChange = useCallback(
    (field: keyof RewardFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmitCreate = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [profile?.family_id, formData, resetForm],
  );

  const handleSubmitEdit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [selectedReward, formData, resetForm],
  );

  const handleCancelCreate = useCallback(() => {
    setShowCreateModal(false);
    resetForm();
  }, [resetForm]);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setSelectedReward(null);
    resetForm();
  }, [resetForm]);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [deleteTarget, deleteLoading]);

  const handleApproveRedemption = useCallback(
    async (redemptionId: string) => {
      if (!user) return;

      try {
        await rewardService.updateRedemptionStatus(
          redemptionId,
          "APPROVED",
          user.id,
        );
      } catch (err) {
        console.error("Failed to approve redemption:", err);
        // Error will be shown via the hook's error state
      }
    },
    [user],
  );

  const handleDenyRedemption = useCallback(
    async (redemptionId: string) => {
      if (!user) return;

      try {
        const redemption = redemptions.find((r) => r.id === redemptionId);
        if (!redemption || !redemption.user_id) return;

        await rewardService.updateRedemptionStatus(redemptionId, "DENIED");
        await rewardService.refundGold(redemption.user_id, redemption.cost);
      } catch (err) {
        console.error("Failed to deny redemption:", err);
        // Error will be shown via the hook's error state
      }
    },
    [user, redemptions],
  );

  const handleFulfillRedemption = useCallback(async (redemptionId: string) => {
    try {
      await rewardService.updateRedemptionStatus(redemptionId, "FULFILLED");
    } catch (err) {
      console.error("Failed to fulfill redemption:", err);
      // Error will be shown via the hook's error state
    }
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading rewards...</div>;
  }

  return (
    <div className="space-y-6" data-testid="reward-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
          <Trophy size={28} aria-hidden="true" className="text-gold-400" />
          Reward Management
        </h2>
        <Button
          onClick={handleCreate}
          data-testid="create-reward-button"
          variant="gold"
          size="sm"
        >
          Create Reward
        </Button>
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
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={24} aria-hidden="true" className="text-red-400" />
              <h3 className="text-xl font-fantasy text-red-400">
                Delete Reward?
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-100">
                &ldquo;{deleteTarget.name}&rdquo;
              </span>
              ? This action will deactivate the reward.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedReward(null);
                    setDeleteTarget(null);
                    setDeleteLoading(false);
                  }}
                  disabled={deleteLoading}
                  variant="secondary"
                  size="sm"
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  onClick={handleConfirmDelete}
                  isLoading={deleteLoading}
                  data-testid="confirm-delete-button"
                  variant="destructive"
                  size="sm"
                  fullWidth
                  startIcon={deleteLoading ? <Loader size={16} aria-hidden="true" className="animate-spin" /> : <Trash2 size={16} aria-hidden="true" />}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
