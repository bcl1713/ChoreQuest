/**
 * Reward Service
 * Handles all CRUD operations for rewards with family-scoped RLS compliance
 */

import { supabase } from "@/lib/supabase";
import { Reward, CreateRewardInput, UpdateRewardInput } from "@/lib/types/database";

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
      throw new Error(`Failed to fetch rewards: ${error.message}`);
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
      throw new Error(`Failed to create reward: ${error.message}`);
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
    input: UpdateRewardInput
  ): Promise<Reward> {
    const { data, error } = await supabase
      .from("rewards")
      .update(input)
      .eq("id", rewardId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update reward: ${error.message}`);
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
      throw new Error(`Failed to delete reward: ${error.message}`);
    }
  }

}
