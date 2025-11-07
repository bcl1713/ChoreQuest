/**
 * Integration tests for QuestInstanceService
 * Tests claimQuest, releaseQuest, and assignQuest methods
 * Run with: npm run test -- quest-instance-service.integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { questInstanceService } from "@/lib/quest-instance-service";

// Create admin client with service role key to bypass RLS for setup
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"
);

describe("QuestInstanceService Integration Tests", () => {
  let testFamilyId: string;
  let testGMUserId: string;
  let testGMEmail: string;
  let testHeroUserId: string;
  let testHeroCharacterId: string;
  let testFamilyQuestId: string;

  // Service instance using admin client to bypass RLS
  let questService: InstanceType<typeof questInstanceService.constructor>;

  beforeAll(async () => {
    // Create GM user using admin auth API
    const gmEmail = `gm${Date.now()}@example.com`;
    const { data: gmAuthUser, error: gmAuthError } = await adminSupabase.auth.admin.createUser({
      email: gmEmail,
      password: "testpassword123",
      email_confirm: true,
    });

    if (gmAuthError || !gmAuthUser.user) {
      throw new Error(`Failed to create GM user: ${gmAuthError?.message}`);
    }
    testGMUserId = gmAuthUser.user.id;
    testGMEmail = gmAuthUser.user.email!;

    // Create test family using admin client (bypasses RLS)
    const { data: family, error: familyError } = await adminSupabase
      .from("families")
      .insert({ name: "Quest Claim Test Family", code: `QCT${Date.now()}` })
      .select()
      .single();

    if (familyError) throw new Error(`Failed to create test family: ${familyError.message}`);

    testFamilyId = family.id;

    // Create GM profile using admin client
    await adminSupabase.from("user_profiles").insert({
      id: testGMUserId,
      email: gmAuthUser.user.email!,
      name: "Test GM",
      family_id: testFamilyId,
      role: "GUILD_MASTER",
    });

    // Create Hero user using admin auth API
    const heroEmail = `hero${Date.now()}@example.com`;
    const { data: heroAuthUser, error: heroAuthError } = await adminSupabase.auth.admin.createUser({
      email: heroEmail,
      password: "testpassword123",
      email_confirm: true,
    });

    if (heroAuthError || !heroAuthUser.user) {
      throw new Error(`Failed to create hero user: ${heroAuthError?.message}`);
    }
    testHeroUserId = heroAuthUser.user.id;

    // Create hero profile using admin client
    await adminSupabase.from("user_profiles").insert({
      id: testHeroUserId,
      email: heroAuthUser.user.email!,
      name: "Test Hero",
      family_id: testFamilyId,
      role: "HERO",
    });

    // Create hero character using admin client
    const { data: character, error: characterError } = await adminSupabase
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

    // Create a FAMILY quest in AVAILABLE status using admin client
    const { data: quest, error: questError } = await adminSupabase
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

    // Initialize quest service with admin client to bypass RLS
    const { QuestInstanceService } = await import("@/lib/quest-instance-service");
    questService = new QuestInstanceService(adminSupabase);
  }, 30000);

  afterAll(async () => {
    // Clean up test data using admin client
    if (testFamilyQuestId) {
      await adminSupabase.from("quest_instances").delete().eq("id", testFamilyQuestId);
    }
    if (testHeroCharacterId) {
      await adminSupabase.from("characters").delete().eq("id", testHeroCharacterId);
    }
    if (testFamilyId) {
      await adminSupabase.from("quest_instances").delete().eq("family_id", testFamilyId);
      await adminSupabase.from("user_profiles").delete().eq("family_id", testFamilyId);
      await adminSupabase.from("families").delete().eq("id", testFamilyId);
    }
  }, 30000);

  describe("claimQuest", () => {
    it("should successfully claim a family quest", async () => {
      const claimedQuest = await questService.claimQuest(testFamilyQuestId, testHeroCharacterId);

      expect(claimedQuest).toBeDefined();
      expect(claimedQuest.status).toBe("CLAIMED");
      expect(claimedQuest.assigned_to_id).toBe(testHeroUserId);
      expect(claimedQuest.volunteered_by).toBe(testHeroCharacterId);
      expect(claimedQuest.volunteer_bonus).toBe(0.2); // 20% bonus
    });

    it("should fail if hero already has active family quest", async () => {
      // Try to claim another quest while already having one
      const { data: anotherQuest } = await adminSupabase
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

      await expect(questService.claimQuest(anotherQuest!.id, testHeroCharacterId)).rejects.toThrow(
        "Hero already has an active family quest"
      );

      // Clean up
      if (anotherQuest) {
        await adminSupabase.from("quest_instances").delete().eq("id", anotherQuest.id);
      }
    });
  });

  describe("releaseQuest", () => {
    it("should successfully release a claimed quest", async () => {
      const releasedQuest = await questService.releaseQuest(testFamilyQuestId, testHeroCharacterId);

      expect(releasedQuest).toBeDefined();
      expect(releasedQuest.status).toBe("AVAILABLE");
      expect(releasedQuest.assigned_to_id).toBeNull();
      expect(releasedQuest.volunteered_by).toBeNull();
      expect(releasedQuest.volunteer_bonus).toBeNull();
    });
  });

  describe("assignQuest", () => {
    it("should allow GM to manually assign a quest (no volunteer bonus)", async () => {
      const assignedQuest = await questService.assignQuest(testFamilyQuestId, testHeroCharacterId, testGMUserId);

      expect(assignedQuest).toBeDefined();
      expect(assignedQuest.status).toBe("PENDING");
      expect(assignedQuest.assigned_to_id).toBe(testHeroUserId);
      expect(assignedQuest.volunteered_by).toBe(testHeroCharacterId); // Track specific character for approval path
      expect(assignedQuest.volunteer_bonus).toBeNull(); // No bonus for GM assignment
    });
  });

  describe("approveQuest", () => {
    let questToApproveId: string;

    beforeAll(async () => {
      // Create quest for approval using admin client (bypasses RLS)
      const { data: quest, error: questError } = await adminSupabase
        .from("quest_instances")
        .insert({
          title: "Quest Ready For Approval",
          description: "Approve this quest to complete the flow",
          xp_reward: 100,
          gold_reward: 60,
          difficulty: "EASY",
          category: "DAILY",
          family_id: testFamilyId,
          created_by_id: testGMUserId,
          quest_type: "FAMILY",
          status: "CLAIMED",
          assigned_to_id: testHeroUserId,
          volunteered_by: testHeroCharacterId,
          volunteer_bonus: 0.2,
        })
        .select()
        .single();

      if (questError || !quest) {
        throw new Error(`Failed to create quest for approval test: ${questError?.message}`);
      }

      questToApproveId = quest.id;

      // Simulate active family quest assignment using admin client
      const { error: activeQuestError } = await adminSupabase
        .from("characters")
        .update({ active_family_quest_id: questToApproveId })
        .eq("id", testHeroCharacterId);

      if (activeQuestError) {
        throw new Error(`Failed to set active family quest: ${activeQuestError.message}`);
      }
    }, 30000);

    it("should allow GM to approve an ad-hoc family quest", async () => {
      await supabase.auth.signInWithPassword({
        email: testGMEmail,
        password: "testpassword123",
      });

      const approvedQuest = await questService.approveQuest(questToApproveId);

      expect(approvedQuest).toBeDefined();
      expect(approvedQuest.status).toBe("APPROVED");
      expect(approvedQuest.approved_at).toBeTruthy();
      expect(approvedQuest.completed_at).toBeTruthy();

      const { data: updatedCharacter, error: characterError } = await supabase
        .from("characters")
        .select("xp, gold, level, active_family_quest_id")
        .eq("id", testHeroCharacterId)
        .single();

      if (characterError || !updatedCharacter) {
        throw new Error(`Failed to fetch character after approval: ${characterError?.message}`);
      }

      expect(updatedCharacter.xp).toBe(120); // 100 base + 20 volunteer bonus
      expect(updatedCharacter.gold).toBe(60 + 12); // 60 base + 12 volunteer bonus
      expect(updatedCharacter.active_family_quest_id).toBeNull();
      expect(updatedCharacter.level).toBeGreaterThan(1);
    });
  });
});
