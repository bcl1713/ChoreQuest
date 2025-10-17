/**
 * Supabase Client Configuration for ChoreQuest
 * Provides typed client for database operations and authentication
 */

import { createClient } from '@supabase/supabase-js';

// Use internal URL when running on the server (Docker-to-Docker communication)
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

// Supabase configuration from environment variables
const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with typed database schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Suppress debug warnings for expected auth states (no session, invalid refresh token)
    debug: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'chorequest-web'
    },
    fetch: (input, init = {}) => {
      // Add keepalive for mobile browsers to prevent connection drops
      const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      const requestUrl = (() => {
        if (typeof input === 'string') return input;
        if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
        if (typeof (input as { url?: string })?.url === 'string') return (input as { url: string }).url;
        return String(input);
      })();
      const requestInit: RequestInit = {
        ...init,
        keepalive: isMobile,
      };

      const getLogLabel = () => {
        const { method = 'GET' } = requestInit;
        try {
          const parsed = new URL(requestUrl);
          return `${method} ${parsed.pathname}${parsed.search}`;
        } catch {
          return `${method} ${requestUrl}`;
        }
      };

      const logLabel = getLogLabel();
      const start = Date.now();

      console.log(`[${new Date().toISOString()}] Supabase fetch start: ${logLabel} keepalive=${requestInit.keepalive ? 'true' : 'false'}`);

      return fetch(input, requestInit)
        .then((response) => {
          const duration = Date.now() - start;
          console.log(`[${new Date().toISOString()}] Supabase fetch complete: ${logLabel} status=${response.status} duration=${duration}ms`);
          return response;
        })
        .catch((error) => {
          const duration = Date.now() - start;
          console.error(`[${new Date().toISOString()}] Supabase fetch error: ${logLabel} duration=${duration}ms`, error);
          throw error;
        });
    }
  }
});

// Database type definitions based on our schema
export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO';
          family_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO';
          family_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO';
          family_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          class: 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER';
          level: number;
          xp: number;
          gold: number;
          gems: number;
          honor_points: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          class?: 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER';
          level?: number;
          xp?: number;
          gold?: number;
          gems?: number;
          honor_points?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          class?: 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER';
          level?: number;
          xp?: number;
          gold?: number;
          gems?: number;
          honor_points?: number;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quest_instances: {
        Row: {
          id: string;
          title: string;
          description: string;
          xp_reward: number;
          gold_reward: number;
          difficulty: 'EASY' | 'MEDIUM' | 'HARD';
          category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE';
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED';
          assigned_to_id: string | null;
          created_by_id: string;
          family_id: string;
          template_id: string | null;
          due_date: string | null;
          completed_at: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          xp_reward: number;
          gold_reward: number;
          difficulty: 'EASY' | 'MEDIUM' | 'HARD';
          category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE';
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED';
          assigned_to_id?: string | null;
          created_by_id: string;
          family_id: string;
          template_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          xp_reward?: number;
          gold_reward?: number;
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
          category?: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE';
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED';
          assigned_to_id?: string | null;
          created_by_id?: string;
          family_id?: string;
          template_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string;
          type: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
          cost: number;
          family_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          type: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
          cost: number;
          family_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          type?: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
          cost?: number;
          family_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reward_redemptions: {
        Row: {
          id: string;
          user_id: string;
          reward_id: string;
          cost: number;
          status: string;
          requested_at: string;
          approved_at: string | null;
          approved_by: string | null;
          fulfilled_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          reward_id: string;
          cost: number;
          status?: string;
          requested_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          fulfilled_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          reward_id?: string;
          cost?: number;
          status?: string;
          requested_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          fulfilled_at?: string | null;
          notes?: string | null;
        };
      };
    };
  };
};

// Typed Supabase client
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

// Helper function to get typed client
export const getSupabaseClient = (): TypedSupabaseClient => {
  return supabase as TypedSupabaseClient;
};
