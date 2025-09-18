'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, AuthResponse } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  family: { id: string; name: string; code: string } | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; familyCode: string }) => Promise<void>;
  createFamily: (data: { name: string; email: string; password: string; userName: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [family, setFamily] = useState<{ id: string; name: string; code: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('chorequest-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setFamily(parsed.family);
        setToken(parsed.token);
      } catch (error) {
        localStorage.removeItem('chorequest-auth');
      }
    }
    setIsLoading(false);
  }, []);

  const storeAuth = (data: { user: AuthUser; token: string; family?: { id: string; name: string; code: string } }) => {
    const authData = {
      user: data.user,
      token: data.token,
      family: data.family || family
    };
    localStorage.setItem('chorequest-auth', JSON.stringify(authData));
    setUser(data.user);
    setToken(data.token);
    if (data.family) setFamily(data.family);
  };

  const clearAuth = () => {
    localStorage.removeItem('chorequest-auth');
    setUser(null);
    setFamily(null);
    setToken(null);
  };

  const makeRequest = async (endpoint: string, data: Record<string, string>): Promise<AuthResponse & { family?: { id: string; name: string; code: string } }> => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Authentication failed');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const result = await makeRequest('login', credentials);
    storeAuth(result);
  };

  const register = async (data: { name: string; email: string; password: string; familyCode: string }) => {
    const result = await makeRequest('register', data);
    storeAuth(result);
  };

  const createFamily = async (data: { name: string; email: string; password: string; userName: string }) => {
    const result = await makeRequest('create-family', data);
    storeAuth(result);
  };

  const logout = () => {
    clearAuth();
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      family,
      token,
      login,
      register,
      createFamily,
      logout,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}