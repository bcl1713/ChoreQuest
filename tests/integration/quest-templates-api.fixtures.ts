import { NextRequest } from "next/server";

export const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    delete: jest.fn().mockReturnThis(),
  })),
};

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

export const mockQuestTemplateService = {
  createTemplate: jest.fn(),
  getTemplatesForFamily: jest.fn(),
  getTemplatesByType: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  pauseTemplate: jest.fn(),
  resumeTemplate: jest.fn(),
};

export const resetMocks = () => {
  Object.values(mockQuestTemplateService).forEach((fn) => fn.mockClear());
  (mockSupabase.auth.getUser as jest.Mock).mockReset();
  (mockSupabase.from as jest.Mock).mockReset();
  (mockSupabase.from as jest.Mock).mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    delete: jest.fn().mockReturnThis(),
  }));
};
