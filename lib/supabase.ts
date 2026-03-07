/**
 * Supabase client configuration for ChoreQuest.
 * Uses generated database types for fully-typed queries.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database-generated';

const resolveSupabaseUrl = () => {
  const isServer = typeof window === 'undefined';
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

  if (isServer) {
    if (!isTest && process.env.SUPABASE_INTERNAL_URL) {
      return process.env.SUPABASE_INTERNAL_URL;
    }

    return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  return process.env.NEXT_PUBLIC_SUPABASE_URL;
};

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'chorequest-web',
    },
    fetch: (input, init = {}) => {
      const requestInit: RequestInit = { ...init };

      // keepalive causes hangs on some mobile Chromium builds; disable it there.
      if (typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        delete requestInit.keepalive;
      }

      return fetch(input, requestInit);
    },
  },
});
