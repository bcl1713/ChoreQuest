/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/quest-instances/route';
import { PrismaClient } from '@/lib/generated/prisma';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    questInstance: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    questTemplate: {
      findUnique: jest.fn(),
    },
    character: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    family: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('/api/quest-instances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/quest-instances', () => {
    it('should return quest instances for authenticated user', async () => {
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'HERO'
      });

      const mockInstances = [
        {
          id: 'instance1',
          title: 'Take Out Trash Today',
          description: 'Empty all trash bins',
          xpReward: 50,
          goldReward: 10,
          difficulty: 'EASY',
          category: 'DAILY',
          status: 'PENDING',
          assignedToId: 'user1',
          familyId: 'family1',
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      (mockPrisma.questInstance.findMany as jest.Mock).mockResolvedValue(mockInstances);

      const request = new NextRequest('http://localhost:3000/api/quest-instances');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.instances).toHaveLength(1);
      expect(data.instances[0]).toMatchObject({
        id: 'instance1',
        title: 'Take Out Trash Today',
        description: 'Empty all trash bins',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        status: 'PENDING',
        assignedToId: 'user1',
        familyId: 'family1'
      });
      expect(mockPrisma.questInstance.findMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family1'
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('POST /api/quest-instances', () => {
    it('should create quest instance from template', async () => {
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      // Mock template lookup
      (mockPrisma.questTemplate.findUnique as jest.Mock).mockResolvedValue({
        id: 'template1',
        title: 'Take Out Trash Today',
        description: 'Empty all trash bins',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: 'family1'
      });

      // Mock assigned user lookup
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user2',
        familyId: 'family1',
        role: 'HERO'
      });

      const mockInstance = {
        id: 'instance1',
        title: 'Take Out Trash Today',
        description: 'Empty all trash bins',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        status: 'PENDING',
        assignedToId: 'user2',
        createdById: 'user1',
        familyId: 'family1',
        templateId: 'template1',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.questInstance.create as jest.Mock).mockResolvedValue(mockInstance);

      const requestBody = {
        templateId: 'template1',
        assignedToId: 'user2',
        dueDate: '2024-01-15T10:00:00Z'
      };

      const request = new NextRequest('http://localhost:3000/api/quest-instances', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.instance).toMatchObject({
        id: 'instance1',
        title: 'Take Out Trash Today',
        description: 'Empty all trash bins',
        xpReward: 50,
        goldReward: 10,
        difficulty: 'EASY',
        category: 'DAILY',
        status: 'PENDING',
        assignedToId: 'user2',
        createdById: 'user1',
        familyId: 'family1',
        templateId: 'template1'
      });
    });

    it('should create ad-hoc quest instance', async () => {
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockInstance = {
        id: 'instance1',
        title: 'Custom Task',
        description: 'Custom task description',
        xpReward: 30,
        goldReward: 5,
        difficulty: 'MEDIUM',
        category: 'DAILY',
        status: 'PENDING',
        assignedToId: 'user2',
        createdById: 'user1',
        familyId: 'family1',
        templateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.questInstance.create as jest.Mock).mockResolvedValue(mockInstance);

      const requestBody = {
        title: 'Custom Task',
        description: 'Custom task description',
        xpReward: 30,
        goldReward: 5,
        difficulty: 'MEDIUM',
        category: 'DAILY',
        assignedToId: 'user2'
      };

      const request = new NextRequest('http://localhost:3000/api/quest-instances', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});