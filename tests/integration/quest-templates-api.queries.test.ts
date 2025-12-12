import { GET } from "@/app/api/quest-templates/route";
import { GET as GET_BY_ID } from "@/app/api/quest-templates/[id]/route";
import {
  createMockRequest,
  guildMasterUser,
  mockSupabase,
  mockTemplate,
  otherFamilyUser,
  resetQuestTemplateServiceMocks,
  questTemplateService,
} from "./quest-templates-api.fixtures";

describe("Quest Templates API - queries", () => {
  beforeEach(() => {
    resetQuestTemplateServiceMocks();
  });

  describe("GET /api/quest-templates", () => {
    it("returns templates for a family", async () => {
      const req = createMockRequest("GET", null);
      req.nextUrl.searchParams.set("familyId", guildMasterUser.family_id);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
      (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };
        if (tableName === "user_profiles") {
          mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
        } else if (tableName === "quest_templates") {
          mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
        }
        return mockQuery;
      });
      (questTemplateService.getTemplatesForFamily as jest.Mock).mockResolvedValue([mockTemplate]);

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.templates).toEqual([mockTemplate]);
    });

    it("returns 403 when accessing another family's templates", async () => {
      const req = createMockRequest("GET", null);
      req.nextUrl.searchParams.set("familyId", guildMasterUser.family_id);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: otherFamilyUser }, error: null });
      (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };
        if (tableName === "user_profiles") {
          mockQuery.single.mockResolvedValue({ data: otherFamilyUser, error: null });
        } else if (tableName === "quest_templates") {
          mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
        }
        return mockQuery;
      });

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe("Cannot access templates for other families");
    });
  });

  describe("GET /api/quest-templates/[id]", () => {
    it("returns a single template", async () => {
      const req = createMockRequest("GET", null);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
      (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
        if (tableName === "user_profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: guildMasterUser, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockTemplate, error: null }),
          delete: jest.fn().mockReturnThis(),
        };
      });

      const response = await GET_BY_ID(req, { params: Promise.resolve({ id: mockTemplate.id }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.template.id).toBe(mockTemplate.id);
    });
  });

  afterEach(() => {
    (mockSupabase.auth.getUser as jest.Mock).mockReset();
  });
});
