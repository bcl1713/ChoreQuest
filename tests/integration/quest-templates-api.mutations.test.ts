import {
  createMockRequest,
  guildMasterUser,
  heroUser,
  mockSupabase,
  mockTemplate,
  resetMocks,
  mockQuestTemplateService,
} from "./quest-templates-api.fixtures";

jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock("@/lib/quest-template-service", () => ({
  questTemplateService: mockQuestTemplateService,
}));

import { POST } from "@/app/api/quest-templates/route";
import {
  PATCH as PATCH_BY_ID,
  DELETE,
} from "@/app/api/quest-templates/[id]/route";
import { PATCH as PAUSE_RESUME } from "@/app/api/quest-templates/[id]/pause/route";

describe("Quest Templates API - mutations", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("POST /api/quest-templates", () => {
    it("creates a template for a Guild Master", async () => {
      const { id: _unusedTemplateId, ...templateBody } = mockTemplate;
      void _unusedTemplateId;
      const body = { ...templateBody, family_id: guildMasterUser.family_id };
      const req = createMockRequest("POST", body);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: guildMasterUser },
        error: null,
      });
      (mockSupabase.from as jest.Mock).mockImplementation(
        (tableName: string) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            delete: jest.fn().mockReturnThis(),
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
      (mockQuestTemplateService.createTemplate as jest.Mock).mockResolvedValue(
        mockTemplate,
      );

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.template).toEqual(mockTemplate);
      expect(mockQuestTemplateService.createTemplate).toHaveBeenCalledWith({
        ...body,
        quest_type: null,
        recurrence_pattern: null,
        assigned_character_ids: null,
        class_bonuses: undefined,
        is_active: true,
        is_paused: false,
      });
    });

    it("returns 403 if user is not a Guild Master", async () => {
      const body = { ...mockTemplate, family_id: heroUser.family_id };
      const req = createMockRequest("POST", body);
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: heroUser },
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
            mockQuery.single.mockResolvedValue({ data: heroUser, error: null });
          }
          return mockQuery;
        },
      );

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe("Only Guild Masters can create quest templates");
    });
  });

  describe("PATCH /api/quest-templates/[id]", () => {
    it("updates a template for a Guild Master", async () => {
      const updateData = { title: "Updated Title" };
      const req = createMockRequest("PATCH", updateData);
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
      (mockQuestTemplateService.updateTemplate as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        ...updateData,
      });

      const response = await PATCH_BY_ID(req, {
        params: Promise.resolve({ id: mockTemplate.id }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.template.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/quest-templates/[id]", () => {
    it("soft deletes a template", async () => {
      const req = createMockRequest("DELETE", {});
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
            delete: jest.fn().mockReturnThis(),
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
      (mockQuestTemplateService.deleteTemplate as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        is_active: false,
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ id: mockTemplate.id }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("Quest template deleted successfully");
    });
  });

  describe("PATCH /api/quest-templates/[id]/pause", () => {
    it("pauses a template", async () => {
      const req = createMockRequest("PATCH", { paused: true });
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
      (mockQuestTemplateService.pauseTemplate as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        is_paused: true,
      });

      const response = await PAUSE_RESUME(req, {
        params: Promise.resolve({ id: mockTemplate.id }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe(
        "Quest template paused successfully (vacation mode)",
      );
      expect(mockQuestTemplateService.pauseTemplate).toHaveBeenCalledWith(
        mockTemplate.id,
      );
    });

    it("resumes a template", async () => {
      const req = createMockRequest("PATCH", { paused: false });
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
      (mockQuestTemplateService.resumeTemplate as jest.Mock).mockResolvedValue({
        ...mockTemplate,
        is_paused: false,
      });

      const response = await PAUSE_RESUME(req, {
        params: Promise.resolve({ id: mockTemplate.id }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe("Quest template resumed successfully");
      expect(mockQuestTemplateService.resumeTemplate).toHaveBeenCalledWith(
        mockTemplate.id,
      );
    });
  });

  afterEach(() => {
    (mockSupabase.auth.getUser as jest.Mock).mockReset();
  });
});
