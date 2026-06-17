import { QuestTemplateService } from "./quest-template-service";
jest.mock("./supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
import {
  mockTemplate,
  mockTemplateId,
  setupQuestTemplateService,
} from "./quest-template-service.fixtures";

describe("QuestTemplateService - pause/resume", () => {
  let service: QuestTemplateService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = setupQuestTemplateService());
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
});
