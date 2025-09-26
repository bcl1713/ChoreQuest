import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';
import { emitRewardRedemptionChange, emitCharacterStatsChange } from '@/lib/realtime-events';

const updateRedemptionSchema = z.object({
  status: z.enum(['APPROVED', 'DENIED', 'FULFILLED']),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getTokenData(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Guild Masters can approve/deny redemptions
    if (authUser.role !== 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'Only Guild Masters can manage reward redemptions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateRedemptionSchema.parse(body);
    const resolvedParams = await params;

    // Get redemption and verify it belongs to the same family
    const redemption = await prisma.rewardRedemption.findFirst({
      where: {
        id: resolvedParams.id,
        user: {
          familyId: authUser.familyId
        }
      },
      include: {
        user: {
          include: {
            character: true
          }
        },
        reward: true
      }
    });

    if (!redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    // Handle refund if denying a redemption
    const oldStatus = redemption.status;
    const result = await prisma.$transaction(async (tx) => {
      // If denying the redemption, refund the gold
      if (validatedData.status === 'DENIED' && redemption.status === 'PENDING') {
        const oldGold = redemption.user.character!.gold;
        const newGold = oldGold + redemption.cost;

        await tx.character.update({
          where: { userId: redemption.userId },
          data: {
            gold: newGold
          }
        });

        // Emit character stats change event for refund
        await emitCharacterStatsChange(redemption.user.character!.id, {
          gold: { old: oldGold, new: newGold }
        });

        // Create refund transaction record
        await tx.transaction.create({
          data: {
            userId: redemption.userId,
            type: 'REWARD_REFUND',
            goldChange: redemption.cost,
            description: `Refund for denied reward: ${redemption.reward.name}`,
            relatedId: redemption.id,
          }
        });
      }

      // Update redemption status
      const updatedRedemption = await tx.rewardRedemption.update({
        where: { id: resolvedParams.id },
        data: {
          status: validatedData.status,
          approvedBy: authUser.userId,
          approvedAt: new Date(),
          fulfilledAt: validatedData.status === 'FULFILLED' ? new Date() : null,
          notes: validatedData.notes,
        },
        include: {
          reward: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          approver: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      return updatedRedemption;
    });

    // Emit reward redemption change event
    await emitRewardRedemptionChange(resolvedParams.id, oldStatus, validatedData.status);

    return NextResponse.json({
      success: true,
      redemption: result,
    });

  } catch (error) {
    console.error('Failed to update redemption:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update redemption' },
      { status: 500 }
    );
  }
}