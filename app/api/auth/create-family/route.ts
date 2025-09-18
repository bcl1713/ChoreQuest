import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, generateFamilyCode } from '@/lib/auth';

const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userName: z.string().min(2, 'Your name must be at least 2 characters')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFamilySchema.parse(body);

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

    // Generate unique family code
    let familyCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      familyCode = generateFamilyCode();
      const existingFamily = await prisma.family.findUnique({
        where: { code: familyCode }
      });

      if (!existingFamily) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Unable to generate unique family code. Please try again.' },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create family and guild master in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          name: validatedData.name,
          code: familyCode!
        }
      });

      // Create guild master user
      const user = await tx.user.create({
        data: {
          name: validatedData.userName,
          email: validatedData.email,
          password: hashedPassword,
          role: 'GUILD_MASTER',
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

      return { family, user };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      familyId: result.user.familyId,
      role: result.user.role
    });

    return NextResponse.json({
      user: {
        ...result.user,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString()
      },
      family: {
        id: result.family.id,
        name: result.family.name,
        code: result.family.code,
        createdAt: result.family.createdAt.toISOString(),
        updatedAt: result.family.updatedAt.toISOString()
      },
      token
    });

  } catch (error) {
    console.error('Family creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during family creation' },
      { status: 500 }
    );
  }
}