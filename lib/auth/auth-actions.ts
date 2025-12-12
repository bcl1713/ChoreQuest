import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { Database } from '@/lib/types/database-generated';

type Credentials = { email: string; password: string };
type RegisterInput = { name: string; email: string; password: string; familyCode: string };

export const loginUser = async (
  supabase: SupabaseClient<Database>,
  credentials: Credentials,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void
) => {
  setError(null);
  setIsLoading(true);
  try {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
  } finally {
    setIsLoading(false);
  }
};

export const registerUser = async (
  supabase: SupabaseClient<Database>,
  data: RegisterInput,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void
) => {
  setError(null);
  setIsLoading(true);

  try {
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('id, name, code')
      .eq('code', data.familyCode)
      .single();

    if (familyError || !familyData) {
      throw new Error('Invalid family code');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user account');
    }

    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: 'YOUNG_HERO',
      family_id: familyData.id,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    setError(message);
    throw err;
  } finally {
    setIsLoading(false);
  }
};

export const updatePasswordFlow = async (
  supabase: SupabaseClient<Database>,
  user: { email?: string | null } | null,
  currentPassword: string,
  newPassword: string,
  setError: (value: string | null) => void,
  setIsLoading: (value: boolean) => void
) => {
  setError(null);
  setIsLoading(true);

  try {
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error('No active session');
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentSession.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Password update failed with status ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Password update failed';
    setError(message);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
