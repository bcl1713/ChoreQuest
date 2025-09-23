/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/quest-instances/[id]/approve/route';
import { GET as getStats } from '../../app/api/characters/[id]/stats/route';
import { GET as getTransactions } from '../../app/api/characters/[id]/transactions/route';
import { PrismaClient } from '@/lib/generated/prisma';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    questInstance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Quest Rewards API', () => {
  let testCharacterId: string;
  let testQuestId: string;
  let testGuildMasterId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    testCharacterId = 'test-character-123';
    testQuestId = 'test-quest-456';
    testGuildMasterId = 'test-guild-master-789';
  });

  describe('POST /api/quest-instances/{id}/approve', () => {
    it('should successfully approve quest and award rewards', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'Test Quest',
        status: 'COMPLETED',
        familyId: 'family1',
        xpReward: 100,
        goldReward: 50,
        gemsReward: 0, // Not yet in schema
        honorPointsReward: 0, // Not yet in schema
        difficulty: 'MEDIUM',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
            name: 'Test Hero',
            class: 'KNIGHT',
            level: 1,
            xp: 0,
            gold: 0,
            gems: 0,
            honorPoints: 0,
          }
        },
        template: {}
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          questInstance: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance, status: 'APPROVED' }) },
          character: { update: jest.fn().mockResolvedValue(mockQuestInstance.assignedTo.character) },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction1',
              description: 'Reward for quest completion: Test Quest',
              createdAt: new Date()
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Quest approved successfully');
      expect(data.rewards).toBeDefined();
      expect(data.rewards.gold).toBe(78.75); // 50 * 1.5 (MEDIUM) * 1.05 (KNIGHT bonus)
      expect(data.rewards.xp).toBe(157.5); // 100 * 1.5 * 1.05 (KNIGHT bonus)
      expect(data.rewards.gems).toBe(0); // Not yet implemented in QuestInstance schema
      expect(data.rewards.honorPoints).toBe(0); // Not yet implemented in QuestInstance schema
    });

    it('should handle character leveling up from quest rewards', async () => {
      // Setup mocks for level up scenario
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'Big Quest',
        status: 'COMPLETED',
        familyId: 'family1',
        xpReward: 500,
        goldReward: 0,
        gemsReward: 0,
        honorPointsReward: 0,
        difficulty: 'HARD',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
            name: 'Test Hero',
            class: 'MAGE',
            level: 1,
            xp: 0, // Start at 0, will get 1200 XP (500*2*1.2)
            gold: 0,
            gems: 0,
            honorPoints: 0,
          }
        },
        template: {}
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      // Mock successful transaction with level up
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          questInstance: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance, status: 'APPROVED' }) },
          character: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance.assignedTo.character, level: 5 }) },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction1',
              description: 'Reward for quest completion: Big Quest (Level up: 1 → 5)',
              createdAt: new Date()
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.characterUpdates).toBeDefined();
      expect(data.characterUpdates.leveledUp).toBe(true);
      expect(data.characterUpdates.newLevel).toBe(5);
    });

    it('should create transaction record for quest rewards', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'Test Quest',
        status: 'COMPLETED',
        familyId: 'family1',
        xpReward: 100,
        goldReward: 50,
        gemsReward: 0, // Not yet in schema
        honorPointsReward: 0, // Not yet in schema
        difficulty: 'EASY',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
            name: 'Test Hero',
            class: 'KNIGHT',
            level: 1,
            xp: 0,
            gold: 0,
            gems: 0,
            honorPoints: 0,
          }
        },
        template: {}
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          questInstance: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance, status: 'APPROVED' }) },
          character: { update: jest.fn().mockResolvedValue(mockQuestInstance.assignedTo.character) },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction1',
              description: 'Reward for quest completion: Test Quest',
              createdAt: new Date()
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transaction).toBeDefined();
      expect(data.transaction.type).toBe('QUEST_REWARD');
      expect(data.transaction.description).toContain('quest completion');
      expect(data.transaction.id).toBeTruthy();
      expect(data.transaction.createdAt).toBeTruthy();
    });

    it('should reject approval of non-completed quests', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'Test Quest',
        status: 'IN_PROGRESS', // Not completed
        familyId: 'family1',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
          }
        }
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Quest must be completed');
    });

    it('should reject approval by non-guild-master users', async () => {
      // Setup mocks with regular user
      mockGetTokenData.mockResolvedValue({
        userId: 'regular-user-123',
        familyId: 'family1',
        role: 'HERO' // Not guild master
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: 'regular-user-123' })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Only Guild Masters can approve quests');
    });
  });

  describe('Character Stats Updates', () => {
    it('should correctly update character stats after quest approval', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        name: 'Test Hero',
        class: 'KNIGHT',
        level: 1,
        xp: 100,
        gold: 50,
        gems: 10,
        honorPoints: 25,
        user: {
          familyId: 'family1'
        }
      };

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);

      const request = new NextRequest(`http://localhost:3000/api/characters/${testCharacterId}/stats`);
      const response = await getStats(request, { params: Promise.resolve({ id: testCharacterId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.character).toBeDefined();
      expect(data.character.gold).toBeGreaterThan(0);
      expect(data.character.xp).toBeGreaterThan(0);
      expect(data.character.gems).toBeGreaterThan(0);
      expect(data.character.honorPoints).toBeGreaterThan(0);
    });
  });

  describe('Transaction History', () => {
    it('should record quest reward transactions in character history', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: 'user1',
        user: {
          familyId: 'family1'
        }
      };

      const mockTransactions = [
        {
          id: 'transaction1',
          type: 'QUEST_REWARD',
          description: 'Reward for quest completion: Test Quest',
          goldChange: 75,
          xpChange: 150,
          gemsChange: 0,
          honorChange: 0,
          relatedId: testQuestId,
          createdAt: new Date()
        }
      ];

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const request = new NextRequest(`http://localhost:3000/api/characters/${testCharacterId}/transactions`);
      const response = await getTransactions(request, { params: Promise.resolve({ id: testCharacterId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      const questTransaction = data.find(t => t.type === 'QUEST_REWARD');
      expect(questTransaction).toBeDefined();
      expect(questTransaction.questId).toBe(testQuestId);
      expect(questTransaction.goldChange).toBeDefined();
      expect(questTransaction.xpChange).toBeDefined();
    });

    it('should include level up information in transaction history', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: 'user1',
        familyId: 'family1',
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: 'user1',
        user: {
          familyId: 'family1'
        }
      };

      const mockTransactions = [
        {
          id: 'transaction1',
          type: 'QUEST_REWARD',
          description: 'Reward for quest completion: Test Quest (Level up: 1 → 5)',
          goldChange: 75,
          xpChange: 1000,
          gemsChange: 0,
          honorChange: 0,
          relatedId: testQuestId,
          createdAt: new Date()
        }
      ];

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const request = new NextRequest(`http://localhost:3000/api/characters/${testCharacterId}/transactions`);
      const response = await getTransactions(request, { params: Promise.resolve({ id: testCharacterId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      const levelUpTransaction = data.find(t =>
        t.type === 'QUEST_REWARD' && t.metadata?.levelUp
      );
      expect(levelUpTransaction).toBeDefined();
      expect(levelUpTransaction.metadata.levelUp.previousLevel).toBe(1);
      expect(levelUpTransaction.metadata.levelUp.newLevel).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero rewards gracefully', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'No Reward Quest',
        status: 'COMPLETED',
        familyId: 'family1',
        xpReward: 0,
        goldReward: 0,
        gemsReward: 0,
        honorPointsReward: 0,
        difficulty: 'EASY',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
            name: 'Test Hero',
            class: 'KNIGHT',
            level: 1,
            xp: 0,
            gold: 0,
            gems: 0,
            honorPoints: 0,
          }
        },
        template: {}
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          questInstance: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance, status: 'APPROVED' }) },
          character: { update: jest.fn().mockResolvedValue(mockQuestInstance.assignedTo.character) },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction1',
              description: 'Reward for quest completion: No Reward Quest',
              createdAt: new Date()
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewards.gold).toBe(0);
      expect(data.rewards.xp).toBe(0);
      expect(data.rewards.gems).toBe(0);
      expect(data.rewards.honorPoints).toBe(0);
    });

    it('should handle very large reward values without overflow', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: 'family1',
        role: 'GUILD_MASTER'
      });

      const mockQuestInstance = {
        id: testQuestId,
        title: 'Massive Quest',
        status: 'COMPLETED',
        familyId: 'family1',
        xpReward: 999999,
        goldReward: 999999,
        gemsReward: 0,
        honorPointsReward: 0,
        difficulty: 'HARD',
        assignedTo: {
          character: {
            id: testCharacterId,
            userId: 'user1',
            name: 'Test Hero',
            class: 'KNIGHT',
            level: 1,
            xp: 0,
            gold: 0,
            gems: 0,
            honorPoints: 0,
          }
        },
        template: {}
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestInstance);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          questInstance: { update: jest.fn().mockResolvedValue({ ...mockQuestInstance, status: 'APPROVED' }) },
          character: { update: jest.fn().mockResolvedValue(mockQuestInstance.assignedTo.character) },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction1',
              description: 'Reward for quest completion: Massive Quest',
              createdAt: new Date()
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/quest-instances/${testQuestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approverId: testGuildMasterId })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testQuestId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rewards.xp).toBe(2099997.9); // 999999 * 2.0 * 1.05 (KNIGHT bonus)
      expect(data.rewards.gold).toBe(2099997.9); // 999999 * 2.0 * 1.05 (KNIGHT bonus)
    });
  });
});