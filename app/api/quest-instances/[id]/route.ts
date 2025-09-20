import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient, QuestStatus } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

const questStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'EXPIRED']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questId } = await params;
    const body = await req.json();
    const validation = questStatusUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid quest status update data',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { status } = validation.data;

    // Find the quest instance
    const questInstance = await prisma.questInstance.findUnique({
      where: { id: questId },
      include: {
        assignedTo: {
          include: {
            character: true
          }
        }
      }
    });

    if (!questInstance || questInstance.familyId !== tokenData.familyId) {
      return NextResponse.json({
        error: 'Quest not found or not accessible'
      }, { status: 404 });
    }

    // Permission checks based on status transition
    const currentStatus = questInstance.status;

    // Heroes can mark their own quests as IN_PROGRESS or COMPLETED
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
      if (questInstance.assignedToId !== tokenData.userId) {
        return NextResponse.json({
          error: 'You can only update your own assigned quests'
        }, { status: 403 });
      }
    }

    // Only guild masters can approve quests
    if (status === 'APPROVED') {
      if (tokenData.role !== 'GUILD_MASTER') {
        return NextResponse.json({
          error: 'Only the Guild Master can approve quests'
        }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: {
      status: QuestStatus;
      completedAt?: Date;
      approvedAt?: Date;
    } = { status: status as QuestStatus };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    let updatedInstance;

    // If approving quest, award rewards
    if (status === 'APPROVED' && currentStatus === 'COMPLETED') {
      updatedInstance = await prisma.$transaction(async (tx) => {
        // Update quest status
        const quest = await tx.questInstance.update({
          where: { id: questId },
          data: updateData
        });

        // Award rewards to character
        if (questInstance.assignedTo?.character) {
          await tx.character.update({
            where: { id: questInstance.assignedTo.character.id },
            data: {
              xp: { increment: questInstance.xpReward },
              gold: { increment: questInstance.goldReward }
            }
          });
        }

        return quest;
      });
    } else {
      updatedInstance = await prisma.questInstance.update({
        where: { id: questId },
        data: updateData
      });
    }

    return NextResponse.json({ instance: updatedInstance });
  } catch (error) {
    console.error('Quest instance update error:', error);
    return NextResponse.json({
      error: 'Failed to update quest instance'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}