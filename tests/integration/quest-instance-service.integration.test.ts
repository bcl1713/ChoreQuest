/**
 * Integration tests for QuestInstanceService
 * Tests claimQuest, releaseQuest, and assignQuest methods
 * Run with: npm run test -- quest-instance-service.integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { supabase } from "@/lib/supabase";
import { questInstanceService } from "@/lib/quest-instance-service";

describe("QuestInstanceService Integration Tests", () => {
  let testFamilyId: string;
  let testGMUserId: string;
  let testHeroUserId: string;
  let testHeroCharacterId: string;
  let testFamilyQuestId: string;

  beforeAll(async () => {
    // Create GM user
    const { data: gmAuthUser, error: gmAuthError } = await supabase.auth.signUp({
      email: `gm${Date.now()}@example.com`,
      password: "testpassword123",
    });

    if (gmAuthError || !gmAuthUser.user) {
      throw new Error(`Failed to create GM user: ${gmAuthError?.message}`);
    }
    testGMUserId = gmAuthUser.user.id;

    // Create test family
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({ name: "Quest Claim Test Family", code: `QCT${Date.now()}` })
      .select()
      .single();

    if (familyError) throw new Error(`Failed to create test family: ${familyError.message}`);
    testFamilyId = family.id;

    // Create GM profile
    await supabase.from("user_profiles").insert({
      id: testGMUserId,
      email: gmAuthUser.user.email!,
      name: "Test GM",
      family_id: testFamilyId,
      role: "GUILD_MASTER",
    });

    // Create Hero user
    const { data: heroAuthUser, error: heroAuthError } = await supabase.auth.signUp({
      email: `hero${Date.now()}@example.com`,
      password: "testpassword123",
    });

    if (heroAuthError || !heroAuthUser.user) {
      throw new Error(`Failed to create hero user: ${heroAuthError?.message}`);
    }
    testHeroUserId = heroAuthUser.user.id;

    // Create hero profile
    await supabase.from("user_profiles").insert({
      id: testHeroUserId,
      email: heroAuthUser.user.email!,
      name: "Test Hero",
      family_id: testFamilyId,
      role: "HERO",
    });

    // Create hero character
    const { data: character, error: characterError } = await supabase
      .from("characters")
      .insert({
        user_id: testHeroUserId,
        name: "Test Knight",
        class: "KNIGHT",
        level: 1,
        xp: 0,
        gold: 0,
        active_family_quest_id: null,
      })
      .select()
      .single();

    if (characterError) throw new Error(`Failed to create character: ${characterError.message}`);
    testHeroCharacterId = character.id;

    // Sign in as GM to set RLS
    await supabase.auth.signInWithPassword({
      email: gmAuthUser.user.email!,
      password: "testpassword123",
    });

    // Create a FAMILY quest in AVAILABLE status
    const { data: quest, error: questError } = await supabase
      .from("quest_instances")
      .insert({
        title: "Test Family Quest",
        description: "A test family quest for claiming",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: testFamilyId,
        created_by_id: testGMUserId,
        quest_type: "FAMILY",
        status: "AVAILABLE",
      })
      .select()
      .single();

    if (questError) throw new Error(`Failed to create test quest: ${questError.message}`);
    testFamilyQuestId = quest.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testFamilyQuestId) {
      await supabase.from("quest_instances").delete().eq("id", testFamilyQuestId);
    }
    if (testHeroCharacterId) {
      await supabase.from("characters").delete().eq("id", testHeroCharacterId);
    }
    if (testFamilyId) {
      await supabase.from("quest_instances").delete().eq("family_id", testFamilyId);
      await supabase.from("user_profiles").delete().eq("family_id", testFamilyId);
      await supabase.from("families").delete().eq("id", testFamilyId);
    }
  });

  describe("claimQuest", () => {
    it("should successfully claim a family quest", async () => {
      const claimedQuest = await questInstanceService.claimQuest(testFamilyQuestId, testHeroCharacterId);

      expect(claimedQuest).toBeDefined();
      expect(claimedQuest.status).toBe("CLAIMED");
      expect(claimedQuest.assigned_to_id).toBe(testHeroUserId);
      expect(claimedQuest.volunteered_by).toBe(testHeroCharacterId);
      expect(claimedQuest.volunteer_bonus).toBe(0.2); // 20% bonus
    });

    it("should fail if hero already has active family quest", async () => {
      // Try to claim another quest while already having one
      const { data: anotherQuest } = await supabase
        .from("quest_instances")
        .insert({
          title: "Another Family Quest",
          description: "Another test quest",
          xp_reward: 100,
          gold_reward: 50,
          difficulty: "MEDIUM",
          category: "DAILY",
          family_id: testFamilyId,
          created_by_id: testGMUserId,
          quest_type: "FAMILY",
          status: "AVAILABLE",
        })
        .select()
        .single();

      await expect(questInstanceService.claimQuest(anotherQuest!.id, testHeroCharacterId)).rejects.toThrow(
        "Hero already has an active family quest"
      );

      // Clean up
      if (anotherQuest) {
        await supabase.from("quest_instances").delete().eq("id", anotherQuest.id);
      }
    });
  });

  describe("releaseQuest", () => {
    it("should successfully release a claimed quest", async () => {
      const releasedQuest = await questInstanceService.releaseQuest(testFamilyQuestId, testHeroCharacterId);

      expect(releasedQuest).toBeDefined();
      expect(releasedQuest.status).toBe("AVAILABLE");
      expect(releasedQuest.assigned_to_id).toBeNull();
      expect(releasedQuest.volunteered_by).toBeNull();
      expect(releasedQuest.volunteer_bonus).toBeNull();
    });
  });

  describe("assignQuest", () => {
    it("should allow GM to manually assign a quest (no volunteer bonus)", async () => {
      const assignedQuest = await questInstanceService.assignQuest(testFamilyQuestId, testHeroCharacterId, testGMUserId);

      expect(assignedQuest).toBeDefined();
      expect(assignedQuest.status).toBe("CLAIMED");
      expect(assignedQuest.assigned_to_id).toBe(testHeroUserId);
      expect(assignedQuest.volunteered_by).toBeNull(); // No volunteer for GM assignment
      expect(assignedQuest.volunteer_bonus).toBeNull(); // No bonus for GM assignment
    });
  });
});