import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getTokenData(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all redemption requests for the family
    const redemptions = await prisma.rewardRedemption.findMany({
      where: {
        user: {
          familyId: authUser.familyId
        }
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
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return NextResponse.json({ redemptions });
  } catch (error) {
    console.error('Failed to fetch redemptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
      { status: 500 }
    );
  }
}