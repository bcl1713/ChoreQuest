/**
 * Reward Service
 * Handles all CRUD operations for rewards with family-scoped RLS compliance
 */

import { supabase } from "@/lib/supabase";
import {
  Reward,
  CreateRewardInput,
  UpdateRewardInput,
  RewardRedemption,
  UserProfile,
} from "@/lib/types/database";
import {
  ConflictError,
  NotFoundError,
} from "@/lib/errors";

export interface RewardRedemptionWithUser extends RewardRedemption {
  user_profiles: UserProfile;
  reward_name: string;
  reward_description: string;
  reward_type: "SCREEN_TIME" | "PRIVILEGE" | "PURCHASE" | "EXPERIENCE";
}

export class RewardService {
  /**
   * Get all rewards for a family (active and inactive)
   * @param familyId - The family ID to fetch rewards for
   * @returns Array of all rewards
   */
  async getRewardsForFamily(familyId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("family_id", familyId);

    if (error) {
      throw new NotFoundError(`Failed to fetch rewards: ${error.message}`, "REWARDS_FETCH_FAILED");
    }

    return data || [];
  }

  /**
   * Create a new reward
   * @param input - Reward creation data
   * @returns The created reward
   */
  async createReward(input: CreateRewardInput): Promise<Reward> {
    const { data, error } = await supabase
      .from("rewards")
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new ConflictError(`Failed to create reward: ${error.message}`, "REWARD_CREATE_FAILED");
    }

    return data;
  }

  /**
   * Update an existing reward
   * @param rewardId - The reward ID to update
   * @param input - Reward update data
   * @returns The updated reward
   */
  async updateReward(
    rewardId: string,
    input: UpdateRewardInput,
  ): Promise<Reward> {
    const { data, error } = await supabase
      .from("rewards")
      .update(input)
      .eq("id", rewardId)
      .select()
      .single();

    if (error) {
      throw new ConflictError(`Failed to update reward: ${error.message}`, "REWARD_UPDATE_FAILED");
    }

    return data;
  }

  /**
   * Hard delete a reward (permanently removes from database)
   * Safe because reward_redemptions no longer has FK constraint
   * Redemptions preserve reward details and survive deletion
   * @param rewardId - The reward ID to delete
   */
  async deleteReward(rewardId: string): Promise<void> {
    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("id", rewardId);

    if (error) {
      throw new ConflictError(`Failed to delete reward: ${error.message}`, "REWARD_DELETE_FAILED");
    }
  }

  /**
   * Get all reward redemptions for a family
   * @param familyId - The family ID to fetch redemptions for
   * @returns Array of redemptions with user details
   */
  async getRedemptionsForFamily(
    familyId: string,
  ): Promise<RewardRedemptionWithUser[]> {
    const { data, error } = await supabase
      .from("reward_redemptions")
      .select(
        `
        *,
        user_profiles:user_id(*)
      `,
      )
      .eq("user_profiles.family_id", familyId)
      .order("requested_at", { ascending: false });

    if (error) {
      throw new NotFoundError(`Failed to fetch redemptions: ${error.message}`, "REDEMPTIONS_FETCH_FAILED");
    }

    return (data as unknown as RewardRedemptionWithUser[]) || [];
  }

  /**
   * Update redemption status (APPROVED, DENIED, FULFILLED)
   * @param redemptionId - The redemption ID to update
   * @param status - The new status
   * @param approvedBy - User ID of approver (for APPROVED status)
   * @param notes - Optional notes
   * @returns The updated redemption
   */
  async updateRedemptionStatus(
    redemptionId: string,
    status: "APPROVED" | "DENIED" | "FULFILLED",
    approvedBy?: string,
    notes?: string,
  ): Promise<RewardRedemption> {
    const updateData: {
      status: string;
      notes?: string;
      approved_at?: string;
      approved_by?: string;
      fulfilled_at?: string;
    } = {
      status,
      notes: notes || undefined,
    };

    if (status === "APPROVED") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = approvedBy;
    } else if (status === "FULFILLED") {
      updateData.fulfilled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("reward_redemptions")
      .update(updateData)
      .eq("id", redemptionId)
      .select()
      .single();

    if (error) {
      throw new ConflictError(
        `Failed to update redemption status: ${error.message}`,
        "REDEMPTION_UPDATE_FAILED",
      );
    }

    return data;
  }

  /**
   * Refund gold to a character when redemption is denied
   * @param userId - User ID whose character should receive refund
   * @param goldAmount - Amount of gold to refund
   */
  async refundGold(
    userId: string,
    goldAmount: number,
    redemptionId?: string,
  ): Promise<void> {
    const { error: refundError } = await supabase.rpc("fn_refund_reward_gold", {
      p_user_id: userId,
      p_amount: goldAmount,
      p_redemption_id: redemptionId ?? null,
    });

    if (refundError) {
      throw new ConflictError(`Failed to refund gold: ${refundError.message}`, "REFUND_FAILED");
    }
  }
}
