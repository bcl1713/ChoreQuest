import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all family members
    const familyMembers = await prisma.user.findMany({
      where: {
        familyId: tokenData.familyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        character: {
          select: {
            id: true,
            name: true,
            class: true,
            level: true
          }
        }
      }
    });

    return NextResponse.json({
      members: familyMembers
    });
  } catch (error) {
    console.error('Family members fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch family members'
    }, { status: 500 });
  }
}