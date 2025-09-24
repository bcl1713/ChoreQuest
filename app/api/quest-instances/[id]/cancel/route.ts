import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getTokenData(req);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: questId } = await params;

    // Find the quest instance
    const questInstance = await prisma.questInstance.findUnique({
      where: { id: questId },
    });

    if (!questInstance || questInstance.familyId !== tokenData.familyId) {
      return NextResponse.json({
        error: 'Quest not found or not accessible'
      }, { status: 404 });
    }

    // Only guild masters can cancel quests
    if (tokenData.role !== 'GUILD_MASTER') {
      return NextResponse.json({
        error: 'Only Guild Masters can cancel quests'
      }, { status: 403 });
    }

    // Cannot cancel completed or approved quests
    if (questInstance.status === 'COMPLETED' || questInstance.status === 'APPROVED') {
      return NextResponse.json({
        error: 'Cannot cancel completed or approved quests'
      }, { status: 409 });
    }

    // Delete the quest instance
    await prisma.questInstance.delete({
      where: { id: questId }
    });

    return NextResponse.json({
      success: true,
      message: 'Quest cancelled successfully'
    });
  } catch (error) {
    console.error('Quest cancellation error:', error);
    return NextResponse.json({
      error: 'Failed to cancel quest'
    }, { status: 500 });
  }
}