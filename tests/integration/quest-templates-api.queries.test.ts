import {
  createMockRequest,
  guildMasterUser,
  mockSupabase,
  mockTemplate,
  otherFamilyUser,
  resetMocks,
  mockQuestTemplateService,
} from "./quest-templates-api.fixtures";

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/lib/quest-template-service", () => ({
  questTemplateService: mockQuestTemplateService,
}));

import { GET } from "@/app/api/quest-templates/route";
import { GET as GET_BY_ID } from "@/app/api/quest-templates/[id]/route";

describe("Quest Templates API - queries", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("GET /api/quest-templates", () => {
    it("returns templates for a family", async () => {
      const req = createMockRequest("GET", null);
      req.nextUrl.searchParams.set("familyId", guildMasterUser.family_id);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: guildMasterUser },
        error: null,
      });
      (mockSupabase.from as jest.Mock).mockImplementation(
        (tableName: string) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === "user_profiles") {
            mockQuery.single.mockResolvedValue({
              data: guildMasterUser,
              error: null,
            });
          } else if (tableName === "quest_templates") {
            mockQuery.single.mockResolvedValue({
              data: mockTemplate,
              error: null,
            });
          }
          return mockQuery;
        },
      );
      (
        mockQuestTemplateService.getTemplatesForFamily as jest.Mock
      ).mockResolvedValue([mockTemplate]);

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.templates).toEqual([mockTemplate]);
    });

    it("returns 403 when accessing another family's templates", async () => {
      const req = createMockRequest("GET", null);
      req.nextUrl.searchParams.set("familyId", guildMasterUser.family_id);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: otherFamilyUser },
        error: null,
      });
      (mockSupabase.from as jest.Mock).mockImplementation(
        (tableName: string) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === "user_profiles") {
            mockQuery.single.mockResolvedValue({
              data: otherFamilyUser,
              error: null,
            });
          } else if (tableName === "quest_templates") {
            mockQuery.single.mockResolvedValue({
              data: mockTemplate,
              error: null,
            });
          }
          return mockQuery;
        },
      );

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe("Cannot access templates for other families");
      expect(json.code).toBe("QUEST_TEMPLATE_ACCESS_FORBIDDEN");
    });
  });

  describe("GET /api/quest-templates/[id]", () => {
    it("returns a single template", async () => {
      const req = createMockRequest("GET", null);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: guildMasterUser },
        error: null,
      });
      (mockSupabase.from as jest.Mock).mockImplementation(
        (tableName: string) => {
          if (tableName === "user_profiles") {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({ data: guildMasterUser, error: null }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: mockTemplate, error: null }),
            delete: jest.fn().mockReturnThis(),
          };
        },
      );

      const response = await GET_BY_ID(req, {
        params: Promise.resolve({ id: mockTemplate.id }),
      });
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
