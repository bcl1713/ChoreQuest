"use client";

import { useCallback, useState } from "react";
import { RewardService } from "@/lib/reward-service";
import { Reward } from "@/lib/types/database";
import { useRewards } from "@/hooks/useRewards";
import type { UserProfile } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";
import type { RewardFormData } from "./reward-form";

const rewardService = new RewardService();

export function useRewardManagerController(
  profile: UserProfile | null,
  user: User | null,
) {
  const { rewards, redemptions, loading, error, mergeRedemption } =
    useRewards();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>({
    name: "",
    description: "",
    type: "SCREEN_TIME",
    cost: "",
  });

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
      await rewardService.updateReward(reward.id, {
        is_active: !reward.is_active,
      });
    } catch (err) {
      console.error("Failed to toggle reward status:", err);
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
          cost: parseInt(formData.cost, 10),
          family_id: profile.family_id,
          is_active: true,
        });

        setShowCreateModal(false);
        resetForm();
      } catch (err) {
        console.error("Failed to create reward:", err);
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
          cost: parseInt(formData.cost, 10),
        });

        setShowEditModal(false);
        setSelectedReward(null);
        resetForm();
      } catch (err) {
        console.error("Failed to update reward:", err);
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
      setShowDeleteConfirm(false);
      setSelectedReward(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete reward:", err);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deleteLoading]);

  const handleApproveRedemption = useCallback(
    async (redemptionId: string) => {
      if (!user) return;

      try {
        const updated = await rewardService.updateRedemptionStatus(
          redemptionId,
          "APPROVED",
          user.id,
        );
        mergeRedemption(updated);
      } catch (err) {
        console.error("Failed to approve redemption:", err);
      }
    },
    [user, mergeRedemption],
  );

  const handleDenyRedemption = useCallback(
    async (redemptionId: string) => {
      if (!user) return;

      try {
        const redemption = redemptions.find((r) => r.id === redemptionId);
        if (!redemption || !redemption.user_id) return;

        const updated = await rewardService.updateRedemptionStatus(
          redemptionId,
          "DENIED",
        );
        mergeRedemption(updated);
        await rewardService.refundGold(redemption.user_id, redemption.cost);
      } catch (err) {
        console.error("Failed to deny redemption:", err);
      }
    },
    [user, redemptions, mergeRedemption],
  );

  const handleFulfillRedemption = useCallback(
    async (redemptionId: string) => {
      try {
        const updated = await rewardService.updateRedemptionStatus(
          redemptionId,
          "FULFILLED",
        );
        mergeRedemption(updated);
      } catch (err) {
        console.error("Failed to fulfill redemption:", err);
      }
    },
    [mergeRedemption],
  );

  return {
    rewards,
    redemptions,
    loading,
    error,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    deleteTarget,
    deleteLoading,
    selectedReward,
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
  };
}
