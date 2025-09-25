/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getRewards } from '../../app/api/rewards/route';
import { POST as redeemReward } from '../../app/api/rewards/redeem/route';
import { GET as getRedemptions } from '../../app/api/rewards/redemptions/route';
import { PATCH as updateRedemption } from '../../app/api/rewards/redemptions/[id]/route';
import { PrismaClient } from '@/lib/generated/prisma';
import * as auth from '@/lib/auth';

// Mock the auth module
jest.mock('@/lib/auth');
const mockGetTokenData = auth.getTokenData as jest.MockedFunction<typeof auth.getTokenData>;

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    reward: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rewardRedemption: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Reward Redemption API', () => {
  let testUserId: string;
  let testCharacterId: string;
  let testGuildMasterId: string;
  let testFamilyId: string;
  let testRewardId: string;
  let testRedemptionId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error output during tests
    jest.spyOn(console, 'error').mockImplementation();
    testUserId = 'test-user-123';
    testCharacterId = 'test-character-456';
    testGuildMasterId = 'test-guild-master-789';
    testFamilyId = 'family-abc';
    testRewardId = 'reward-xyz';
    testRedemptionId = 'redemption-def';
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('GET /api/rewards', () => {
    it('should return family rewards for authenticated user', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockRewards = [
        {
          id: testRewardId,
          name: 'Extra Screen Time',
          description: '30 minutes extra screen time',
          type: 'SCREEN_TIME',
          cost: 50,
          familyId: testFamilyId,
        },
        {
          id: 'reward-2',
          name: 'Stay Up Late',
          description: 'Stay up 1 hour past bedtime',
          type: 'PRIVILEGE',
          cost: 100,
          familyId: testFamilyId,
        }
      ];

      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue(mockRewards);

      const request = new NextRequest('http://localhost:3000/api/rewards');
      const response = await getRewards(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rewards).toHaveLength(2);
      expect(data.rewards[0].name).toBe('Extra Screen Time');
      expect(data.rewards[0].type).toBe('SCREEN_TIME');
      expect(data.rewards[0].cost).toBe(50);
      expect(mockPrisma.reward.findMany).toHaveBeenCalledWith({
        where: { familyId: testFamilyId, isActive: true },
        orderBy: [
          { cost: 'asc' },
          { name: 'asc' }
        ],
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetTokenData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/rewards');
      const response = await getRewards(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/rewards/redeem', () => {
    it('should successfully redeem reward with sufficient gold', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: testUserId,
        gold: 100,
        user: {
          familyId: testFamilyId
        }
      };

      const mockReward = {
        id: testRewardId,
        name: 'Extra Screen Time',
        cost: 50,
        familyId: testFamilyId,
      };

      const mockRedemption = {
        id: testRedemptionId,
        userId: testUserId,
        rewardId: testRewardId,
        status: 'PENDING',
        cost: 50,
        requestedAt: new Date(),
      };

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(mockReward);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          character: {
            update: jest.fn().mockResolvedValue({ ...mockCharacter, gold: 50 })
          },
          rewardRedemption: {
            create: jest.fn().mockResolvedValue(mockRedemption)
          },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'transaction-123',
              type: 'STORE_PURCHASE',
              description: 'Redeemed reward: Extra Screen Time',
            })
          }
        };
        return callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: testRewardId,
          notes: 'Please approve!'
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redemption.status).toBe('PENDING');
      expect(data.message).toContain('requested successfully');
    });

    it('should reject redemption with insufficient gold', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: testUserId,
        gold: 25, // Not enough for 50 cost reward
        user: {
          familyId: testFamilyId
        }
      };

      const mockReward = {
        id: testRewardId,
        name: 'Extra Screen Time',
        cost: 50,
        familyId: testFamilyId,
      };

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(mockReward);

      // Mock transaction (won't be called due to insufficient gold check)
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          character: { update: jest.fn() },
          rewardRedemption: { create: jest.fn() },
          transaction: { create: jest.fn() }
        };
        return callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: testRewardId,
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Insufficient gold');
    });

    it('should reject redemption of non-existent reward', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: testUserId,
        gold: 100,
        user: {
          familyId: testFamilyId
        }
      };

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(null); // No rewards found

      // Mock transaction (shouldn't be called but needed for error handling)
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          character: { update: jest.fn() },
          rewardRedemption: { create: jest.fn() },
          transaction: { create: jest.fn() }
        };
        return callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: 'non-existent-reward',
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Reward not found');
    });

    it('should reject redemption from different family', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: testUserId,
        gold: 100,
        user: {
          familyId: testFamilyId
        }
      };

      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(null); // Different family = not found

      // Mock transaction (shouldn't be called due to family mismatch)
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          character: { update: jest.fn() },
          rewardRedemption: { create: jest.fn() },
          transaction: { create: jest.fn() }
        };
        return callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: testRewardId,
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Reward not found');
    });
  });

  describe('GET /api/rewards/redemptions', () => {
    it('should return family redemptions for authenticated user', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockRedemptions = [
        {
          id: testRedemptionId,
          status: 'PENDING',
          requestedAt: new Date(),
          cost: 50,
          notes: 'Please approve!',
          reward: {
            id: testRewardId,
            name: 'Extra Screen Time',
            type: 'SCREEN_TIME',
            cost: 50,
          },
          user: {
            id: testUserId,
            name: 'Test Hero',
          },
        }
      ];

      (mockPrisma.rewardRedemption.findMany as jest.Mock).mockResolvedValue(mockRedemptions);

      const request = new NextRequest('http://localhost:3000/api/rewards/redemptions');
      const response = await getRedemptions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.redemptions).toHaveLength(1);
      expect(data.redemptions[0].status).toBe('PENDING');
      expect(data.redemptions[0].reward.name).toBe('Extra Screen Time');
      expect(data.redemptions[0].user.name).toBe('Test Hero');
    });
  });

  describe('PATCH /api/rewards/redemptions/[id]', () => {
    it('should allow Guild Master to approve redemption', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: testFamilyId,
        role: 'GUILD_MASTER'
      });

      const mockRedemption = {
        id: testRedemptionId,
        userId: testUserId,
        status: 'PENDING',
        cost: 50,
        user: {
          character: {
            gold: 50,
          },
          familyId: testFamilyId,
        },
        reward: {
          name: 'Extra Screen Time',
        }
      };

      const mockUpdatedRedemption = {
        ...mockRedemption,
        status: 'APPROVED',
        approvedBy: testGuildMasterId,
        approvedAt: new Date(),
      };

      (mockPrisma.rewardRedemption.findFirst as jest.Mock).mockResolvedValue(mockRedemption);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          rewardRedemption: {
            update: jest.fn().mockResolvedValue(mockUpdatedRedemption)
          },
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/${testRedemptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'APPROVED',
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: testRedemptionId })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redemption.status).toBe('APPROVED');
    });

    it('should allow Guild Master to deny redemption and issue refund', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: testFamilyId,
        role: 'GUILD_MASTER'
      });

      const mockRedemption = {
        id: testRedemptionId,
        userId: testUserId,
        status: 'PENDING',
        cost: 50,
        user: {
          character: {
            gold: 50,
          },
          familyId: testFamilyId,
        },
        reward: {
          name: 'Extra Screen Time',
        }
      };

      const mockUpdatedRedemption = {
        ...mockRedemption,
        status: 'DENIED',
        approvedBy: testGuildMasterId,
        approvedAt: new Date(),
      };

      (mockPrisma.rewardRedemption.findFirst as jest.Mock).mockResolvedValue(mockRedemption);

      // Mock successful transaction with refund
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          character: {
            update: jest.fn().mockResolvedValue({ gold: 100 }) // Refunded 50 gold
          },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'refund-transaction',
              type: 'REWARD_REFUND',
              goldChange: 50,
              description: 'Refund for denied reward: Extra Screen Time',
            })
          },
          rewardRedemption: {
            update: jest.fn().mockResolvedValue(mockUpdatedRedemption)
          },
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/${testRedemptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'DENIED',
          notes: 'Maybe next time!'
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: testRedemptionId })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redemption.status).toBe('DENIED');
    });

    it('should allow Guild Master to mark approved redemption as fulfilled', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: testFamilyId,
        role: 'GUILD_MASTER'
      });

      const mockRedemption = {
        id: testRedemptionId,
        userId: testUserId,
        status: 'APPROVED',
        cost: 50,
        user: {
          character: {
            gold: 50,
          },
          familyId: testFamilyId,
        },
        reward: {
          name: 'Extra Screen Time',
        }
      };

      const mockUpdatedRedemption = {
        ...mockRedemption,
        status: 'FULFILLED',
        fulfilledAt: new Date(),
      };

      (mockPrisma.rewardRedemption.findFirst as jest.Mock).mockResolvedValue(mockRedemption);

      // Mock successful transaction
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          rewardRedemption: {
            update: jest.fn().mockResolvedValue(mockUpdatedRedemption)
          },
        };
        return callback(mockTx);
      });

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/${testRedemptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'FULFILLED',
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: testRedemptionId })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redemption.status).toBe('FULFILLED');
    });

    it('should reject approval by non-Guild Master', async () => {
      // Setup mocks with regular user
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO' // Not guild master
      });

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/${testRedemptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'APPROVED',
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: testRedemptionId })
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Only Guild Masters can manage reward redemptions');
    });

    it('should reject updating non-existent redemption', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: testFamilyId,
        role: 'GUILD_MASTER'
      });

      (mockPrisma.rewardRedemption.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/non-existent`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'APPROVED',
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: 'non-existent' })
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Redemption not found');
    });

    it('should reject updating redemption from different family', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testGuildMasterId,
        familyId: testFamilyId,
        role: 'GUILD_MASTER'
      });

      // Mock that redemption from different family is not found
      (mockPrisma.rewardRedemption.findFirst as jest.Mock).mockResolvedValue(null); // Different family = not found

      const request = new NextRequest(`http://localhost:3000/api/rewards/redemptions/${testRedemptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'APPROVED',
        })
      });

      const response = await updateRedemption(request, {
        params: Promise.resolve({ id: testRedemptionId })
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Redemption not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid request data gracefully', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          // Missing rewardId
          notes: 'Please approve!'
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request data');
    });

    it('should handle database errors gracefully', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      // Mock reward lookup first to pass initial validation
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue({
        id: testRewardId,
        name: 'Test Reward',
        cost: 50,
        familyId: testFamilyId,
      });

      // Mock database error on character lookup
      (mockPrisma.character.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: testRewardId,
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database connection error');
    });

    it('should handle transaction rollback on failure', async () => {
      // Setup mocks
      mockGetTokenData.mockResolvedValue({
        userId: testUserId,
        familyId: testFamilyId,
        role: 'HERO'
      });

      const mockCharacter = {
        id: testCharacterId,
        userId: testUserId,
        gold: 100,
        user: {
          familyId: testFamilyId
        }
      };

      const mockReward = {
        id: testRewardId,
        name: 'Extra Screen Time',
        cost: 50,
        familyId: testFamilyId,
      };

      // Mock successful pre-transaction checks
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacter);

      // Mock transaction failure
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      const request = new NextRequest('http://localhost:3000/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({
          rewardId: testRewardId,
        })
      });

      const response = await redeemReward(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Transaction failed');
    });
  });
});