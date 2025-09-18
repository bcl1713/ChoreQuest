import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  familyCode: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A hero with this email already exists in the realm!' },
        { status: 400 }
      );
    }

    let family;
    let userRole: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO' = 'YOUNG_HERO';

    if (validatedData.familyCode) {
      // Join existing family
      family = await prisma.family.findUnique({
        where: { code: validatedData.familyCode }
      });

      if (!family) {
        return NextResponse.json(
          { error: 'Invalid family code. No guild found with this code!' },
          { status: 400 }
        );
      }

      // Set role as HERO for non-first members
      userRole = 'HERO';
    } else {
      return NextResponse.json(
        { error: 'Family code is required to join the realm!' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: userRole,
        familyId: family.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      familyId: user.familyId,
      role: user.role
    });

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}