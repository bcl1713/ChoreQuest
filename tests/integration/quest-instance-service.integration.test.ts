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
  let testGMEmail: string;
  let testHeroUserId: string;
  let testHeroCharacterId: string;
  let testFamilyQuestId: string;

  // Track mocked test users
  const mockUserFixtures = new Map<string, { id: string; email: string }>();

  beforeAll(async () => {
    // Mock the auth methods to prevent real network calls
    const signUpMock = async (credentials: { email: string; password: string }) => {
      // Generate a valid UUID v4 for test users
      const userId = crypto.randomUUID();
      const user = { id: userId, email: credentials.email };
      mockUserFixtures.set(credentials.email, user);
      return { data: { user }, error: null };
    };

    const signInMock = async (credentials: { email: string; password: string }) => {
      const user = mockUserFixtures.get(credentials.email);
      if (!user) {
        return { data: { session: null }, error: new Error("Invalid credentials") };
      }
      return {
        data: {
          session: {
            access_token: `mock-token-${user.id}`,
            user,
          },
        },
        error: null,
      };
    };

    (supabase.auth.signUp as unknown) = signUpMock;
    (supabase.auth.signInWithPassword as unknown) = signInMock;

    // Create GM user
    const { data: gmAuthUser, error: gmAuthError } = await supabase.auth.signUp({
      email: `gm${Date.now()}@example.com`,
      password: "testpassword123",
    });

    if (gmAuthError || !gmAuthUser.user) {
      throw new Error(`Failed to create GM user: ${gmAuthError?.message}`);
    }
    testGMUserId = gmAuthUser.user.id;
    testGMEmail = gmAuthUser.user.email!;

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
  }, 30000);

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
  }, 30000);

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
      expect(assignedQuest.status).toBe("PENDING");
      expect(assignedQuest.assigned_to_id).toBe(testHeroUserId);
      expect(assignedQuest.volunteered_by).toBe(testHeroCharacterId); // Track specific character for approval path
      expect(assignedQuest.volunteer_bonus).toBeNull(); // No bonus for GM assignment
    });
  });

  describe("approveQuest", () => {
    let questToApproveId: string;

    beforeAll(async () => {
      await supabase.auth.signInWithPassword({
        email: testGMEmail,
        password: "testpassword123",
      });

      const { data: quest, error: questError } = await supabase
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

      // Simulate active family quest assignment
      const { error: activeQuestError } = await supabase
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

      const approvedQuest = await questInstanceService.approveQuest(questToApproveId);

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
