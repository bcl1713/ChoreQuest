"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCharacter as useCharacterContext } from "@/lib/character-context";
import { supabase } from "@/lib/supabase";
import { Reward } from "@/lib/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Star, Bell, Coins, XCircle } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { Button } from "@/components/ui";
import RewardCatalog from "./reward-catalog";
import RewardCard from "./reward-card";
import RedemptionHistory from "./redemption-history";

interface RewardStoreProps {
  onError?: (error: string) => void;
}

export default function RewardStore({ onError }: RewardStoreProps) {
  const { user, session } = useAuth();
  const { character, refreshCharacter } = useCharacterContext();
  const { rewards, redemptions, loading } = useRewards();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    show: boolean;
    rewardName: string;
  }>({
    show: false,
    rewardName: "",
  });

  const canAfford = useCallback(
    (cost: number) => {
      return character ? (character.gold || 0) >= cost : false;
    },
    [character],
  );

  const getRedemptionStatus = useCallback(
    (rewardId: string) => {
      const pending = redemptions.find(
        (r) =>
          r.reward_id === rewardId &&
          r.user_profiles.id === user?.id &&
          ["PENDING", "APPROVED"].includes(r.status || ""),
      );
      return pending ? (pending.status as "PENDING" | "APPROVED") : null;
    },
    [redemptions, user?.id],
  );

  const handleRedeem = useCallback(
    async (reward: Reward) => {
      if (!user || !character || !session) return;

      if ((character.gold || 0) < reward.cost) {
        onError?.("Insufficient gold to redeem this reward");
        return;
      }

      setRedeeming(reward.id);

      try {
        const response = await fetch('/api/rewards/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ rewardId: reward.id })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Redemption failed: ${response.statusText}`);
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
        setRedeeming(null);
      }
    },
    [user, character, session, onError, refreshCharacter],
  );

  const handleApproval = useCallback(
    async (
      redemptionId: string,
      status: "APPROVED" | "DENIED" | "FULFILLED",
    ) => {
      if (!user) return;

      try {
        let redemptionData = null;
        if (status === "DENIED") {
          const { data, error } = await supabase
            .from("reward_redemptions")
            .select("*")
            .eq("id", redemptionId)
            .single();

          if (error) throw error;
          redemptionData = data;
        }

        const updateData: {
          status: string;
          notes: string | null;
          approved_at?: string;
          approved_by?: string;
          fulfilled_at?: string;
        } = {
          status,
          notes: null,
        };

        if (status === "APPROVED") {
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = user.id;
        } else if (status === "FULFILLED") {
          updateData.fulfilled_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("reward_redemptions")
          .update(updateData)
          .eq("id", redemptionId);

        if (updateError) throw updateError;

        if (status === "DENIED" && redemptionData) {
          const { data: characterData, error: characterError } = await supabase
            .from("characters")
            .select("gold")
            .eq("user_id", redemptionData.user_id)
            .single();

          if (characterError) throw characterError;

          const { error: refundError } = await supabase
            .from("characters")
            .update({
              gold: characterData.gold + redemptionData.cost,
            })
            .eq("user_id", redemptionData.user_id);

          if (refundError) throw refundError;
        }

        if (status === "DENIED") {
          await refreshCharacter();
        }
      } catch (error) {
        console.error("Failed to update redemption:", error);
        onError?.(
          error instanceof Error
            ? error.message
            : "Failed to update redemption",
        );
      }
    },
    [user, onError, refreshCharacter],
  );

  const pendingRedemptions = useMemo(() => {
    return redemptions.filter((r) => r.status === "PENDING");
  }, [redemptions]);

  const goldBalance = useMemo(() => character?.gold || 0, [character]);

  const hasPendingRedemptions = useMemo(
    () => user?.role === "GUILD_MASTER" && pendingRedemptions.length > 0,
    [user?.role, pendingRedemptions.length],
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
      {/* Header with Gold Balance */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-2xl font-bold text-yellow-800 flex items-center gap-2"
            data-testid="reward-store-title"
          >
            <Star size={24} className="text-yellow-700" />
            Reward Store
          </h2>
          <div className="flex items-center space-x-4">
            {hasPendingRedemptions && (
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                <Bell size={16} className="text-orange-600" />
                <span className="text-orange-600 font-medium">
                  {pendingRedemptions.length} pending
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Coins size={24} className="text-yellow-700" />
              <span
                className="text-xl font-bold text-yellow-700"
                data-testid="gold-balance"
              >
                {goldBalance} Gold
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <RewardCatalog rewards={rewards}>
        {(reward) => (
          <RewardCard
            reward={reward}
            canAfford={canAfford(reward.cost)}
            redemptionStatus={getRedemptionStatus(reward.id)}
            isRedeeming={redeeming === reward.id}
            onRedeem={handleRedeem}
          />
        )}
      </RewardCatalog>

      {/* Pending Requests Section for Guild Masters */}
      {hasPendingRedemptions && (
        <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-orange-800" />
            Pending Approval Requests
          </h3>
          <div className="space-y-4">
            {pendingRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="bg-white border border-orange-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-gray-900">
                        {redemption.reward_name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Coins size={14} className="text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-600">
                          {redemption.cost}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Requested by:</strong>{" "}
                      {redemption.user_profiles.name}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <strong>Request Date:</strong>{" "}
                      {redemption.requested_at
                        ? new Date(redemption.requested_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                    {redemption.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Notes:</strong> {redemption.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleApproval(redemption.id, "APPROVED")}
                    variant="success"
                    size="sm"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproval(redemption.id, "DENIED")}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle size={16} className="mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Redemptions */}
      <RedemptionHistory
        redemptions={redemptions}
        isGuildMaster={user?.role === "GUILD_MASTER"}
        onApprove={(id) => handleApproval(id, "APPROVED")}
        onDeny={(id) => handleApproval(id, "DENIED")}
        onFulfill={(id) => handleApproval(id, "FULFILLED")}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {redeemSuccess.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl border border-green-400 flex items-center gap-3"
          >
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Reward Redeemed!</p>
              <p className="text-sm text-green-100">
                {redeemSuccess.rewardName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
