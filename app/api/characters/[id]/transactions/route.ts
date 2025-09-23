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

    // Find the character to verify access
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

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: { userId: character.userId },
      orderBy: { createdAt: 'desc' }
    });

    const transactionData = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      questId: transaction.relatedId,
      goldChange: transaction.goldChange,
      xpChange: transaction.xpChange,
      gemsChange: transaction.gemsChange,
      honorPointsChange: transaction.honorChange,
      metadata: transaction.description.includes('Level up:') ? {
        levelUp: {
          previousLevel: parseInt(transaction.description.match(/Level up: (\d+) →/)?.[1] || '1'),
          newLevel: parseInt(transaction.description.match(/→ (\d+)\)/)?.[1] || '1')
        }
      } : undefined,
      createdAt: transaction.createdAt.toISOString()
    }));

    return NextResponse.json(transactionData);

  } catch (error) {
    console.error('Transaction history error:', error);
    return NextResponse.json({
      error: 'Failed to get transaction history'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}