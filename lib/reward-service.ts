/**
 * Reward Service
 * Handles all CRUD operations for rewards with family-scoped RLS compliance
 */

import { supabase } from "@/lib/supabase";
import { Reward, CreateRewardInput, UpdateRewardInput } from "@/lib/types/database";

export class RewardService {
  /**
   * Get all active rewards for a family
   * @param familyId - The family ID to fetch rewards for
   * @returns Array of active rewards
   */
  async getRewardsForFamily(familyId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("family_id", familyId)
      .eq("is_active", true);

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
   * Soft delete a reward by setting is_active to false
   * @param rewardId - The reward ID to delete
   * @returns The deleted reward
   */
  async deleteReward(rewardId: string): Promise<Reward> {
    const { data, error } = await supabase
      .from("rewards")
      .update({ is_active: false })
      .eq("id", rewardId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete reward: ${error.message}`);
    }

    return data;
  }

  /**
   * Reactivate a soft-deleted reward
   * @param rewardId - The reward ID to activate
   * @returns The activated reward
   */
  async activateReward(rewardId: string): Promise<Reward> {
    const { data, error } = await supabase
      .from("rewards")
      .update({ is_active: true })
      .eq("id", rewardId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate reward: ${error.message}`);
    }

    return data;
  }
}
