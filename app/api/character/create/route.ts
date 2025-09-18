import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, CharacterClass } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, characterClass } = await req.json();

    if (!name || !characterClass) {
      return NextResponse.json({
        error: 'Character name and class are required'
      }, { status: 400 });
    }

    if (!Object.values(CharacterClass).includes(characterClass)) {
      return NextResponse.json({
        error: 'Invalid character class'
      }, { status: 400 });
    }

    const existingCharacter = await prisma.character.findUnique({
      where: { userId: tokenData.userId }
    });

    if (existingCharacter) {
      return NextResponse.json({
        error: 'Character already exists for this user'
      }, { status: 400 });
    }

    const character = await prisma.character.create({
      data: {
        userId: tokenData.userId,
        name,
        class: characterClass,
        level: 1,
        xp: 0,
        gold: 0,
        gems: 0,
        honorPoints: 0,
      },
    });

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
      }
    });
  } catch (error) {
    console.error('Character creation error:', error);
    return NextResponse.json({
      error: 'Failed to create character'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}