import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { questTemplateService } from "@/lib/quest-template-service";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: jest.fn().mockReturnThis(),
      };
      return mockQuery;
    }),
  }),
}));

jest.mock("@/lib/quest-template-service", () => ({
  questTemplateService: {
    createTemplate: jest.fn(),
    getTemplatesForFamily: jest.fn(),
    getTemplatesByType: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    pauseTemplate: jest.fn(),
    resumeTemplate: jest.fn(),
  },
}));

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
};

export const mockSupabase = createClient("", "") as unknown as MockSupabaseClient;

export const guildMasterUser = {
  id: "00000000-0000-4000-8000-000000000003",
  role: "GUILD_MASTER",
  family_id: "00000000-0000-4000-8000-000000000001",
};
export const heroUser = {
  id: "00000000-0000-4000-8000-000000000004",
  role: "HERO",
  family_id: "00000000-0000-4000-8000-000000000001",
};
export const otherFamilyUser = {
  id: "00000000-0000-4000-8000-000000000005",
  role: "GUILD_MASTER",
  family_id: "00000000-0000-4000-8000-000000000002",
};

export const mockTemplate = {
  family_id: "00000000-0000-4000-8000-000000000001",
  title: "Test Template",
  description: "A test quest template",
  difficulty: "MEDIUM",
  category: "DAILY",
  xp_reward: 100,
  gold_reward: 50,
};

export const createMockRequest = (
  method: string,
  body: Record<string, unknown> | null,
  headers: Record<string, string> = {},
  url = "http://localhost/api/quest-templates",
) => {
  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer fake-token",
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(url, requestInit);
};

export const resetQuestTemplateServiceMocks = () => {
  (createClient as jest.Mock).mockClear();
  (questTemplateService.createTemplate as jest.Mock).mockClear();
  (questTemplateService.getTemplatesForFamily as jest.Mock).mockClear();
  (questTemplateService.getTemplatesByType as jest.Mock).mockClear();
  (questTemplateService.updateTemplate as jest.Mock).mockClear();
  (questTemplateService.deleteTemplate as jest.Mock).mockClear();
  (questTemplateService.pauseTemplate as jest.Mock).mockClear();
  (questTemplateService.resumeTemplate as jest.Mock).mockClear();
  (createClient as jest.Mock).mockReturnValue({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        delete: jest.fn().mockReturnThis(),
      };
      return mockQuery;
    }),
  });
  (mockSupabase.auth.getUser as jest.Mock).mockReset();
};

export { questTemplateService };
