'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfile, Family } from '@/lib/types/database';
import { useNetworkReady } from './network-ready-context';

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
  const loadUserData = useCallback(async (userId: string, authSession?: Session | null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AuthContext: loadUserData called for userId:`, userId);

    // Skip if already loading for the same user
    if (isLoadingUserDataRef.current) {
      console.log(`[${timestamp}] AuthContext: loadUserData skipped - already loading for user:`, userId);
      return;
    }

    // Skip if data already loaded for this user
    if (prevUserIdRef.current === userId) {
      console.log(`[${timestamp}] AuthContext: loadUserData skipped - data already loaded for user:`, userId);
      return;
    }

    // Wait for network to be ready before making any Supabase calls
    await waitForReady();

    isLoadingUserDataRef.current = true;
    try {
      const accessToken = authSession?.access_token ?? session?.access_token ?? null;

      if (!accessToken) {
        console.warn('AuthContext: No access token available for loadUserData, skipping fetch');
        return;
      }

      const baseHeaders: Record<string, string> = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      };

      // Fetch user profile via REST to avoid Supabase client hangs
      const profileUrl = new URL('/rest/v1/user_profiles', SUPABASE_URL);
      profileUrl.searchParams.set('select', '*');
      profileUrl.searchParams.set('id', `eq.${userId}`);

      const profileResponse = await fetch(profileUrl.toString(), {
        headers: baseHeaders,
        cache: 'no-store'
      });

      if (profileResponse.status === 406 || profileResponse.status === 404) {
        console.warn('AuthContext: Profile not found for user, clearing state');
        setProfile(null);
        setFamily(null);
        return;
      }

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text().catch(() => '');
        throw new Error(`Profile fetch failed (${profileResponse.status}): ${errorText}`);
      }

      const profileRows = await profileResponse.json();
      const profileData = Array.isArray(profileRows) ? profileRows[0] ?? null : profileRows;

      if (!profileData) {
        console.warn('AuthContext: Profile response empty for user, clearing state');
        setProfile(null);
        setFamily(null);
        return;
      }

      setProfile(profileData);

      // Fetch family data
      const familyUrl = new URL('/rest/v1/families', SUPABASE_URL);
      familyUrl.searchParams.set('select', '*');
      familyUrl.searchParams.set('id', `eq.${profileData.family_id}`);

      const familyResponse = await fetch(familyUrl.toString(), {
        headers: baseHeaders,
        cache: 'no-store'
      });

      if (!familyResponse.ok) {
        const errorText = await familyResponse.text().catch(() => '');
        throw new Error(`Family fetch failed (${familyResponse.status}): ${errorText}`);
      }

      const familyRows = await familyResponse.json();
      const familyData = Array.isArray(familyRows) ? familyRows[0] ?? null : familyRows;

      if (!familyData) {
        console.warn('AuthContext: Family response empty, clearing state');
        setFamily(null);
        return;
      }

      setFamily(familyData);

      // Update refs after successful load
      prevUserIdRef.current = userId;
      setIsLoading(false);

    } catch (err) {
      console.error('AuthContext: Error loading user data:', err);
    } finally {
      isLoadingUserDataRef.current = false;
      setIsLoading(false);
    }
  }, [waitForReady, session?.access_token]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id, 'Creating family:', isCreatingFamily);

      if (isCreatingFamily) {
        console.log('Ignoring auth state change during family creation');
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserData(session.user.id, session);
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
  }, [isCreatingFamily, waitForReady, loadUserData]);

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
          await loadUserData(user.id, session);
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
  }, [user?.id, session, loadUserData]);

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
      console.log('Attempting to register with family code:', data.familyCode);

      // First, verify the family code exists
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name, code')
        .eq('code', data.familyCode)
        .single();

      console.log('DEBUG: Family lookup result:', { familyData, familyError });
      console.log('DEBUG: Family error details:', familyError ? {
        message: familyError.message,
        details: familyError.details,
        hint: familyError.hint,
        code: familyError.code
      } : 'No error');

      if (familyError || !familyData) {
        console.error('Family code validation failed:', { familyError, familyData });
        throw new Error('Invalid family code');
      }

      console.log('Family code validated successfully:', familyData);

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

      // If user is not automatically signed in (email confirmation required), sign them in
      if (!authData.session) {
        console.log('No session from signup, attempting to sign in...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          console.error('Sign in after signup failed:', signInError);
          throw new Error(`Sign in failed: ${signInError.message}`);
        }

        console.log('Successfully signed in after signup');
      }

      // Wait a moment for auth state to settle
      console.log('Waiting for auth state to settle...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify authentication is properly established
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current authenticated user before family creation:', currentUser?.id);

      if (!currentUser) {
        throw new Error('User authentication not established properly');
      }


      // Detect browser timezone for family default
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      console.log('Detected browser timezone:', detectedTimezone);

      // Create the family
      console.log('Creating family with name:', data.name);
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: data.name,
          code: familyCode,
          timezone: detectedTimezone,
        })
        .select()
        .single();

      if (familyError) {
        console.error('Family creation failed:', familyError);
        console.error('Family error details:', {
          message: familyError.message,
          details: familyError.details,
          hint: familyError.hint,
          code: familyError.code
        });
        throw new Error(`Family creation failed: ${familyError.message}`);
      }

      console.log('Family created successfully:', familyData);

      // Create user profile with Guild Master role
      console.log('Creating user profile for:', {
        id: authData.user.id,
        email: data.email,
        name: data.userName,
        role: 'GUILD_MASTER',
        family_id: familyData.id
      });

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.userName,
          role: 'GUILD_MASTER',
          family_id: familyData.id,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        console.error('Profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });

        // Add the error to the page for debugging
        const errorDiv = document.createElement('div');
        errorDiv.id = 'profile-error-debug';
        errorDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-size: 12px; max-width: 300px;';
        errorDiv.innerHTML = `Profile Error: ${profileError.message}<br>Code: ${profileError.code}<br>Hint: ${profileError.hint || 'None'}`;
        document.body.appendChild(errorDiv);

        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('Profile data created:', profileData);

      // Verify the profile was actually created and is accessible with RLS
      console.log('Verifying profile was created and is accessible...');
      let verificationAttempts = 0;
      const maxAttempts = 3;
      let profileVerified = false;

      while (verificationAttempts < maxAttempts && !profileVerified) {
        const { data: verifyData, error: verifyError } = await supabase
          .from('user_profiles')
          .select('id, name, role, family_id')
          .eq('id', authData.user.id)
          .single();

        if (verifyData && !verifyError) {
          console.log('Profile verification successful:', verifyData);
          profileVerified = true;
        } else {
          console.log(`Profile verification attempt ${verificationAttempts + 1} failed:`, verifyError);
          if (verificationAttempts < maxAttempts - 1) {
            console.log('Waiting 1 second before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          verificationAttempts++;
        }
      }

      if (!profileVerified) {
        console.error('Profile verification failed after all attempts');
        throw new Error('Profile creation verification failed. Please try again.');
      }

      console.log('User profile created and verified successfully for user:', authData.user.id);
      console.log('Family creation process completed successfully!');

      // Now that everything is complete, manually set the auth state
      setIsCreatingFamily(false);

      // Get the current session and set auth state
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      if (finalSession) {
        setSession(finalSession);
        setUser(finalSession.user);
        await loadUserData(finalSession.user.id, finalSession);
        // Set loading to false immediately after setting user state
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Family creation process failed:', err);
      const message = err instanceof Error ? err.message : 'Family creation failed';
      setError(message);
      setIsCreatingFamily(false); // Clear flag on error too
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    clearError();
    setIsLoading(true);

    try {
      if (!user || !user.email) {
        throw new Error('No user logged in');
      }

      // SECURITY: Verify current password before allowing update
      // This ensures only the user who knows the current password can change it
      console.log('Verifying current password...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('Current password verification failed:', signInError.message);
        throw new Error('Current password is incorrect');
      }

      console.log('Current password verified successfully');

      // Get the current session to use for authorization
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        throw new Error('No active session');
      }

      // Make a raw HTTP request to updateUser endpoint to ensure proper encoding
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Password update failed with status ${response.status}`);
      }

      // Password updated successfully
      // User remains logged in with the new password
      console.log('Password updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
