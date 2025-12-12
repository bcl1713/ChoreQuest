'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfile, Family } from '@/lib/types/database';
import { useNetworkReady } from './network-ready-context';
import { loadUserData } from './auth/load-user-data';
import { createFamilyFlow } from './auth/create-family';
import { loginUser, registerUser, updatePasswordFlow } from './auth/auth-actions';

// Using types from @/lib/types/database

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  family: Family | null;
  session: Session | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; familyCode: string }) => Promise<void>;
  createFamily: (data: { name: string; email: string; password: string; userName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  characterName: string;
  setCharacterName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { waitForReady } = useNetworkReady();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [characterName, setCharacterName] = useState<string>('');

  // Refs to prevent duplicate loadUserData calls
  const prevUserIdRef = useRef<string | null>(null);
  const isLoadingUserDataRef = useRef(false);

  // Load user profile and family data
  const loadUserDataHandler = useCallback(
    async (userId: string, authSession?: Session | null) => {
      await loadUserData({
        userId,
        authSession,
        sessionAccessToken: session?.access_token ?? null,
        waitForReady,
        setProfile,
        setFamily,
        prevUserIdRef,
        isLoadingUserDataRef,
        setIsLoading,
      });
    },
    [waitForReady, session?.access_token]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, currentSession?.user?.id, 'Creating family:', isCreatingFamily);

      if (isCreatingFamily) {
        console.log('Ignoring auth state change during family creation');
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadUserDataHandler(currentSession.user.id, currentSession);
      } else {
        setProfile(null);
        setFamily(null);
        prevUserIdRef.current = null;
        isLoadingUserDataRef.current = false;
      }

      setIsLoading(false);

      if (event === 'SIGNED_OUT') {
        setError(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    (async () => {
      console.log('AuthContext: Starting auth initialization...');
      try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] AuthContext: Waiting for network ready...`);
        await waitForReady();
        console.log(`[${new Date().toISOString()}] AuthContext: Network ready, awaiting auth events`);
      } catch (err) {
        console.error('AuthContext: Error during initialization:', err);
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isCreatingFamily, waitForReady, loadUserDataHandler]);

  // Subscribe to profile updates so role changes propagate in real time
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase
      .channel(`user-profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('AuthContext: Detected profile update via realtime', payload);
          await loadUserDataHandler(user.id, session);
        },
      )
      .subscribe((status) => {
        console.log('AuthContext: Profile subscription status', status);
        return status;
      });

    return () => {
      console.log('AuthContext: Unsubscribing from profile updates');
      channel.unsubscribe();
    };
  }, [user?.id, session, loadUserDataHandler]);

  const clearError = () => setError(null);

  const logout = useCallback(async () => {
    clearError();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Add explicit session refresh on visibility change for mobile browsers
  // This ensures session is still valid after tab resume or app backgrounding
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] AuthContext: Tab visible, validating session...`);

        // Explicitly get current session (triggers auto-refresh if needed)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error(`[${timestamp}] AuthContext: Session validation error:`, error);
          return;
        }

        if (!currentSession) {
          console.log(`[${timestamp}] AuthContext: Session lost, signing out...`);
          await logout();
        } else if (currentSession.user.id === user.id) {
          console.log(`[${timestamp}] AuthContext: Session valid for user:`, user.id);
          // Session is valid, onAuthStateChange will handle any updates
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, logout]);

  const login = async (credentials: { email: string; password: string }) =>
    loginUser(supabase, credentials, setError, setIsLoading);

  const register = async (data: { name: string; email: string; password: string; familyCode: string }) =>
    registerUser(supabase, data, setError, setIsLoading);

  const createFamily = async (data: { name: string; email: string; password: string; userName: string }) => {
    clearError();
    setIsLoading(true);
    setIsCreatingFamily(true); // Prevent premature auth state changes

    try {
      console.log('Starting family creation process...');

      // Generate family code
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log('Generated family code:', familyCode);

      // Create the auth user first
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('Auth user creation failed:', authError);
        throw new Error(`User creation failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account - no user returned');
      }

      console.log('Auth user created successfully:', authData.user.id);

      await createFamilyFlow({
        data,
        supabase,
        setError,
        setIsLoading,
        setIsCreatingFamily,
        setSession,
        setUser,
        loadUserData: (userId: string, authSession: Session | null) =>
          loadUserDataHandler(userId, authSession),
      });
    } catch (err) {
      console.error('Family creation process failed:', err);
      const message = err instanceof Error ? err.message : 'Family creation failed';
      setError(message);
      setIsCreatingFamily(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = useCallback(
    (currentPassword: string, newPassword: string) =>
      updatePasswordFlow(supabase, user, currentPassword, newPassword, setError, setIsLoading),
    [user]
  );

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
      updatePassword,
      isLoading,
      error,
      characterName,
      setCharacterName
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
