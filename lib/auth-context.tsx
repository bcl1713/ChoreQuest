'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO';
  family_id: string;
}

interface Family {
  id: string;
  name: string;
  code: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  family: Family | null;
  session: Session | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; familyCode: string }) => Promise<void>;
  createFamily: (data: { name: string; email: string; password: string; userName: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile and family data
  const loadUserData = async (userId: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Get family data
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', profileData.family_id)
        .single();

      if (familyError) {
        console.error('Error loading family:', familyError);
        return;
      }

      setFamily(familyData);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await loadUserData(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setFamily(null);
        }

        if (event === 'SIGNED_OUT') {
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (credentials: { email: string; password: string }) => {
    clearError();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      // User data will be loaded automatically via auth state change
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; familyCode: string }) => {
    clearError();
    setIsLoading(true);

    try {
      // First, verify the family code exists
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name, code')
        .eq('code', data.familyCode)
        .single();

      if (familyError || !familyData) {
        throw new Error('Invalid family code');
      }

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          role: 'YOUNG_HERO',
          family_id: familyData.id,
        });

      if (profileError) {
        throw profileError;
      }

      // User data will be loaded automatically via auth state change
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createFamily = async (data: { name: string; email: string; password: string; userName: string }) => {
    clearError();
    setIsLoading(true);

    try {
      // Generate family code
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create the family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: data.name,
          code: familyCode,
        })
        .select()
        .single();

      if (familyError) {
        throw familyError;
      }

      // Create user profile with Guild Master role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.userName,
          role: 'GUILD_MASTER',
          family_id: familyData.id,
        });

      if (profileError) {
        throw profileError;
      }

      // User data will be loaded automatically via auth state change
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Family creation failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    clearError();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      family,
      session,
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