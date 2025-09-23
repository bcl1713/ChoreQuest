import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: characterId } = await params;

    // Find the character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        user: true
      }
    });

    if (!character || character.user.familyId !== tokenData.familyId) {
      return NextResponse.json({
        error: 'Character not found or not accessible'
      }, { status: 404 });
    }

    const response = {
      character: {
        id: character.id,
        name: character.name,
        class: character.class,
        level: character.level,
        xp: character.xp,
        gold: character.gold,
        gems: character.gems,
        honorPoints: character.honorPoints,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Character stats error:', error);
    return NextResponse.json({
      error: 'Failed to get character stats'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}