import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';

const redeemRewardSchema = z.object({
  rewardId: z.string().min(1, 'Reward ID is required'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getTokenData(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = redeemRewardSchema.parse(body);

    // Get reward details and verify it belongs to user's family (before transaction)
    const reward = await prisma.reward.findFirst({
      where: {
        id: validatedData.rewardId,
        familyId: authUser.familyId,
        isActive: true,
      }
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found or not available' },
        { status: 404 }
      );
    }

    // Get user's current character stats (before transaction)
    const character = await prisma.character.findUnique({
      where: { userId: authUser.userId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Check if user has enough gold (before transaction)
    if (character.gold < reward.cost) {
      return NextResponse.json(
        { error: 'Insufficient gold to redeem this reward' },
        { status: 400 }
      );
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {

      // Deduct gold from character
      await tx.character.update({
        where: { id: character.id },
        data: { gold: character.gold - reward.cost }
      });

      // Create transaction record for gold deduction
      await tx.transaction.create({
        data: {
          userId: authUser.userId,
          type: 'STORE_PURCHASE',
          goldChange: -reward.cost,
          description: `Redeemed reward: ${reward.name}`,
          relatedId: validatedData.rewardId,
        }
      });

      // Create redemption request
      const redemption = await tx.rewardRedemption.create({
        data: {
          userId: authUser.userId,
          rewardId: validatedData.rewardId,
          cost: reward.cost,
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
          }
        }
      });

      return {
        redemption,
        newGoldBalance: character.gold - reward.cost,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Reward redemption requested successfully',
      redemption: result.redemption,
      newGoldBalance: result.newGoldBalance,
    });

  } catch (error) {
    console.error('Failed to redeem reward:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to redeem reward';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}