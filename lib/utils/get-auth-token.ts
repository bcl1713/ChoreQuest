import { supabase } from "@/lib/supabase";

/**
 * Fetches the current auth token, refreshing the session if needed.
 * Returns null if no authenticated session exists.
 */
export async function getAuthToken(): Promise<string | null> {
  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) {
    ({ data: sessionData } = await supabase.auth.refreshSession());
  }
  return sessionData?.session?.access_token ?? null;
}
