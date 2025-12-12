import { MutableRefObject } from 'react';
import { Session } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { Family, UserProfile } from '@/lib/types/database';

type LoadUserDataParams = {
  userId: string;
  authSession?: Session | null;
  sessionAccessToken?: string | null;
  waitForReady: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  setFamily: (family: Family | null) => void;
  prevUserIdRef: MutableRefObject<string | null>;
  isLoadingUserDataRef: MutableRefObject<boolean>;
  setIsLoading: (value: boolean) => void;
};

const buildHeaders = (accessToken: string) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
});

const fetchSingleRow = async <T>(url: URL, headers: Record<string, string>) => {
  const response = await fetch(url.toString(), { headers, cache: 'no-store' });
  if (response.status === 406 || response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }
  const rows = await response.json();
  return (Array.isArray(rows) ? rows[0] : rows) ?? null as T | null;
};

export const loadUserData = async ({
  userId,
  authSession,
  sessionAccessToken,
  waitForReady,
  setProfile,
  setFamily,
  prevUserIdRef,
  isLoadingUserDataRef,
  setIsLoading,
}: LoadUserDataParams) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] AuthContext: loadUserData called for userId:`, userId);

  if (isLoadingUserDataRef.current) {
    console.log(`[${timestamp}] AuthContext: loadUserData skipped - already loading for user:`, userId);
    return;
  }

  if (prevUserIdRef.current === userId) {
    console.log(`[${timestamp}] AuthContext: loadUserData skipped - data already loaded for user:`, userId);
    return;
  }

  await waitForReady();
  isLoadingUserDataRef.current = true;

  try {
    const accessToken = authSession?.access_token ?? sessionAccessToken ?? null;
    if (!accessToken) {
      console.warn('AuthContext: No access token available for loadUserData, skipping fetch');
      return;
    }

    const headers = buildHeaders(accessToken);

    const profileUrl = new URL('/rest/v1/user_profiles', SUPABASE_URL);
    profileUrl.searchParams.set('select', '*');
    profileUrl.searchParams.set('id', `eq.${userId}`);
    const profileData = await fetchSingleRow<UserProfile>(profileUrl, headers);

    if (!profileData) {
      console.warn('AuthContext: Profile response empty for user, clearing state');
      setProfile(null);
      setFamily(null);
      return;
    }

    setProfile(profileData);

    const familyUrl = new URL('/rest/v1/families', SUPABASE_URL);
    familyUrl.searchParams.set('select', '*');
    familyUrl.searchParams.set('id', `eq.${profileData.family_id}`);
    const familyData = await fetchSingleRow<Family>(familyUrl, headers);

    if (!familyData) {
      console.warn('AuthContext: Family response empty, clearing state');
      setFamily(null);
      return;
    }

    setFamily(familyData);
    prevUserIdRef.current = userId;
  } catch (err) {
    console.error('AuthContext: Error loading user data:', err);
  } finally {
    isLoadingUserDataRef.current = false;
    setIsLoading(false);
  }
};
