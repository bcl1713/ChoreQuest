/**
 * @jest-environment node
 */
import { PrismaClient } from '@/lib/generated/prisma';
import {
  DatabaseChangeEmitter,
  RealTimeEventType,
  QuestEventData,
  CharacterEventData,
  RewardRedemptionEventData,
  UserRoleEventData,
  RealTimeEvent
} from '../../lib/realtime-events';

// Mock PrismaClient
jest.mock('@/lib/generated/prisma', () => {
  const mockPrisma = {
    questInstance: {
      findUnique: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
    },
    rewardRedemption: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

// Mock console.error to keep test output clean
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Database Change Detection System', () => {
  let emitter: DatabaseChangeEmitter;
  let mockEventHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventHandler = jest.fn();
    emitter = new DatabaseChangeEmitter();
    emitter.on('event', mockEventHandler);
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe('Quest Status Change Detection', () => {
    const mockQuestData = {
      id: 'quest-123',
      status: 'COMPLETED',
      assignedToId: 'user-123',
      familyId: 'family-456',
      title: 'Clean Kitchen', // Direct title property
      xpReward: 100,
      goldReward: 50,
      assignedTo: {
        id: 'user-123',
        name: 'Test User',
        familyId: 'family-456'
      },
      template: {
        title: 'Clean Kitchen',
        baseXP: 100
      }
    };

    beforeEach(() => {
      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestData);
    });

    it('should detect quest status change from ASSIGNED to STARTED', async () => {
      const questId = 'quest-123';
      const oldStatus = 'ASSIGNED';
      const newStatus = 'STARTED';

      await emitter.handleQuestStatusChange(questId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'quest_updated',
        data: {
          questId,
          status: newStatus,
          userId: 'user-123',
          questName: 'Clean Kitchen',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect quest status change from STARTED to COMPLETED', async () => {
      const questId = 'quest-123';
      const oldStatus = 'STARTED';
      const newStatus = 'COMPLETED';

      await emitter.handleQuestStatusChange(questId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'quest_updated',
        data: {
          questId,
          status: newStatus,
          userId: 'user-123',
          questName: 'Clean Kitchen',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect quest status change from COMPLETED to APPROVED with rewards', async () => {
      const questId = 'quest-123';
      const oldStatus = 'COMPLETED';
      const newStatus = 'APPROVED';

      const approvedQuestData = {
        ...mockQuestData,
        status: 'APPROVED',
        xpAwarded: 100,
        goldAwarded: 50
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(approvedQuestData);

      await emitter.handleQuestStatusChange(questId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'quest_updated',
        data: {
          questId,
          status: newStatus,
          userId: 'user-123',
          questName: 'Clean Kitchen',
          xpAwarded: 100,
          goldAwarded: 50
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should handle quest not found gracefully', async () => {
      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(null);

      const questId = 'nonexistent-quest';
      const oldStatus = 'ASSIGNED';
      const newStatus = 'STARTED';

      await emitter.handleQuestStatusChange(questId, oldStatus, newStatus);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.questInstance.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const questId = 'quest-123';
      const oldStatus = 'ASSIGNED';
      const newStatus = 'STARTED';

      await emitter.handleQuestStatusChange(questId, oldStatus, newStatus);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Character Stats Change Detection', () => {
    const mockCharacterData = {
      id: 'char-123',
      userId: 'user-123',
      gold: 250,
      xp: 1200,
      level: 5,
      user: {
        familyId: 'family-456'
      }
    };

    beforeEach(() => {
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(mockCharacterData);
    });

    it('should detect character gold change', async () => {
      const characterId = 'char-123';
      const oldGold = 200;
      const newGold = 250;

      await emitter.handleCharacterStatsChange(characterId, { gold: { old: oldGold, new: newGold } });

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'character_updated',
        data: {
          userId: 'user-123',
          characterId,
          changes: {
            gold: newGold
          }
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect character XP and level change', async () => {
      const characterId = 'char-123';
      const changes = {
        xp: { old: 1000, new: 1200 },
        level: { old: 4, new: 5 }
      };

      await emitter.handleCharacterStatsChange(characterId, changes);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'character_updated',
        data: {
          userId: 'user-123',
          characterId,
          changes: {
            xp: 1200,
            level: 5
          }
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect multiple stat changes simultaneously', async () => {
      const characterId = 'char-123';
      const changes = {
        gold: { old: 200, new: 250 },
        xp: { old: 1000, new: 1200 },
        level: { old: 4, new: 5 }
      };

      await emitter.handleCharacterStatsChange(characterId, changes);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'character_updated',
        data: {
          userId: 'user-123',
          characterId,
          changes: {
            gold: 250,
            xp: 1200,
            level: 5
          }
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should handle character not found gracefully', async () => {
      (mockPrisma.character.findUnique as jest.Mock).mockResolvedValue(null);

      const characterId = 'nonexistent-char';
      const changes = { gold: { old: 100, new: 150 } };

      await emitter.handleCharacterStatsChange(characterId, changes);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Reward Redemption Change Detection', () => {
    const mockRedemptionData = {
      id: 'redemption-123',
      rewardId: 'reward-456',
      userId: 'user-123',
      status: 'APPROVED',
      cost: 100,
      user: {
        familyId: 'family-456'
      },
      reward: {
        name: 'Extra Screen Time',
        cost: 100
      }
    };

    beforeEach(() => {
      (mockPrisma.rewardRedemption.findUnique as jest.Mock).mockResolvedValue(mockRedemptionData);
    });

    it('should detect reward redemption status change from PENDING to APPROVED', async () => {
      const redemptionId = 'redemption-123';
      const oldStatus = 'PENDING';
      const newStatus = 'APPROVED';

      await emitter.handleRewardRedemptionChange(redemptionId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'reward_redemption_updated',
        data: {
          redemptionId,
          rewardId: 'reward-456',
          userId: 'user-123',
          status: newStatus,
          cost: 100,
          rewardName: 'Extra Screen Time'
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect reward redemption status change from APPROVED to FULFILLED', async () => {
      const redemptionId = 'redemption-123';
      const oldStatus = 'APPROVED';
      const newStatus = 'FULFILLED';

      const fulfilledRedemptionData = {
        ...mockRedemptionData,
        status: 'FULFILLED'
      };

      (mockPrisma.rewardRedemption.findUnique as jest.Mock).mockResolvedValue(fulfilledRedemptionData);

      await emitter.handleRewardRedemptionChange(redemptionId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'reward_redemption_updated',
        data: {
          redemptionId,
          rewardId: 'reward-456',
          userId: 'user-123',
          status: newStatus,
          cost: 100,
          rewardName: 'Extra Screen Time'
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect reward redemption status change from PENDING to DENIED', async () => {
      const redemptionId = 'redemption-123';
      const oldStatus = 'PENDING';
      const newStatus = 'DENIED';

      const deniedRedemptionData = {
        ...mockRedemptionData,
        status: 'DENIED'
      };

      (mockPrisma.rewardRedemption.findUnique as jest.Mock).mockResolvedValue(deniedRedemptionData);

      await emitter.handleRewardRedemptionChange(redemptionId, oldStatus, newStatus);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'reward_redemption_updated',
        data: {
          redemptionId,
          rewardId: 'reward-456',
          userId: 'user-123',
          status: newStatus,
          cost: 100,
          rewardName: 'Extra Screen Time'
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should handle redemption not found gracefully', async () => {
      (mockPrisma.rewardRedemption.findUnique as jest.Mock).mockResolvedValue(null);

      const redemptionId = 'nonexistent-redemption';
      const oldStatus = 'PENDING';
      const newStatus = 'APPROVED';

      await emitter.handleRewardRedemptionChange(redemptionId, oldStatus, newStatus);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('User Role Change Detection', () => {
    const mockUserData = {
      id: 'user-123',
      familyId: 'family-456',
      role: 'GUILD_MASTER',
      name: 'John Doe'
    };

    beforeEach(() => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserData);
    });

    it('should detect user role change from HERO to GUILD_MASTER', async () => {
      const userId = 'user-123';
      const oldRole = 'HERO';
      const newRole = 'GUILD_MASTER';
      const changedBy = 'user-456';

      await emitter.handleUserRoleChange(userId, oldRole, newRole, changedBy);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'user_role_updated',
        data: {
          userId,
          userName: 'John Doe',
          oldRole,
          newRole,
          changedBy
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should detect user role change from GUILD_MASTER to HERO', async () => {
      const userId = 'user-123';
      const oldRole = 'GUILD_MASTER';
      const newRole = 'HERO';
      const changedBy = 'user-789';

      const heroUserData = {
        ...mockUserData,
        role: 'HERO'
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(heroUserData);

      await emitter.handleUserRoleChange(userId, oldRole, newRole, changedBy);

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: 'user_role_updated',
        data: {
          userId,
          userName: 'John Doe',
          oldRole,
          newRole,
          changedBy
        },
        familyId: 'family-456',
        timestamp: expect.any(String)
      });
    });

    it('should handle user not found gracefully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const userId = 'nonexistent-user';
      const oldRole = 'HERO';
      const newRole = 'GUILD_MASTER';
      const changedBy = 'user-456';

      await emitter.handleUserRoleChange(userId, oldRole, newRole, changedBy);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event Filtering and Family Isolation', () => {
    it('should only emit events for the correct family', async () => {
      const questData = {
        id: 'quest-123',
        status: 'COMPLETED',
        assignedTo: 'user-123',
        user: {
          familyId: 'family-456' // Different family
        },
        template: {
          name: 'Clean Kitchen'
        }
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(questData);

      await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: 'family-456'
        })
      );
    });

    it('should not emit events for missing family data', async () => {
      const questDataNoFamily = {
        id: 'quest-123',
        status: 'COMPLETED',
        assignedTo: 'user-123',
        user: null, // No user/family data
        template: {
          name: 'Clean Kitchen'
        }
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(questDataNoFamily);

      await emitter.handleQuestStatusChange('quest-123', 'STARTED', 'COMPLETED');

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event Timestamp and Structure', () => {
    it('should include valid ISO timestamp in all events', async () => {
      const mockQuestData = {
        id: 'quest-123',
        status: 'STARTED',
        assignedTo: 'user-123',
        user: { familyId: 'family-456' },
        template: { name: 'Test Quest' }
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestData);

      await emitter.handleQuestStatusChange('quest-123', 'ASSIGNED', 'STARTED');

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        })
      );
    });

    it('should validate event structure with required fields', async () => {
      const mockQuestData = {
        id: 'quest-123',
        status: 'STARTED',
        assignedTo: 'user-123',
        user: { familyId: 'family-456' },
        template: { name: 'Test Quest' }
      };

      (mockPrisma.questInstance.findUnique as jest.Mock).mockResolvedValue(mockQuestData);

      await emitter.handleQuestStatusChange('quest-123', 'ASSIGNED', 'STARTED');

      expect(mockEventHandler).toHaveBeenCalledWith({
        type: expect.stringMatching(/^[a-z_]+$/), // Valid event type format
        data: expect.any(Object),
        familyId: expect.stringMatching(/^[a-zA-Z0-9-]+$/), // Valid family ID format
        timestamp: expect.any(String)
      });
    });
  });
});