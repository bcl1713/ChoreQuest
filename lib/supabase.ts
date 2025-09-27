/**
 * Supabase Client Configuration for ChoreQuest
 * Provides typed client for database operations and authentication
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
    detectSessionInUrl: true
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