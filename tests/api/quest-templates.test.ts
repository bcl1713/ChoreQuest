/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/quest-templates/route';
import { PrismaClient } from '@/lib/generated/prisma';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    questTemplate: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    family: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('/api/quest-templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/quest-templates', () => {
    it('should return quest templates for authenticated user family', async () => {
      // Mock auth
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      // Mock database response
      const mockTemplates = [
        {
          id: 'template1',
          title: 'Take Out Trash',
          description: 'Empty all trash bins and take to curb',
          xpReward: 50,
          goldReward: 10,
          difficulty: 'EASY',
          category: 'DAILY',
          familyId: 'family1',
          isActive: true,
          classBonuses: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      (mockPrisma.questTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);

      const request = new NextRequest('http://localhost:3000/api/quest-templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(1);
      expect(data.templates[0]).toMatchObject({
        id: 'template1',
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: 'family1',
        isActive: true
      });
      expect(mockPrisma.questTemplate.findMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family1',
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetTokenData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/quest-templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/quest-templates', () => {
    it('should create quest template for guild master', async () => {
      // Mock auth
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      // Mock family verification
      (mockPrisma.family.findUnique as jest.Mock).mockResolvedValue({
        id: 'family1',
        guildMasterId: 'user1'
      });

      // Mock database response
      const mockTemplate = {
        id: 'template1',
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: 'family1',
        isActive: true,
        classBonuses: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.questTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

      const requestBody = {
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY'
      };

      const request = new NextRequest('http://localhost:3000/api/quest-templates', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.template).toMatchObject({
        id: 'template1',
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: 'family1',
        isActive: true
      });
      expect(mockPrisma.questTemplate.create).toHaveBeenCalledWith({
        data: {
          ...requestBody,
          familyId: 'family1'
        }
      });
    });

    it('should return 403 for non-guild master users', async () => {
      mockGetTokenData.mockResolvedValue({
        userId: 'user2',
        familyId: 'family1',
        role: 'HERO'
      });

      const requestBody = {
        title: 'Take Out Trash',
        description: 'Empty all trash bins and take to curb',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY'
      };

      const request = new NextRequest('http://localhost:3000/api/quest-templates', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only the Guild Master can create quest templates');
    });

    it('should return 400 for invalid input data', async () => {
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const invalidRequestBody = {
        title: '', // Invalid: empty title
        description: 'Some description',
        xpReward: -10, // Invalid: negative reward
        goldReward: 10,
        difficulty: 'INVALID_DIFFICULTY',
        category: 'DAILY'
      };

      const request = new NextRequest('http://localhost:3000/api/quest-templates', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quest template data');
    });
  });
});