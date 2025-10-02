/**
 * Integration tests for QuestTemplateService
 * These tests run against a local Supabase instance
 * Run with: npm run test -- quest-template-service.integration
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { QuestTemplateService } from "@/lib/quest-template-service";
import { supabase } from "@/lib/supabase";
import { CreateQuestTemplateInput } from "@/lib/types/database";

describe("QuestTemplateService Integration Tests", () => {
  const service = new QuestTemplateService();
  let testFamilyId: string;
  let testUserId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    // Create test user first (needed for RLS)
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: `integtest${Date.now()}@example.com`,
      password: "testpassword123",
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }
    testUserId = authUser.user.id;

    // Create test family
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({ name: "Integration Test Family", code: `INT${Date.now()}` })
      .select()
      .single();

    if (familyError) throw new Error(`Failed to create test family: ${familyError.message}`);
    testFamilyId = family.id;

    // Create user profile
    await supabase.from("user_profiles").insert({
      id: testUserId,
      email: authUser.user.email!,
      name: "Integration Test User",
      family_id: testFamilyId,
      role: "GUILD_MASTER",
    });

    // Sign in as this user to establish session
    await supabase.auth.signInWithPassword({
      email: authUser.user.email!,
      password: "testpassword123",
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testTemplateId) {
      await supabase.from("quest_templates").delete().eq("id", testTemplateId);
    }
    if (testFamilyId) {
      await supabase.from("quest_templates").delete().eq("family_id", testFamilyId);
      await supabase.from("families").delete().eq("id", testFamilyId);
    }
  });

  describe("createTemplate", () => {
    it("should create a quest template with all fields", async () => {
      const input: CreateQuestTemplateInput = {
        title: "Integration Test Quest",
        description: "This is an integration test",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: testFamilyId,
        is_active: true,
        class_bonuses: {
          KNIGHT: { xp: 1.05, gold: 1.05 },
          MAGE: { xp: 1.2, gold: 1.0 },
        },
      };

      const result = await service.createTemplate(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.xp_reward).toBe(input.xp_reward);
      expect(result.family_id).toBe(testFamilyId);
      expect(result.class_bonuses).toEqual(input.class_bonuses);

      testTemplateId = result.id;
    });
  });

  describe("getTemplatesForFamily", () => {
    it("should retrieve templates for a family", async () => {
      const templates = await service.getTemplatesForFamily(testFamilyId);

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].family_id).toBe(testFamilyId);
    });
  });

  describe("updateTemplate", () => {
    it("should update a template", async () => {
      const updated = await service.updateTemplate(testTemplateId, {
        xp_reward: 200,
        title: "Updated Integration Test Quest",
      });

      expect(updated.id).toBe(testTemplateId);
      expect(updated.xp_reward).toBe(200);
      expect(updated.title).toBe("Updated Integration Test Quest");
    });
  });

  describe("deleteTemplate (soft delete)", () => {
    it("should soft delete a template", async () => {
      const deleted = await service.deleteTemplate(testTemplateId);

      expect(deleted.id).toBe(testTemplateId);
      expect(deleted.is_active).toBe(false);
    });
  });

  describe("activateTemplate", () => {
    it("should reactivate a template", async () => {
      const activated = await service.activateTemplate(testTemplateId);

      expect(activated.id).toBe(testTemplateId);
      expect(activated.is_active).toBe(true);
    });
  });

  describe("createQuestFromTemplate", () => {
    it("should create a quest instance from template", async () => {
      const quest = await service.createQuestFromTemplate(testTemplateId, testUserId);

      expect(quest).toBeDefined();
      expect(quest.template_id).toBe(testTemplateId);
      expect(quest.created_by_id).toBe(testUserId);
      expect(quest.family_id).toBe(testFamilyId);
      expect(quest.status).toBe("PENDING");

      // Clean up
      await supabase.from("quest_instances").delete().eq("id", quest.id);
    });
  });
});
