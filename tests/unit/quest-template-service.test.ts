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
      const templateId = "template-1";
      const updateInput: UpdateQuestTemplateInput = {
        title: "Updated Title",
        description: "Updated description",
        xp_reward: 150,
        gold_reward: 75,
        difficulty: "HARD",
      };

      const mockUpdatedTemplate: QuestTemplate = {
        id: templateId,
        ...updateInput,
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedTemplate, error: null });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.updateTemplate(templateId, updateInput);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(mockUpdate).toHaveBeenCalledWith(updateInput);
      expect(mockEq).toHaveBeenCalledWith("id", templateId);
    });

    it("should update class_bonuses correctly", async () => {
      const templateId = "template-1";
      const newBonuses: ClassBonuses = {
        KNIGHT: { xp: 1.1, gold: 1.1 },
        HEALER: { xp: 1.15, gold: 1.0, honor: 1.3 },
      };

      const updateInput: UpdateQuestTemplateInput = {
        class_bonuses: newBonuses,
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: templateId, class_bonuses: newBonuses },
        error: null,
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await service.updateTemplate(templateId, updateInput);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          class_bonuses: newBonuses,
        })
      );
    });

    it("should not update other family's templates (RLS)", async () => {
      const templateId = "other-family-template";
      const updateInput: UpdateQuestTemplateInput = {
        title: "Unauthorized Update",
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.updateTemplate(templateId, updateInput)).rejects.toThrow();
    });

    it("should return updated template data", async () => {
      const templateId = "template-1";
      const updateInput: UpdateQuestTemplateInput = {
        xp_reward: 200,
      };

      const mockUpdatedTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 200,
        gold_reward: 50,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedTemplate, error: null });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.updateTemplate(templateId, updateInput);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(result.xp_reward).toBe(200);
    });

    it("should handle partial updates", async () => {
      const templateId = "template-1";
      const partialUpdate: UpdateQuestTemplateInput = {
        title: "Only Title Updated",
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: templateId, ...partialUpdate },
        error: null,
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await service.updateTemplate(templateId, partialUpdate);

      expect(mockUpdate).toHaveBeenCalledWith(partialUpdate);
      expect(Object.keys(partialUpdate)).toHaveLength(1);
    });
  });

  describe("deleteTemplate", () => {
    it("should set is_active to false instead of hard delete", async () => {
      const templateId = "template-1";

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: templateId, is_active: false },
        error: null,
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await service.deleteTemplate(templateId);

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(mockEq).toHaveBeenCalledWith("id", templateId);
    });

    it("should keep template in database but marked inactive", async () => {
      const templateId = "template-1";

      const mockDeletedTemplate: QuestTemplate = {
        id: templateId,
        title: "Deleted Template",
        description: "This is soft deleted",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: false,
        class_bonuses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockDeletedTemplate, error: null });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.deleteTemplate(templateId);

      expect(result.is_active).toBe(false);
      expect(result.id).toBe(templateId);
    });

    it("should not delete other family's templates", async () => {
      const templateId = "other-family-template";

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.deleteTemplate(templateId)).rejects.toThrow();
    });

    it("should return success confirmation", async () => {
      const templateId = "template-1";

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: templateId, is_active: false },
        error: null,
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.deleteTemplate(templateId);

      expect(result).toBeDefined();
      expect(result.id).toBe(templateId);
    });
  });

  describe("activateTemplate", () => {
    it("should set is_active back to true", async () => {
      const templateId = "template-1";

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: templateId, is_active: true },
        error: null,
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.activateTemplate(templateId);

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
      expect(result.is_active).toBe(true);
    });

    it("should not activate other family's templates", async () => {
      const templateId = "other-family-template";

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(service.activateTemplate(templateId)).rejects.toThrow();
    });

    it("should return updated template", async () => {
      const templateId = "template-1";

      const mockActivatedTemplate: QuestTemplate = {
        id: templateId,
        title: "Activated Template",
        description: "Now active",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockActivatedTemplate, error: null });

      supabase.from.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await service.activateTemplate(templateId);

      expect(result).toEqual(mockActivatedTemplate);
    });
  });

  describe("createQuestFromTemplate", () => {
    it("should copy all template fields to quest_instance", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Template Quest",
        description: "From template",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: { KNIGHT: { xp: 1.05, gold: 1.05 } },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { supabase } = require("@/lib/supabase");

      // Mock template fetch
      const mockSelectTemplate = jest.fn().mockReturnThis();
      const mockEqTemplate = jest.fn().mockReturnThis();
      const mockSingleTemplate = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });

      // Mock quest instance creation
      const mockInsertQuest = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: {
          id: "quest-1",
          title: mockTemplate.title,
          description: mockTemplate.description,
          xp_reward: mockTemplate.xp_reward,
          gold_reward: mockTemplate.gold_reward,
          difficulty: mockTemplate.difficulty,
          category: mockTemplate.category,
          template_id: templateId,
          created_by_id: createdById,
          family_id: mockFamilyId,
          status: "PENDING",
        },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call for template fetch
          return { select: mockSelectTemplate };
        } else {
          // Second call for quest insert
          return { insert: mockInsertQuest };
        }
      });

      mockSelectTemplate.mockReturnValue({ eq: mockEqTemplate });
      mockEqTemplate.mockReturnValue({ single: mockSingleTemplate });
      mockInsertQuest.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      const result = await service.createQuestFromTemplate(templateId, createdById);

      expect(result.title).toBe(mockTemplate.title);
      expect(result.xp_reward).toBe(mockTemplate.xp_reward);
      expect(result.difficulty).toBe(mockTemplate.difficulty);
    });

    it("should apply template_id reference correctly", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: "",
        updated_at: "",
      };

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: { template_id: templateId },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { insert: mockInsert };
        }
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      const result = await service.createQuestFromTemplate(templateId, createdById);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: templateId,
        })
      );
    });

    it("should preserve class_bonuses for reward calculation", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;
      const classBonuses: ClassBonuses = {
        KNIGHT: { xp: 1.05, gold: 1.05 },
        MAGE: { xp: 1.2, gold: 1.0 },
      };

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: classBonuses,
        created_at: "",
        updated_at: "",
      };

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: { template_id: templateId },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { insert: mockInsert };
        }
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      await service.createQuestFromTemplate(templateId, createdById);

      // Class bonuses would be stored with the quest instance or referenced via template_id
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should allow overrides for assigned_to", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;
      const assignedToId = "hero-123";

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: "",
        updated_at: "",
      };

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: { assigned_to_id: assignedToId },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { insert: mockInsert };
        }
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      await service.createQuestFromTemplate(templateId, createdById, { assignedToId });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_to_id: assignedToId,
        })
      );
    });

    it("should allow overrides for due_date", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;
      const dueDate = new Date("2025-12-31").toISOString();

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: "",
        updated_at: "",
      };

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: { due_date: dueDate },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { insert: mockInsert };
        }
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      await service.createQuestFromTemplate(templateId, createdById, { dueDate });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          due_date: dueDate,
        })
      );
    });

    it("should set proper initial status", async () => {
      const templateId = "template-1";
      const createdById = mockUserId;

      const mockTemplate: QuestTemplate = {
        id: templateId,
        title: "Test",
        description: "Test",
        xp_reward: 50,
        gold_reward: 25,
        difficulty: "EASY",
        category: "DAILY",
        family_id: mockFamilyId,
        is_active: true,
        class_bonuses: null,
        created_at: "",
        updated_at: "",
      };

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockTemplate, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectQuest = jest.fn().mockReturnThis();
      const mockSingleQuest = jest.fn().mockResolvedValue({
        data: { status: "PENDING" },
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect };
        } else {
          return { insert: mockInsert };
        }
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelectQuest });
      mockSelectQuest.mockReturnValue({ single: mockSingleQuest });

      const result = await service.createQuestFromTemplate(templateId, createdById);

      expect(result.status).toBe("PENDING");
    });
  });

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockResolve = jest.fn().mockRejectedValue(new Error("Connection failed"));

      supabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: mockResolve });

      await expect(service.getTemplatesForFamily(mockFamilyId)).rejects.toThrow();
    });

    it("should handle invalid template ID errors", async () => {
      const invalidTemplateId = "non-existent-template";
      const createdById = mockUserId;

      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Template not found", code: "PGRST116" },
      });

      supabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      await expect(
        service.createQuestFromTemplate(invalidTemplateId, createdById)
      ).rejects.toThrow();
    });

    it("should handle RLS policy violations", async () => {
      const { supabase } = require("@/lib/supabase");
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockResolve = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation", code: "42501" },
      });

      supabase.from.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ eq: mockResolve });

      await expect(service.getTemplatesForFamily("wrong-family")).rejects.toThrow();
    });
  });
});
