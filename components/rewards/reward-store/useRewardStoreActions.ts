"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
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
        const { error: redemptionError } = await supabase
          .from("reward_redemptions")
          .insert({
            user_id: userId,
            reward_id: reward.id,
            cost: reward.cost,
            reward_name: reward.name,
            reward_description: reward.description,
            reward_type: reward.type,
            status: "PENDING",
            notes: null,
          });

        if (redemptionError) throw redemptionError;

        const newGold = (character.gold || 0) - reward.cost;
        const { error: characterError } = await supabase
          .from("characters")
          .update({ gold: newGold })
          .eq("user_id", userId);

        if (characterError) throw characterError;

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
        const updated = await rewardService.updateRedemptionStatus(
          redemption.id,
          status,
          userId ?? undefined,
        );
        mergeRedemption(updated);

        if (status === "DENIED") {
          const refundAmount = redemption.cost ?? 0;
          await rewardService.refundGold(redemption.user_id, refundAmount);
          await refreshCharacter();
        }

        if (status === "APPROVED") {
          supabase.auth
            .getSession()
            .then(({ data }) => {
              const token = data.session?.access_token;
              fetch("/api/achievement-progress/evaluate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  eventType: "REWARD_APPROVED",
                  userId: redemption.user_id,
                }),
              })
                .then((response) => {
                  if (!response.ok) {
                    console.error(
                      "Achievement progress evaluation failed (non-blocking):",
                      response.status,
                    );
                  }
                })
                .catch((err) => {
                  console.error(
                    "Achievement progress evaluation failed (non-blocking):",
                    err,
                  );
                });
            })
            .catch((err) => {
              console.error(
                "Achievement progress evaluation failed (non-blocking):",
                err,
              );
            });
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
