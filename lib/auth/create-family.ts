import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database-generated';

type CreateFamilyParams = {
  data: { name: string; email: string; password: string; userName: string };
  supabase: SupabaseClient<Database>;
  setError: (error: string | null) => void;
  setIsLoading: (value: boolean) => void;
  setIsCreatingFamily: (value: boolean) => void;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  loadUserData: (userId: string, session: Session | null) => Promise<void>;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createProfileWithRole = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  data: { email: string; userName: string; familyId: string }
) => {
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: data.email,
      name: data.userName,
      role: 'GUILD_MASTER',
      family_id: data.familyId,
    })
    .select()
    .single();

  if (profileError) {
    console.error('Failed to create user profile:', profileError);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  return profileData;
};

export const createFamilyFlow = async ({
  data,
  supabase,
  setError,
  setIsLoading,
  setIsCreatingFamily,
  setSession,
  setUser,
  loadUserData,
}: CreateFamilyParams) => {
  setError(null);
  setIsLoading(true);
  setIsCreatingFamily(true);

  try {
    const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user account');
    }

    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        throw new Error(`Sign in failed: ${signInError.message}`);
      }
    }

    await delay(1000);

    const { data: currentUserData } = await supabase.auth.getUser();
    const currentUser = currentUserData?.user;
    if (!currentUser) {
      throw new Error('User authentication not established properly');
    }

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name: data.name,
        code: familyCode,
        timezone: detectedTimezone,
      })
      .select()
      .single();

    if (familyError || !familyData) {
      throw new Error(`Family creation failed: ${familyError?.message || 'Unknown error'}`);
    }

    await createProfileWithRole(supabase, authData.user.id, {
      email: data.email,
      userName: data.userName,
      familyId: familyData.id,
    });

    let profileVerified = false;
    for (let attempt = 0; attempt < 3 && !profileVerified; attempt++) {
      const { data: verifyData, error: verifyError } = await supabase
        .from('user_profiles')
        .select('id, name, role, family_id')
        .eq('id', authData.user.id)
        .single();

      if (verifyData && !verifyError) {
        profileVerified = true;
      } else if (attempt < 2) {
        await delay(1000);
      }
    }

    if (!profileVerified) {
      throw new Error('Profile creation verification failed. Please try again.');
    }

    setIsCreatingFamily(false);

    const { data: sessionData } = await supabase.auth.getSession();
    const finalSession = sessionData?.session;
    if (finalSession) {
      setSession(finalSession);
      setUser(finalSession.user);
      await loadUserData(finalSession.user.id, finalSession);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Family creation failed';
    setError(message);
    setIsCreatingFamily(false);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
