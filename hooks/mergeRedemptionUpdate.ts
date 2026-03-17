import type { RewardRedemptionWithUser } from "@/lib/reward-service";
import type { RewardRedemption } from "@/lib/types/database";

/**
 * Merges a DB-confirmed redemption row into the local state array in-place.
 * Preserves the joined user_profiles sub-object from the existing entry.
 */
export function mergeRedemptionUpdate(
  redemptions: RewardRedemptionWithUser[],
  updated: RewardRedemption,
): RewardRedemptionWithUser[] {
  return redemptions.map((r) =>
    r.id === updated.id
      ? { ...r, ...updated, user_profiles: r.user_profiles }
      : r,
  );
}
