"use client";

import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui";
import { RewardList } from "./reward-list";
import { RewardForm } from "./reward-form";
import { RedemptionList } from "./redemption-list";
import { useRewardManagerController } from "./useRewardManagerController";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

export default function RewardManager() {
  const { profile, user } = useAuth();

  const {
    rewards,
    redemptions,
    loading,
    error,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    deleteTarget,
    deleteLoading,
    formData,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleFormChange,
    handleSubmitCreate,
    handleSubmitEdit,
    handleCancelCreate,
    handleCancelEdit,
    handleConfirmDelete,
    handleApproveRedemption,
    handleDenyRedemption,
    handleFulfillRedemption,
    setShowDeleteConfirm,
    setSelectedReward,
    setDeleteTarget,
    setDeleteLoading,
  } = useRewardManagerController(profile, user);

  if (loading) {
    return <div className="text-center py-8">Loading rewards...</div>;
  }

  return (
    <div className="space-y-6" data-testid="reward-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
          <Trophy size={28} />
          Reward Management
        </h2>
        <Button
          onClick={handleCreate}
          data-testid="create-reward-button"
          variant="gold"
          size="sm"
        >
          ⚡ Create Reward
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
        <DeleteConfirmationDialog
          reward={deleteTarget}
          isOpen={showDeleteConfirm}
          isLoading={deleteLoading}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedReward(null);
            setDeleteTarget(null);
            setDeleteLoading(false);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
