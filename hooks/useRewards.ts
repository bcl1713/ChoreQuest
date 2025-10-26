"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { RewardService, RewardRedemptionWithUser } from "@/lib/reward-service";
import type { Tables } from "@/lib/types/database";

type Reward = Tables<"rewards">;

const rewardService = new RewardService();

interface UseRewardsReturn {
  rewards: Reward[];
  redemptions: RewardRedemptionWithUser[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing reward and redemption data with realtime updates.
 *
 * This hook consolidates the reward loading logic from reward-manager and provides
 * realtime subscriptions to automatically update both rewards and redemptions when
 * they are created, updated, or deleted.
 *
 * The hook uses optimistic realtime updates for rewards (INSERT/UPDATE/DELETE)
 * and reloads redemptions whenever any redemption changes occur.
 *
 * @returns {UseRewardsReturn} Object containing:
 *   - rewards: Array of reward objects for the current family
 *   - redemptions: Array of redemption objects with user info for the current family
 *   - loading: Boolean indicating if data is currently being fetched
 *   - error: Error message string if fetch failed, null otherwise
 *   - reload: Function to manually trigger a data reload
 *
 * @example
 * const { rewards, redemptions, loading, error, reload } = useRewards();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <RewardList rewards={rewards} redemptions={redemptions} />;
 */
export function useRewards(): UseRewardsReturn {
  const { profile } = useAuth();
  const { onRewardUpdate, onRewardRedemptionUpdate } = useRealtime();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRewards = useCallback(async () => {
    if (!profile?.family_id) {
      setRewards([]);
      setRedemptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [rewardsData, redemptionsData] = await Promise.all([
        rewardService.getRewardsForFamily(profile.family_id),
        rewardService.getRedemptionsForFamily(profile.family_id),
      ]);

      setRewards(rewardsData);
      setRedemptions(redemptionsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load rewards and redemptions";
      setError(message);
      setRewards([]);
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    void loadRewards();
  }, [loadRewards]);

  // Realtime subscription for reward updates
  useEffect(() => {
    const unsubscribe = onRewardUpdate((event) => {
      if (!event?.action) return;

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
        if (deletedId) {
          setRewards((prev) => prev.filter((r) => r.id !== deletedId));
        }
      }
    });

    return unsubscribe;
  }, [onRewardUpdate]);

  // Realtime subscription for redemption updates
  useEffect(() => {
    if (!profile?.family_id) return;

    const unsubscribe = onRewardRedemptionUpdate(async () => {
      // Reload all redemptions when any change occurs
      try {
        const redemptionsData = await rewardService.getRedemptionsForFamily(profile.family_id!);
        setRedemptions(redemptionsData);
      } catch (err) {
        console.error("Failed to reload redemptions:", err);
        // Don't set error state here to avoid disrupting the UI
        // The redemptions will just show stale data until next reload
      }
    });

    return unsubscribe;
  }, [profile?.family_id, onRewardRedemptionUpdate]);

  return {
    rewards,
    redemptions,
    loading,
    error,
    reload: loadRewards,
  };
}
