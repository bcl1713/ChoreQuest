import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getTokenData(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active rewards for the user's family
    const rewards = await prisma.reward.findMany({
      where: {
        familyId: authUser.familyId,
        isActive: true,
      },
      orderBy: [
        { cost: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}