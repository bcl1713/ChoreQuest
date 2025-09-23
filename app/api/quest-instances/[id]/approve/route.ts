import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';
import { RewardCalculator } from '@/lib/reward-calculator';

const prisma = new PrismaClient();

const questApprovalSchema = z.object({
  approverId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    const { id: questId } = await params;
    const body = await req.json();
    const validation = questApprovalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid approval request data'
      }, { status: 400 });
    }

    const { approverId } = validation.data;

    // Verify approver is guild master
    if (tokenData.role !== 'GUILD_MASTER' || tokenData.userId !== approverId) {
      return NextResponse.json({
        success: false,
        message: 'Only Guild Masters can approve quests'
      }, { status: 403 });
    }

    // Find the quest instance with full details
    const questInstance = await prisma.questInstance.findUnique({
      where: { id: questId },
      include: {
        assignedTo: {
          include: {
            character: true
          }
        },
        template: true
      }
    });

    if (!questInstance || questInstance.familyId !== tokenData.familyId) {
      return NextResponse.json({
        success: false,
        message: 'Quest not found or not accessible'
      }, { status: 404 });
    }

    // Check quest status - must be completed, not already approved
    if (questInstance.status !== 'COMPLETED') {
      if (questInstance.status === 'APPROVED') {
        return NextResponse.json({
          success: false,
          message: 'Quest already approved'
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        message: 'Quest must be completed before it can be approved'
      }, { status: 400 });
    }

    // Get character details
    if (!questInstance.assignedTo?.character) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update character stats'
      }, { status: 500 });
    }

    const character = questInstance.assignedTo.character;

    // Calculate rewards using RewardCalculator
    const baseRewards = {
      goldReward: questInstance.goldReward || 0,
      xpReward: questInstance.xpReward || 0,
      gemsReward: 0, // Not yet implemented in schema
      honorPointsReward: 0, // Not yet implemented in schema
    };

    const calculatedRewards = RewardCalculator.calculateQuestRewards(
      baseRewards,
      questInstance.difficulty,
      character.class,
      character.level
    );

    // Check for level up
    const levelUpInfo = RewardCalculator.calculateLevelUp(
      character.xp,
      calculatedRewards.xp,
      character.level
    );

    // Execute transaction - approve quest and award rewards
    const result = await prisma.$transaction(async (tx) => {
      // Update quest status
      const updatedQuest = await tx.questInstance.update({
        where: { id: questId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        }
      });

      // Update character stats
      const newLevel = levelUpInfo?.newLevel || character.level;
      const updatedCharacter = await tx.character.update({
        where: { id: character.id },
        data: {
          xp: { increment: calculatedRewards.xp },
          gold: { increment: calculatedRewards.gold },
          gems: { increment: calculatedRewards.gems },
          honorPoints: { increment: calculatedRewards.honorPoints },
          level: newLevel
        }
      });

      // Create transaction record - add level up info to description if applicable
      const transactionDescription = levelUpInfo
        ? `Reward for quest completion: ${questInstance.title} (Level up: ${levelUpInfo.previousLevel} → ${levelUpInfo.newLevel})`
        : `Reward for quest completion: ${questInstance.title}`;

      const transactionRecord = await tx.transaction.create({
        data: {
          userId: character.userId,
          type: 'QUEST_REWARD',
          description: transactionDescription,
          goldChange: calculatedRewards.gold,
          xpChange: calculatedRewards.xp,
          gemsChange: calculatedRewards.gems,
          honorChange: calculatedRewards.honorPoints,
          relatedId: questId
        }
      });

      return {
        quest: updatedQuest,
        character: updatedCharacter,
        transaction: transactionRecord,
        levelUpInfo
      };
    });

    // Build response
    const response = {
      success: true,
      message: 'Quest approved successfully',
      rewards: {
        gold: calculatedRewards.gold,
        xp: calculatedRewards.xp,
        gems: calculatedRewards.gems,
        honorPoints: calculatedRewards.honorPoints,
      },
      ...(levelUpInfo && {
        characterUpdates: {
          leveledUp: true,
          newLevel: levelUpInfo.newLevel
        }
      }),
      transaction: {
        id: result.transaction.id,
        type: 'QUEST_REWARD' as const,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt.toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Quest approval error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to approve quest'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}