/**
 * Server-side Supabase helpers
 *
 * Provides helpers for creating Supabase clients that prefer the internal
 * Docker network URL when available, ensuring reliable communication between
 * containers regardless of the public URL exposed to browsers.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const resolveServerSupabaseUrl = (): string => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  const internalUrl = !isTest ? process.env.SUPABASE_INTERNAL_URL : undefined;
  const serverUrl = process.env.SUPABASE_URL;
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (internalUrl) return internalUrl;
  if (serverUrl) return serverUrl;
  if (publicUrl) return publicUrl;

  throw new Error('Missing Supabase URL (SUPABASE_INTERNAL_URL or NEXT_PUBLIC_SUPABASE_URL)');
};

const getAnonKey = (): string => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return anonKey;
};

const getServiceRoleKey = (): string => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return serviceKey;
};

/**
 * Create a Supabase client for authenticated user operations on the server.
 * Optionally include a user access token for row-level security enforcement.
 */
export const createServerSupabaseClient = (
  accessToken?: string
): SupabaseClient<Database> => {
  const url = resolveServerSupabaseUrl();
  const anonKey = getAnonKey();

  return createClient<Database>(url, anonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
};

/**
 * Create a Supabase client using the service role key for privileged operations.
 */
export const createServiceSupabaseClient = (): SupabaseClient<Database> => {
  const url = resolveServerSupabaseUrl();
  const serviceKey = getServiceRoleKey();

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
