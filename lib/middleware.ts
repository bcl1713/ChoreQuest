import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    familyId: string;
    role: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; familyId: string; role: string };
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No valid authorization header found' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const decoded = verifyToken(token);

    // Optionally verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, familyId: true, role: true }
    });

    if (!user) {
      return { success: false, error: 'User no longer exists' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        familyId: user.familyId,
        role: user.role
      }
    };

  } catch {
    return { success: false, error: 'Invalid or expired token' };
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Add user info to request
    (request as AuthenticatedRequest).user = authResult.user;

    return handler(request as AuthenticatedRequest);
  };
}

export function requireRole(allowedRoles: string[], handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(authResult.user!.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this quest!' },
        { status: 403 }
      );
    }

    // Add user info to request
    (request as AuthenticatedRequest).user = authResult.user;

    return handler(request as AuthenticatedRequest);
  };
}