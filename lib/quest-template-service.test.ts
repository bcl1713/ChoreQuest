/**
 * Unit tests for QuestTemplateService
 * Tests extended methods for recurring quest system: pauseTemplate, resumeTemplate, getTemplatesByType
 */

import { QuestTemplateService } from "@/lib/quest-template-service";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("QuestTemplateService - Extended Methods", () => {
  let service: QuestTemplateService;
  let mockFrom: jest.Mock;

  const mockTemplateId = "template-123";
  const mockFamilyId = "family-123";

  const mockTemplate = {
    id: "template-123",
    title: "Clean Your Room",
    description: "Make your bed and tidy up",
    difficulty: "EASY",
    category: "DAILY",
    xp_reward: 50,
    gold_reward: 10,
    quest_type: "INDIVIDUAL",
    recurrence_pattern: "DAILY",
    is_active: true,
    is_paused: false,
    family_id: "family-123",
    assigned_character_ids: ["char-1", "char-2"],
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:00:00Z",
  };

  const mockFamilyTemplate = {
    ...mockTemplate,
    id: "template-456",
    title: "Take Out Trash",
    quest_type: "FAMILY",
    assigned_character_ids: null,
  };

  beforeEach(() => {
    service = new QuestTemplateService();
    mockFrom = jest.fn();
    (supabase.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("pauseTemplate", () => {
    it("should pause a quest template", async () => {
      const pausedTemplate = { ...mockTemplate, is_paused: true };

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: pausedTemplate,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.pauseTemplate(mockTemplateId);

      expect(result).toEqual(pausedTemplate);
      expect(result.is_paused).toBe(true);
    });

    it("should call update with is_paused=true", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTemplate, is_paused: true },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await service.pauseTemplate(mockTemplateId);

      expect(mockUpdate).toHaveBeenCalledWith({ is_paused: true });
    });

    it("should throw error when pause fails", async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      await expect(service.pauseTemplate(mockTemplateId)).rejects.toThrow(
        "Failed to pause quest template: Database error"
      );
    });

    it("should use correct query chain", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockTemplate, is_paused: true },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await service.pauseTemplate(mockTemplateId);

      expect(mockFrom).toHaveBeenCalledWith("quest_templates");
      expect(mockUpdate).toHaveBeenCalledWith({ is_paused: true });
      expect(mockEq).toHaveBeenCalledWith("id", mockTemplateId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe("resumeTemplate", () => {
    it("should resume a paused quest template", async () => {
      const resumedTemplate = { ...mockTemplate, is_paused: false };

      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: resumedTemplate,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.resumeTemplate(mockTemplateId);

      expect(result).toEqual(resumedTemplate);
      expect(result.is_paused).toBe(false);
    });

    it("should call update with is_paused=false", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTemplate, is_paused: false },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await service.resumeTemplate(mockTemplateId);

      expect(mockUpdate).toHaveBeenCalledWith({ is_paused: false });
    });

    it("should throw error when resume fails", async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      await expect(service.resumeTemplate(mockTemplateId)).rejects.toThrow(
        "Failed to resume quest template: Database error"
      );
    });

    it("should use correct query chain", async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { ...mockTemplate, is_paused: false },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await service.resumeTemplate(mockTemplateId);

      expect(mockFrom).toHaveBeenCalledWith("quest_templates");
      expect(mockUpdate).toHaveBeenCalledWith({ is_paused: false });
      expect(mockEq).toHaveBeenCalledWith("id", mockTemplateId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe("getTemplatesByType", () => {
    it("should fetch INDIVIDUAL quest templates", async () => {
      const individualTemplates = [mockTemplate];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: individualTemplates,
                  error: null,
                }),
              }),
            }),
        }),
      });

      const result = await service.getTemplatesByType(mockFamilyId, "INDIVIDUAL");

      expect(result).toEqual(individualTemplates);
      expect(result).toHaveLength(1);
      expect(result[0].quest_type).toBe("INDIVIDUAL");
    });

    it("should fetch FAMILY quest templates", async () => {
      const familyTemplates = [mockFamilyTemplate];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: familyTemplates,
                  error: null,
                }),
              }),
            }),
        }),
      });

      const result = await service.getTemplatesByType(mockFamilyId, "FAMILY");

      expect(result).toEqual(familyTemplates);
      expect(result).toHaveLength(1);
      expect(result[0].quest_type).toBe("FAMILY");
    });

    it("should return empty array when no templates match", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
        }),
      });

      const result = await service.getTemplatesByType(mockFamilyId, "INDIVIDUAL");

      expect(result).toEqual([]);
    });

    it("should filter by family_id, quest_type, and is_active=true", async () => {
      const mockEq3 = jest.fn().mockResolvedValue({
        data: [mockTemplate],
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({
        eq: mockEq3,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      await service.getTemplatesByType(mockFamilyId, "INDIVIDUAL");

      expect(mockFrom).toHaveBeenCalledWith("quest_templates");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq1).toHaveBeenCalledWith("family_id", mockFamilyId);
      expect(mockEq2).toHaveBeenCalledWith("quest_type", "INDIVIDUAL");
      expect(mockEq3).toHaveBeenCalledWith("is_active", true);
    });

    it("should return null when data is null (no error)", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
        }),
      });

      const result = await service.getTemplatesByType(mockFamilyId, "FAMILY");

      expect(result).toEqual([]);
    });

    it("should throw error when query fails", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database error" },
                }),
              }),
            }),
        }),
      });

      await expect(
        service.getTemplatesByType(mockFamilyId, "INDIVIDUAL")
      ).rejects.toThrow("Failed to fetch quest templates by type: Database error");
    });

    it("should handle multiple templates of same type", async () => {
      const template2 = {
        ...mockTemplate,
        id: "template-789",
        title: "Brush Teeth",
      };
      const multipleTemplates = [mockTemplate, template2];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn()
            .mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                eq: jest.fn().mockResolvedValue({
                  data: multipleTemplates,
                  error: null,
                }),
              }),
            }),
        }),
      });

      const result = await service.getTemplatesByType(mockFamilyId, "INDIVIDUAL");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("template-123");
      expect(result[1].id).toBe("template-789");
    });
  });
});
