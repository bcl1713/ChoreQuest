import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

/**
 * Test endpoint for updating user's family association in E2E tests
 * Only available in test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in test environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoints not available in production' }, { status: 403 });
  }

  try {
    const { userId, familyId } = await request.json();

    if (!userId || !familyId) {
      return NextResponse.json({ error: 'User ID and Family ID are required' }, { status: 400 });
    }

    // Verify the family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId }
    });

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Update user's family association
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { familyId }
    });

    // Character family association is handled through user relationship
    // No need to update character table directly

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Test user family update error:', error);
    return NextResponse.json({ error: 'Failed to update user family' }, { status: 500 });
  }
}