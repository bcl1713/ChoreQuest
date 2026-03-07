import { QuestTemplateService } from "../quest-template-service";
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
import {
  mockFamilyId,
  mockFamilyTemplate,
  mockTemplate,
  setupQuestTemplateService,
} from "./quest-template-service.fixtures";

describe("QuestTemplateService - getTemplatesByType", () => {
  let service: QuestTemplateService;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    ({ service, mockFrom } = setupQuestTemplateService());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch INDIVIDUAL quest templates", async () => {
    const individualTemplates = [mockTemplate];
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest
          .fn()
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
        eq: jest
          .fn()
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
        eq: jest
          .fn()
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
        eq: jest
          .fn()
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
        eq: jest
          .fn()
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
        eq: jest
          .fn()
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
