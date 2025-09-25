import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

/**
 * Test endpoint for updating character stats in E2E tests
 * Only available in test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in test environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoints not available in production' }, { status: 403 });
  }

  try {
    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the user's character
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { character: true }
    });

    if (!user || !user.character) {
      return NextResponse.json({ error: 'User or character not found' }, { status: 404 });
    }

    // Update character stats
    const updatedCharacter = await prisma.character.update({
      where: { id: user.character.id },
      data: updates
    });

    return NextResponse.json({
      success: true,
      character: updatedCharacter
    });

  } catch (error) {
    console.error('Test character update error:', error);
    return NextResponse.json({ error: 'Failed to update character stats' }, { status: 500 });
  }
}