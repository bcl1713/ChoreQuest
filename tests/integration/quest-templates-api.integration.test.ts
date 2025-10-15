import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/quest-templates/route';
import { GET as GET_BY_ID, PATCH, DELETE } from '@/app/api/quest-templates/[id]/route';
import { PATCH as PAUSE_RESUME } from '@/app/api/quest-templates/[id]/pause/route';
import { questTemplateService } from '@/lib/quest-template-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
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

// Mock the service layer
jest.mock('@/lib/quest-template-service', () => ({
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

let mockSupabase: MockSupabaseClient;

describe('Quest Templates API', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockClear();
    (questTemplateService.createTemplate as jest.Mock).mockClear();
    (questTemplateService.getTemplatesForFamily as jest.Mock).mockClear();
    (questTemplateService.getTemplatesByType as jest.Mock).mockClear();
    (questTemplateService.updateTemplate as jest.Mock).mockClear();
    (questTemplateService.deleteTemplate as jest.Mock).mockClear();
    (questTemplateService.pauseTemplate as jest.Mock).mockClear();
    (questTemplateService.resumeTemplate as jest.Mock).mockClear();

    // Re-initialize mockSupabase with fresh mocks
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
    mockSupabase = createClient('', '') as MockSupabaseClient;
  });

  afterEach(() => {
    (mockSupabase.auth.getUser as jest.Mock).mockReset();
  });

  // Mock user data
  const guildMasterUser = { id: '00000000-0000-4000-8000-000000000003', role: 'GUILD_MASTER', family_id: '00000000-0000-4000-8000-000000000001' };
  const heroUser = { id: '00000000-0000-4000-8000-000000000004', role: 'HERO', family_id: '00000000-0000-4000-8000-000000000001' };
  const otherFamilyUser = { id: '00000000-0000-4000-8000-000000000005', role: 'GUILD_MASTER', family_id: '00000000-0000-4000-8000-000000000002' };

  const mockTemplate = {
    family_id: '00000000-0000-4000-8000-000000000001',
    title: 'Test Template',
    description: 'A test quest template',
    difficulty: 'MEDIUM',
    category: 'DAILY',
    xp_reward: 100,
    gold_reward: 50,
  };

  // Helper to create a mock NextRequest
  const createMockRequest = (
    method: string,
    body: Record<string, unknown> | null,
    headers: Record<string, string> = {},
    url: string = 'http://localhost/api/quest-templates'
  ) => {
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer fake-token',
        ...headers,
      },
    };

    if (body) {
      requestInit.body = JSON.stringify(body);
    }

    return new NextRequest(url, requestInit);
  };

  describe('POST /api/quest-templates', () => {
    it('should create a template for a Guild Master', async () => {
      const { id: _unusedTemplateId, ...templateBody } = mockTemplate;
      void _unusedTemplateId;
      const body = { ...templateBody, family_id: guildMasterUser.family_id };
      const req = createMockRequest('POST', body);

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
      (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
          delete: jest.fn().mockReturnThis(),
        };
        if (tableName === 'user_profiles') {
          mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
        } else if (tableName === 'quest_templates') {
          mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
        }
        return mockQuery;
      });
      (questTemplateService.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.template).toEqual(mockTemplate);
      expect(questTemplateService.createTemplate).toHaveBeenCalledWith({
        ...body,
        quest_type: null,
        recurrence_pattern: null,
        assigned_character_ids: null,
        class_bonuses: undefined,
        is_active: true,
        is_paused: false,
      });
    });

    it('should return 403 if user is not a Guild Master', async () => {
        const body = { ...mockTemplate, family_id: heroUser.family_id };
        const req = createMockRequest('POST', body);

        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: heroUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: heroUser, error: null });
          }
          return mockQuery;
        });
  
        const response = await POST(req);
        const json = await response.json();
  
        expect(response.status).toBe(403);
        expect(json.error).toBe('Only Guild Masters can create quest templates');
      });
  });

  describe('GET /api/quest-templates', () => {
    it('should return templates for a family', async () => {
        const req = createMockRequest('GET', null);
        req.nextUrl.searchParams.set('familyId', guildMasterUser.family_id);

        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
          } else if (tableName === 'quest_templates') {
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

    it('should return 403 when accessing another family\'s templates', async () => {
        const req = createMockRequest('GET', null);
        req.nextUrl.searchParams.set('familyId', guildMasterUser.family_id); // Trying to access other family

        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: otherFamilyUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: otherFamilyUser, error: null });
          } else if (tableName === 'quest_templates') {
            mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
          }
          return mockQuery;
        });
  
        const response = await GET(req);
        const json = await response.json();
  
        expect(response.status).toBe(403);
        expect(json.error).toBe('Cannot access templates for other families');
      });
  });

  describe('GET /api/quest-templates/[id]', () => {
    it('should return a single template', async () => {
        const req = createMockRequest('GET', null);
        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          if (tableName === 'user_profiles') {
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

  describe('PATCH /api/quest-templates/[id]', () => {
    it('should update a template for a Guild Master', async () => {
        const updateData = { title: 'Updated Title' };
        const req = createMockRequest('PATCH', updateData);
        
        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
          } else if (tableName === 'quest_templates') {
            mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
          }
          return mockQuery;
        });
        (questTemplateService.updateTemplate as jest.Mock).mockResolvedValue({ ...mockTemplate, ...updateData });

        const response = await PATCH(req, { params: Promise.resolve({ id: mockTemplate.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.template.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/quest-templates/[id]', () => {
    it('should soft delete a template', async () => {
        const req = createMockRequest('DELETE', {});
        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            delete: jest.fn().mockReturnThis(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
          } else if (tableName === 'quest_templates') {
            mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
          }
          return mockQuery;
        });
        (questTemplateService.deleteTemplate as jest.Mock).mockResolvedValue({ ...mockTemplate, is_active: false });

        const response = await DELETE(req, { params: Promise.resolve({ id: mockTemplate.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.message).toBe('Quest template deleted successfully');
    });
  });

  describe('PATCH /api/quest-templates/[id]/pause', () => {
    it('should pause a template', async () => {
        const req = createMockRequest('PATCH', { paused: true });
        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
          } else if (tableName === 'quest_templates') {
            mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
          }
          return mockQuery;
        });
        (questTemplateService.pauseTemplate as jest.Mock).mockResolvedValue({ ...mockTemplate, is_paused: true });

        const response = await PAUSE_RESUME(req, { params: Promise.resolve({ id: mockTemplate.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.message).toBe('Quest template paused successfully (vacation mode)');
        expect(questTemplateService.pauseTemplate).toHaveBeenCalledWith(mockTemplate.id);
    });

    it('should resume a template', async () => {
        const req = createMockRequest('PATCH', { paused: false });
        (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: guildMasterUser }, error: null });
        (mockSupabase.from as jest.Mock).mockImplementation((tableName) => {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
          if (tableName === 'user_profiles') {
            mockQuery.single.mockResolvedValue({ data: guildMasterUser, error: null });
          } else if (tableName === 'quest_templates') {
            mockQuery.single.mockResolvedValue({ data: mockTemplate, error: null });
          }
          return mockQuery;
        });
        (questTemplateService.resumeTemplate as jest.Mock).mockResolvedValue({ ...mockTemplate, is_paused: false });

        const response = await PAUSE_RESUME(req, { params: Promise.resolve({ id: mockTemplate.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.message).toBe('Quest template resumed successfully');
        expect(questTemplateService.resumeTemplate).toHaveBeenCalledWith(mockTemplate.id);
    });
  });
});
