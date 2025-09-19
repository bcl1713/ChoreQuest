import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/types';
import { NextRequest } from 'next/server';

export interface AuthUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  familyCode?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface CreateFamilyData {
  name: string;
  email: string;
  password: string;
  userName: string;
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT utilities
export function generateToken(payload: { userId: string; familyId: string; role: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const options: jwt.SignOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    issuer: 'chorequest',
    audience: 'chorequest-users'
  };

  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): { userId: string; familyId: string; role: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'chorequest',
      audience: 'chorequest-users'
    }) as jwt.JwtPayload;

    if (!decoded.userId || !decoded.familyId || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    return {
      userId: decoded.userId,
      familyId: decoded.familyId,
      role: decoded.role
    };
  } catch {
    throw new Error('Invalid or expired token');
  }
}

// Generate a unique family code
export function generateFamilyCode(): string {
  const adjectives = ['Epic', 'Brave', 'Noble', 'Swift', 'Wise', 'Bold', 'Fierce', 'Loyal'];
  const nouns = ['Knights', 'Dragons', 'Wizards', 'Rangers', 'Heroes', 'Guards', 'Legends', 'Warriors'];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective}${noun}${number}`;
}

// Extract token data from request
export async function getTokenData(req: NextRequest): Promise<{ userId: string; familyId: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return verifyToken(token);
  } catch {
    return null;
  }
}