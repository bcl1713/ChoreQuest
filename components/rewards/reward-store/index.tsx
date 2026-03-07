"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCharacter as useCharacterContext } from "@/lib/character-context";
import { useRewards } from "@/hooks/useRewards";
import RewardCatalog from "./reward-catalog";
import RewardCard from "./reward-card";
import RedemptionHistory from "./redemption-history";
import { RewardStoreHeader } from "./RewardStoreHeader";
import { PendingRedemptionList } from "./PendingRedemptionList";
import { RedeemSuccessToast } from "./RedeemSuccessToast";
import { useRewardStoreActions } from "./useRewardStoreActions";

interface RewardStoreProps {
  onError?: (error: string) => void;
}

export default function RewardStore({ onError }: RewardStoreProps) {
  const { user } = useAuth();
  const { character, refreshCharacter } = useCharacterContext();
  const { rewards, redemptions, loading } = useRewards();

  const {
    redeemReward,
    updateRedemptionStatus,
    redeemingId,
    updatingId,
    redeemSuccess,
    dismissSuccess,
  } = useRewardStoreActions({
    userId: user?.id,
    character,
    onError,
    refreshCharacter,
  });

  const canAfford = useCallback(
    (cost: number) => (character ? (character.gold || 0) >= cost : false),
    [character]
  );

  const getRedemptionStatus = useCallback(
    (rewardId: string) => {
      const pending = redemptions.find(
        (r) =>
          r.reward_id === rewardId &&
          r.user_profiles.id === user?.id &&
          ["PENDING", "APPROVED"].includes(r.status || "")
      );
      return pending ? (pending.status as "PENDING" | "APPROVED") : null;
    },
    [redemptions, user?.id]
  );

  const pendingRedemptions = useMemo(() => redemptions.filter((r) => r.status === "PENDING"), [redemptions]);
  const goldBalance = useMemo(() => character?.gold || 0, [character]);

  const hasPendingRedemptions = useMemo(
    () => user?.role === "GUILD_MASTER" && pendingRedemptions.length > 0,
    [user?.role, pendingRedemptions.length]
  );

  const handleHistoryStatusChange = useCallback(
    (redemptionId: string, status: "APPROVED" | "DENIED" | "FULFILLED") => {
      const redemption = redemptions.find((r) => r.id === redemptionId);
      if (redemption) {
        void updateRedemptionStatus(redemption, status);
      }
    },
    [redemptions, updateRedemptionStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RewardStoreHeader
        goldBalance={goldBalance}
        pendingCount={pendingRedemptions.length}
        hasPendingRedemptions={hasPendingRedemptions}
      />

      <RewardCatalog rewards={rewards}>
        {(reward) => (
          <RewardCard
            reward={reward}
            canAfford={canAfford(reward.cost)}
            redemptionStatus={getRedemptionStatus(reward.id)}
            isRedeeming={redeemingId === reward.id}
            onRedeem={redeemReward}
          />
        )}
      </RewardCatalog>

      {hasPendingRedemptions && (
        <PendingRedemptionList
          pendingRedemptions={pendingRedemptions}
          onUpdate={(redemption, status) => void updateRedemptionStatus(redemption, status)}
          updatingId={updatingId}
        />
      )}

      <RedemptionHistory
        redemptions={redemptions}
        isGuildMaster={user?.role === "GUILD_MASTER"}
        onApprove={(id) => handleHistoryStatusChange(id, "APPROVED")}
        onDeny={(id) => handleHistoryStatusChange(id, "DENIED")}
        onFulfill={(id) => handleHistoryStatusChange(id, "FULFILLED")}
      />

      <RedeemSuccessToast
        show={redeemSuccess.show}
        rewardName={redeemSuccess.rewardName}
        onDismiss={dismissSuccess}
      />
    </div>
  );
}
