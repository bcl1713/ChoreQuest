import { EventEmitter } from 'events';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// Event type definitions
export type RealTimeEventType =
  | 'quest_updated'
  | 'character_updated'
  | 'reward_redemption_updated'
  | 'user_role_updated';

export interface QuestEventData {
  questId: string;
  status: string;
  userId: string;
  questName: string;
  xpAwarded: number | null;
  goldAwarded: number | null;
}

export interface CharacterEventData {
  userId: string;
  characterId: string;
  changes: {
    gold?: number;
    xp?: number;
    level?: number;
    gems?: number;
    honorPoints?: number;
  };
}

export interface RewardRedemptionEventData {
  redemptionId: string;
  rewardId: string;
  userId: string;
  status: string;
  cost: number;
  rewardName: string;
}

export interface UserRoleEventData {
  userId: string;
  userName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}

export interface RealTimeEvent {
  type: RealTimeEventType;
  data: QuestEventData | CharacterEventData | RewardRedemptionEventData | UserRoleEventData;
  familyId: string;
  timestamp: string;
}

export class DatabaseChangeEmitter extends EventEmitter {
  constructor() {
    super();
  }

  async handleQuestStatusChange(questId: string, oldStatus: string, newStatus: string): Promise<void> {
    try {
      const quest = await prisma.questInstance.findUnique({
        where: { id: questId },
        include: {
          assignedTo: true,
          template: true
        }
      });

      if (!quest || !quest.assignedTo) {
        return;
      }

      const event: RealTimeEvent = {
        type: 'quest_updated',
        data: {
          questId,
          status: newStatus,
          userId: quest.assignedToId || '',
          questName: quest.template?.title || quest.title,
          xpAwarded: quest.xpReward,
          goldAwarded: quest.goldReward
        },
        familyId: quest.familyId,
        timestamp: new Date().toISOString()
      };

      this.emit('event', event);
    } catch (error) {
      console.error('Error handling quest status change:', error);
    }
  }

  async handleCharacterStatsChange(
    characterId: string,
    changes: {
      [key: string]: { old: number; new: number }
    }
  ): Promise<void> {
    try {
      const character = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
          user: true
        }
      });

      if (!character || !character.user) {
        return;
      }

      const changeData: { [key: string]: number } = {};
      for (const [key, change] of Object.entries(changes)) {
        changeData[key] = change.new;
      }

      const event: RealTimeEvent = {
        type: 'character_updated',
        data: {
          userId: character.userId,
          characterId,
          changes: changeData
        },
        familyId: character.user.familyId,
        timestamp: new Date().toISOString()
      };

      this.emit('event', event);
    } catch (error) {
      console.error('Error handling character stats change:', error);
    }
  }

  async handleRewardRedemptionChange(
    redemptionId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      const redemption = await prisma.rewardRedemption.findUnique({
        where: { id: redemptionId },
        include: {
          user: true,
          reward: true
        }
      });

      if (!redemption || !redemption.user) {
        return;
      }

      const event: RealTimeEvent = {
        type: 'reward_redemption_updated',
        data: {
          redemptionId,
          rewardId: redemption.rewardId,
          userId: redemption.userId,
          status: newStatus,
          cost: redemption.cost,
          rewardName: redemption.reward.name
        },
        familyId: redemption.user.familyId,
        timestamp: new Date().toISOString()
      };

      this.emit('event', event);
    } catch (error) {
      console.error('Error handling reward redemption change:', error);
    }
  }

  async handleUserRoleChange(
    userId: string,
    oldRole: string,
    newRole: string,
    changedBy: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return;
      }

      const event: RealTimeEvent = {
        type: 'user_role_updated',
        data: {
          userId,
          userName: user.name,
          oldRole,
          newRole,
          changedBy
        },
        familyId: user.familyId,
        timestamp: new Date().toISOString()
      };

      this.emit('event', event);
    } catch (error) {
      console.error('Error handling user role change:', error);
    }
  }
}

// Global emitter instance
const globalEmitter = new DatabaseChangeEmitter();

// Connect emitter to SSE broadcaster
import { broadcastToFamily } from '../app/api/events/route';

globalEmitter.on('event', (event: RealTimeEvent) => {
  broadcastToFamily(event.familyId, event);
});

export { globalEmitter };

// Helper functions to trigger events (to be called from API routes)
export async function emitQuestStatusChange(questId: string, oldStatus: string, newStatus: string) {
  await globalEmitter.handleQuestStatusChange(questId, oldStatus, newStatus);
}

export async function emitCharacterStatsChange(
  characterId: string,
  changes: { [key: string]: { old: number; new: number } }
) {
  await globalEmitter.handleCharacterStatsChange(characterId, changes);
}

export async function emitRewardRedemptionChange(
  redemptionId: string,
  oldStatus: string,
  newStatus: string
) {
  await globalEmitter.handleRewardRedemptionChange(redemptionId, oldStatus, newStatus);
}

export async function emitUserRoleChange(
  userId: string,
  oldRole: string,
  newRole: string,
  changedBy: string
) {
  await globalEmitter.handleUserRoleChange(userId, oldRole, newRole, changedBy);
}