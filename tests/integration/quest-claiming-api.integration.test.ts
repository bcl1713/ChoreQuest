/**
 * Integration tests for Quest Claiming API Routes
 * Tests POST /api/quests/:id/claim, /release, and /assign endpoints
 * Run with: npm run test -- quest-claiming-api.integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { supabase } from "@/lib/supabase";

describe("Quest Claiming API Integration Tests", () => {
  let testFamilyId: string;
  let testGMUserId: string;
  let testHeroUserId: string;
  let testHeroCharacterId: string;
  let testFamilyQuestId: string;
  let gmAuthToken: string;
  let heroAuthToken: string;

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

    // Sign in as GM to get auth token
    const { data: gmSession } = await supabase.auth.signInWithPassword({
      email: gmAuthUser.user.email!,
      password: "testpassword123",
    });
    gmAuthToken = gmSession?.session?.access_token || "";

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

    // Sign in as Hero to get auth token
    const { data: heroSession } = await supabase.auth.signInWithPassword({
      email: heroAuthUser.user.email!,
      password: "testpassword123",
    });
    heroAuthToken = heroSession?.session?.access_token || "";

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

  describe("POST /api/quests/:id/claim", () => {
    it("should successfully claim a family quest", async () => {
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${heroAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quest.status).toBe("CLAIMED");
      expect(data.quest.assigned_to_id).toBe(testHeroUserId);
      expect(data.quest.volunteered_by).toBe(testHeroCharacterId);
      expect(data.quest.volunteer_bonus).toBe(0.2); // 20% bonus
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

      const response = await fetch(`http://localhost:3000/api/quests/${anotherQuest?.id}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${heroAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("already has an active family quest");

      // Clean up
      if (anotherQuest) {
        await supabase.from("quest_instances").delete().eq("id", anotherQuest.id);
      }
    });

    it("should fail without authentication", async () => {
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("authorization");
    });
  });

  describe("POST /api/quests/:id/release", () => {
    it("should successfully release a claimed quest", async () => {
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${heroAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quest.status).toBe("AVAILABLE");
      expect(data.quest.assigned_to_id).toBeNull();
      expect(data.quest.volunteered_by).toBeNull();
      expect(data.quest.volunteer_bonus).toBeNull();
    });

    it("should allow GM to release any quest", async () => {
      // First, have hero claim the quest again
      await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${heroAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      // GM releases the quest
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gmAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quest.status).toBe("AVAILABLE");
    });
  });

  describe("POST /api/quests/:id/assign", () => {
    it("should allow GM to manually assign a quest (no volunteer bonus)", async () => {
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gmAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quest.status).toBe("CLAIMED");
      expect(data.quest.assigned_to_id).toBe(testHeroUserId);
      expect(data.quest.volunteered_by).toBeNull(); // No volunteer for GM assignment
      expect(data.quest.volunteer_bonus).toBeNull(); // No bonus for GM assignment
    });

    it("should fail if non-GM tries to assign", async () => {
      // Release the quest first
      await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gmAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      // Hero tries to assign
      const response = await fetch(`http://localhost:3000/api/quests/${testFamilyQuestId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${heroAuthToken}`,
        },
        body: JSON.stringify({
          characterId: testHeroCharacterId,
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Guild Master");
    });
  });
});
