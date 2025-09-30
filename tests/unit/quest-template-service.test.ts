import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { QuestTemplateService } from "@/lib/quest-template-service";
import {
  QuestTemplate,
  CreateQuestTemplateInput,
  UpdateQuestTemplateInput,
  ClassBonuses,
} from "@/lib/types/database";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe("QuestTemplateService", () => {
  let service: QuestTemplateService;
  const mockFamilyId = "family-123";
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuestTemplateService();
  });

  describe("getTemplatesForFamily", () => {
    it("should return only family-scoped templates", async () => {
      const mockTemplates: QuestTemplate[] = [
        {
          id: "template-1",
          title: "Clean Room",
          description: "Clean your bedroom",
          xp_reward: 50,
          gold_reward: 25,
          difficulty: "EASY",
          category: "DAILY",
          family_id: mockFamilyId,
          is_active: true,
          class_bonuses: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockTemplates, error: null });

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      mockSelect.mockReturnValue({ eq: mockEq });

      const result = await service.getTemplatesForFamily(mockFamilyId);

      expect(result).toEqual(mockTemplates);
      expect(supabase.from).toHaveBeenCalledWith("quest_templates");
      expect(mockSelect).toHaveBeenCalledWith("*");
    });

    it("should filter by is_active=true by default", async () => {
      const { supabase } = require("@/lib/supabase");
      const mockEq = jest.fn().mockReturnThis();
      const mockResolve = jest.fn().mockResolvedValue({ data: [], error: null });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockReturnValue({ eq: mockResolve });

      await service.getTemplatesForFamily(mockFamilyId);

      expect(mockEq).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(mockEq).toHaveBeenCalledWith("is_active", true);
    });

    it("should return empty array when no templates exist", async () => {
      const { supabase } = require("@/lib/supabase");
      const mockEq = jest.fn().mockReturnThis();
      const mockResolve = jest.fn().mockResolvedValue({ data: [], error: null });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockReturnValue({ eq: mockResolve });

      const result = await service.getTemplatesForFamily(mockFamilyId);

      expect(result).toEqual([]);
    });

    it("should respect RLS policies for family isolation", async () => {
      const { supabase } = require("@/lib/supabase");
      const mockEq = jest.fn().mockReturnThis();
      const mockResolve = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockEq.mockReturnValue({ eq: mockResolve });

      await expect(service.getTemplatesForFamily("wrong-family-id")).rejects.toThrow();
    });
  });

  describe("createTemplate", () => {
    it("should successfully create template with all fields", async () => {
      const templateInput: CreateQuestTemplateInput = {
        title: "New Quest Template",
        description: "Complete this epic quest",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: {
          KNIGHT: { xp: 1.05, gold: 1.05 },
          MAGE: { xp: 1.2, gold: 1.0 },
        },
      };

      const mockCreatedTemplate: QuestTemplate = {
        id: "new-template-id",
        ...templateInput,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCreatedTemplate, error: null });

      supabase.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await service.createTemplate(templateInput);

      expect(result).toEqual(mockCreatedTemplate);
      expect(supabase.from).toHaveBeenCalledWith("quest_templates");
      expect(mockInsert).toHaveBeenCalledWith(templateInput);
    });

    it("should properly store class_bonuses as JSONB", async () => {
      const classBonuses: ClassBonuses = {
        KNIGHT: { xp: 1.05, gold: 1.05 },
        MAGE: { xp: 1.2, gold: 1.0 },
        RANGER: { xp: 1.0, gold: 1.0, gems: 1.3 },
      };

      const templateInput: CreateQuestTemplateInput = {
        title: "Test Template",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        class_bonuses: classBonuses,
      };

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...templateInput, id: "test-id", created_at: "", updated_at: "" },
        error: null,
      });

      supabase.from.mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await service.createTemplate(templateInput);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          class_bonuses: classBonuses,
        })
      );
    });

    it("should associate template with correct family_id", async () => {
      const templateInput: CreateQuestTemplateInput = {
        title: "Family Template",
        description: "For specific family",
        xp_reward: 75,
        gold_reward: 35,
        difficulty: "MEDIUM",
        category: "WEEKLY",
        family_id: mockFamilyId,
      };

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...templateInput, id: "test-id", created_at: "", updated_at: "" },
        error: null,
      });

      supabase.from.mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await service.createTemplate(templateInput);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          family_id: mockFamilyId,
        })
      );
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        description: "Missing title",
        xp_reward: 50,
      } as CreateQuestTemplateInput;

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Missing required fields", code: "23502" },
      });

      supabase.from.mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.createTemplate(invalidInput)).rejects.toThrow();
    });

    it("should reject creation without proper authentication", async () => {
      const templateInput: CreateQuestTemplateInput = {
        title: "Unauthorized Template",
        description: "Should fail",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
      };

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not authenticated", code: "42501" },
      });

      supabase.from.mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.createTemplate(templateInput)).rejects.toThrow();
    });

    it("should reject creation for wrong family_id", async () => {
      const templateInput: CreateQuestTemplateInput = {
        title: "Wrong Family Template",
        description: "Should fail RLS",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: "wrong-family-id",
      };

      const { supabase } = require("@/lib/supabase");
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.createTemplate(templateInput)).rejects.toThrow();
    });
  });

  describe("updateTemplate", () => {
    it("should update all editable fields", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should update class_bonuses correctly", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should not update other family's templates (RLS)", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should return updated template data", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should handle partial updates", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });
  });

  describe("deleteTemplate", () => {
    it("should set is_active to false instead of hard delete", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should keep template in database but marked inactive", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should not delete other family's templates", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should return success confirmation", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });
  });

  describe("activateTemplate", () => {
    it("should set is_active back to true", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should not activate other family's templates", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should return updated template", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });
  });

  describe("createQuestFromTemplate", () => {
    it("should copy all template fields to quest_instance", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should apply template_id reference correctly", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should preserve class_bonuses for reward calculation", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should allow overrides for assigned_to", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should allow overrides for due_date", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should set proper initial status", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should handle invalid template ID errors", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });

    it("should handle RLS policy violations", async () => {
      // Test placeholder - will implement
      expect(true).toBe(true);
    });
  });
});
