/**
 * Integration tests for Reward Template System
 * These tests verify that template rewards are automatically copied to new families
 * Run with: npm run test -- reward-template-service.integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { supabase } from "@/lib/supabase";

describe("Reward Template System Integration Tests", () => {
  let testFamilyId: string;
  let testUserId: string;
  const createdFamilyIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Insert template rewards with family_id = NULL for testing
    // (In production, these come from the migration file)
    const templateRewards = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "30 Minutes Extra Screen Time",
        description: "Earn 30 additional minutes of screen time for games, videos, or apps of your choice.",
        type: "SCREEN_TIME",
        cost: 50,
        family_id: null,
        is_active: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Skip One Chore",
        description: "Skip your least favorite chore for the day - no questions asked!",
        type: "PRIVILEGE",
        cost: 100,
        family_id: null,
        is_active: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        name: "Small Treat",
        description: "Choose a special snack, candy, or drink from the store.",
        type: "PURCHASE",
        cost: 25,
        family_id: null,
        is_active: true,
      },
    ];

    // Insert template rewards using ON CONFLICT DO NOTHING (idempotent)
    for (const reward of templateRewards) {
      await supabase.from("rewards").upsert(reward, { onConflict: "id" });
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const familyId of createdFamilyIds) {
      await supabase.from("rewards").delete().eq("family_id", familyId);
      await supabase.from("user_profiles").delete().eq("family_id", familyId);
      await supabase.from("families").delete().eq("id", familyId);
    }

    for (const userId of createdUserIds) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });

  describe("Template Reward Copying", () => {
    it("should copy all template rewards when a new family is created", async () => {
      // Create test user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: `reward-test-${Date.now()}@example.com`,
        password: "testpassword123",
      });

      if (authError || !authUser.user) {
        throw new Error(`Failed to create test user: ${authError?.message}`);
      }
      testUserId = authUser.user.id;
      createdUserIds.push(testUserId);

      // Create test family (this should trigger the auto-copy)
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: "Reward Test Family", code: `RWRD${Date.now()}` })
        .select()
        .single();

      if (familyError || !family) {
        throw new Error(`Failed to create test family: ${familyError?.message}`);
      }
      testFamilyId = family.id;
      createdFamilyIds.push(testFamilyId);

      // Create user profile
      await supabase.from("user_profiles").insert({
        id: testUserId,
        email: authUser.user.email!,
        name: "Reward Test User",
        family_id: testFamilyId,
        role: "GUILD_MASTER",
      });

      // Sign in as this user to establish session for RLS
      await supabase.auth.signInWithPassword({
        email: authUser.user.email!,
        password: "testpassword123",
      });

      // Wait a moment for trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Query rewards for the new family
      const { data: copiedRewards, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .eq("family_id", testFamilyId);

      if (rewardsError) {
        throw new Error(`Failed to query rewards: ${rewardsError.message}`);
      }

      // Verify rewards were copied
      expect(copiedRewards).toBeDefined();
      expect(copiedRewards!.length).toBeGreaterThanOrEqual(3);

      // Verify the copied rewards have correct properties
      const screenTimeReward = copiedRewards!.find(
        (r) => r.name === "30 Minutes Extra Screen Time"
      );
      expect(screenTimeReward).toBeDefined();
      expect(screenTimeReward!.type).toBe("SCREEN_TIME");
      expect(screenTimeReward!.cost).toBe(50);
      expect(screenTimeReward!.is_active).toBe(true);
      expect(screenTimeReward!.family_id).toBe(testFamilyId);
      expect(screenTimeReward!.id).not.toBe("00000000-0000-0000-0000-000000000001"); // Should have new UUID

      const privilegeReward = copiedRewards!.find((r) => r.name === "Skip One Chore");
      expect(privilegeReward).toBeDefined();
      expect(privilegeReward!.type).toBe("PRIVILEGE");
      expect(privilegeReward!.cost).toBe(100);

      const purchaseReward = copiedRewards!.find((r) => r.name === "Small Treat");
      expect(purchaseReward).toBeDefined();
      expect(purchaseReward!.type).toBe("PURCHASE");
      expect(purchaseReward!.cost).toBe(25);
    });

    it("should copy all 15 template rewards from migration", async () => {
      // This test verifies that the migration templates are correctly copied

      // Create a new family
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: `no-template-test-${Date.now()}@example.com`,
        password: "testpassword123",
      });

      if (authError || !authUser.user) {
        throw new Error(`Failed to create test user: ${authError?.message}`);
      }
      createdUserIds.push(authUser.user.id);

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: "No Template Family", code: `NOTPL${Date.now()}` })
        .select()
        .single();

      if (familyError || !family) {
        throw new Error(`Failed to create test family: ${familyError?.message}`);
      }
      createdFamilyIds.push(family.id);

      // Create user profile
      await supabase.from("user_profiles").insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        name: "No Template Test User",
        family_id: family.id,
        role: "GUILD_MASTER",
      });

      // Sign in
      await supabase.auth.signInWithPassword({
        email: authUser.user.email!,
        password: "testpassword123",
      });

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Query rewards for the new family
      const { data: copiedRewards, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .eq("family_id", family.id);

      if (rewardsError) {
        throw new Error(`Failed to query rewards: ${rewardsError.message}`);
      }

      // Should have copied all 15 templates from the migration
      expect(copiedRewards).toBeDefined();
      expect(copiedRewards!.length).toBeGreaterThanOrEqual(15); // At least 15 from migration
    });

    it("copied rewards should be independent from global templates", async () => {
      // Create a new family
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: `independence-test-${Date.now()}@example.com`,
        password: "testpassword123",
      });

      if (authError || !authUser.user) {
        throw new Error(`Failed to create test user: ${authError?.message}`);
      }
      createdUserIds.push(authUser.user.id);

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: "Independence Test Family", code: `INDEP${Date.now()}` })
        .select()
        .single();

      if (familyError || !family) {
        throw new Error(`Failed to create test family: ${familyError?.message}`);
      }
      createdFamilyIds.push(family.id);

      // Create user profile and sign in
      await supabase.from("user_profiles").insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        name: "Independence Test User",
        family_id: family.id,
        role: "GUILD_MASTER",
      });

      await supabase.auth.signInWithPassword({
        email: authUser.user.email!,
        password: "testpassword123",
      });

      // Wait for trigger
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get a copied reward (using migration template ID 00000000-0000-0000-0000-000000000009)
      const { data: copiedReward } = await supabase
        .from("rewards")
        .select("*")
        .eq("family_id", family.id)
        .eq("name", "Small Treat")
        .single();

      expect(copiedReward).toBeDefined();
      expect(copiedReward!.cost).toBe(25); // Original cost from template

      // Update the copied reward
      const { data: updatedReward, error: updateError } = await supabase
        .from("rewards")
        .update({ cost: 50, name: "Modified Small Treat" })
        .eq("id", copiedReward!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedReward!.cost).toBe(50);
      expect(updatedReward!.name).toBe("Modified Small Treat");

      // Verify the global template is unchanged by checking the copied reward has a different ID
      // (The template ID is 00000000-0000-0000-0000-000000000009, but copied reward has new UUID)
      expect(copiedReward!.id).not.toBe("00000000-0000-0000-0000-000000000009");

      // The fact that we could update the copied reward without affecting other families
      // proves independence. We can verify by creating another family and checking its reward.
      const { data: authUser2 } = await supabase.auth.signUp({
        email: `independence-verify-${Date.now()}@example.com`,
        password: "testpassword123",
      });
      createdUserIds.push(authUser2!.user!.id);

      const { data: family2 } = await supabase
        .from("families")
        .insert({ name: "Verify Family", code: `VRFY${Date.now()}` })
        .select()
        .single();
      createdFamilyIds.push(family2!.id);

      await supabase.from("user_profiles").insert({
        id: authUser2!.user!.id,
        email: authUser2!.user!.email!,
        name: "Verify User",
        family_id: family2!.id,
        role: "GUILD_MASTER",
      });

      await supabase.auth.signInWithPassword({
        email: authUser2!.user!.email!,
        password: "testpassword123",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check that the new family got the original template (not the modified one)
      const { data: family2Reward } = await supabase
        .from("rewards")
        .select("*")
        .eq("family_id", family2!.id)
        .eq("name", "Small Treat") // Original name, not "Modified Small Treat"
        .single();

      expect(family2Reward).toBeDefined();
      expect(family2Reward!.cost).toBe(25); // Original cost, not 50
      expect(family2Reward!.name).toBe("Small Treat"); // Original name
    });
  });
});
