"use client";

import { useCallback, useState } from "react";
import { getAuthToken } from "@/lib/utils/get-auth-token";
import {
  RewardService,
  type RewardRedemptionWithUser,
} from "@/lib/reward-service";
import type { Reward, Character, RewardRedemption } from "@/lib/types/database";

type UseRewardStoreActionsArgs = {
  userId?: string | null;
  character?: Character | null;
  onError?: (error: string) => void;
  refreshCharacter: () => Promise<void>;
  mergeRedemption: (updated: RewardRedemption) => void;
};

const rewardService = new RewardService();

export function useRewardStoreActions({
  userId,
  character,
  onError,
  refreshCharacter,
  mergeRedemption,
}: UseRewardStoreActionsArgs) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState({
    show: false,
    rewardName: "",
  });

  const redeemReward = useCallback(
    async (reward: Reward) => {
      if (!userId || !character) return;

      if ((character.gold || 0) < reward.cost) {
        onError?.("Insufficient gold to redeem this reward");
        return;
      }

      setRedeemingId(reward.id);

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/reward-redemptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ rewardId: reward.id }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string; message?: string }).error ??
              (errorData as { message?: string }).message ??
              "Failed to redeem reward",
          );
        }

        await refreshCharacter();
        setRedeemSuccess({ show: true, rewardName: reward.name });
        setTimeout(() => {
          setRedeemSuccess({ show: false, rewardName: "" });
        }, 3000);
      } catch (error) {
        console.error("Failed to redeem reward:", error);
        onError?.(
          error instanceof Error ? error.message : "Failed to redeem reward",
        );
      } finally {
        setRedeemingId(null);
      }
    },
    [character, onError, refreshCharacter, userId],
  );

  const updateRedemptionStatus = useCallback(
    async (
      redemption: RewardRedemptionWithUser,
      status: "APPROVED" | "DENIED" | "FULFILLED",
    ) => {
      if (!redemption.user_id) {
        onError?.("Missing redemption user");
        return;
      }

      setUpdatingId(redemption.id);
      try {
        if (status === "APPROVED") {
          const token = await getAuthToken();
          const response = await fetch(
            `/api/reward-redemptions/${redemption.id}/approve`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              (errorData as { error?: string; message?: string }).error ??
                (errorData as { message?: string }).message ??
                "Failed to approve redemption",
            );
          }
          const data = (await response.json()) as {
            redemption: RewardRedemption;
          };
          mergeRedemption(data.redemption);
        } else if (status === "DENIED") {
          const token = await getAuthToken();
          const response = await fetch(
            `/api/reward-redemptions/${redemption.id}/deny`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              (errorData as { error?: string; message?: string }).error ??
                (errorData as { message?: string }).message ??
                "Failed to deny redemption",
            );
          }
          const data = (await response.json()) as {
            redemption: RewardRedemption;
          };
          mergeRedemption(data.redemption);
          await refreshCharacter();
        } else {
          const updated = await rewardService.updateRedemptionStatus(
            redemption.id,
            status,
            userId ?? undefined,
          );
          mergeRedemption(updated);
        }
      } catch (error) {
        console.error("Failed to update redemption:", error);
        onError?.(
          error instanceof Error
            ? error.message
            : "Failed to update redemption",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [mergeRedemption, onError, refreshCharacter, userId],
  );

  const dismissSuccess = useCallback(() => {
    setRedeemSuccess({ show: false, rewardName: "" });
  }, []);

  return {
    redeemReward,
    updateRedemptionStatus,
    redeemingId,
    updatingId,
    redeemSuccess,
    dismissSuccess,
  };
}
