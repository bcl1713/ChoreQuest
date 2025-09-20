import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

const questTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  xpReward: z.number().int().min(1, 'XP reward must be positive'),
  goldReward: z.number().int().min(0, 'Gold reward cannot be negative'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.enum(['DAILY', 'WEEKLY', 'BOSS_BATTLE']),
  classBonuses: z.record(z.string(), z.number()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.questTemplate.findMany({
      where: {
        familyId: tokenData.familyId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Quest templates fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch quest templates'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only guild masters can create quest templates
    if (tokenData.role !== 'GUILD_MASTER') {
      return NextResponse.json({
        error: 'Only the Guild Master can create quest templates'
      }, { status: 403 });
    }

    const body = await req.json();
    const validation = questTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid quest template data',
        details: validation.error.format()
      }, { status: 400 });
    }

    const template = await prisma.questTemplate.create({
      data: {
        ...validation.data,
        familyId: tokenData.familyId
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Quest template creation error:', error);
    return NextResponse.json({
      error: 'Failed to create quest template'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}