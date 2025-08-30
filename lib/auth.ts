import { User } from '@/types';

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