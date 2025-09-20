import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import { getTokenData } from '@/lib/auth';

const prisma = new PrismaClient();

// Schema for creating quest instance from template
const questInstanceFromTemplateSchema = z.object({
  templateId: z.string(),
  assignedToId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

// Schema for creating ad-hoc quest instance
const questInstanceAdHocSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  xpReward: z.number().int().min(1, 'XP reward must be positive'),
  goldReward: z.number().int().min(0, 'Gold reward cannot be negative'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.enum(['DAILY', 'WEEKLY', 'BOSS_BATTLE']),
  assignedToId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const questInstanceSchema = z.union([questInstanceFromTemplateSchema, questInstanceAdHocSchema]);

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instances = await prisma.questInstance.findMany({
      where: {
        familyId: tokenData.familyId
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Quest instances fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch quest instances'
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

    // Only guild masters can create quest instances
    if (tokenData.role !== 'GUILD_MASTER') {
      return NextResponse.json({
        error: 'Only the Guild Master can create quest instances'
      }, { status: 403 });
    }

    const body = await req.json();
    const validation = questInstanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid quest instance data',
        details: validation.error.format()
      }, { status: 400 });
    }

    const data = validation.data;
    let instanceData;

    if ('templateId' in data) {
      // Creating from template
      const template = await prisma.questTemplate.findUnique({
        where: { id: data.templateId }
      });

      if (!template || template.familyId !== tokenData.familyId) {
        return NextResponse.json({
          error: 'Quest template not found or not accessible'
        }, { status: 404 });
      }

      instanceData = {
        title: template.title,
        description: template.description,
        xpReward: template.xpReward,
        goldReward: template.goldReward,
        difficulty: template.difficulty,
        category: template.category,
        templateId: data.templateId,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: tokenData.userId,
        familyId: tokenData.familyId,
      };
    } else {
      // Creating ad-hoc instance
      instanceData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: tokenData.userId,
        familyId: tokenData.familyId,
        templateId: null,
      };
    }

    // Verify assigned user is in the same family
    if (instanceData.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: instanceData.assignedToId }
      });

      if (!assignedUser || assignedUser.familyId !== tokenData.familyId) {
        return NextResponse.json({
          error: 'Cannot assign quest to user outside family'
        }, { status: 400 });
      }
    }

    const instance = await prisma.questInstance.create({
      data: instanceData
    });

    return NextResponse.json({ instance }, { status: 201 });
  } catch (error) {
    console.error('Quest instance creation error:', error);
    return NextResponse.json({
      error: 'Failed to create quest instance'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}