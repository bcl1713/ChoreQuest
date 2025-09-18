import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const character = await prisma.character.findUnique({
      where: { userId: tokenData.userId },
    });

    if (!character) {
      return NextResponse.json({ character: null });
    }

    return NextResponse.json({
      character: {
        id: character.id,
        name: character.name,
        class: character.class,
        level: character.level,
        xp: character.xp,
        gold: character.gold,
        gems: character.gems,
        honorPoints: character.honorPoints,
        avatarUrl: character.avatarUrl,
      }
    });
  } catch (error) {
    console.error('Character fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch character'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}