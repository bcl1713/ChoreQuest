// Supabase generated types for the ChoreQuest database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      quest_instances: {
        Row: {
          approved_at: string | null
          assigned_to_id: string | null
          category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE'
          completed_at: string | null
          created_at: string | null
          created_by_id: string
          description: string
          difficulty: 'EASY' | 'MEDIUM' | 'HARD'
          due_date: string | null
          family_id: string | null
          gold_reward: number
          id: string
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED' | null
          template_id: string | null
          title: string
          updated_at: string | null
          xp_reward: number
        }
        Insert: {
          approved_at?: string | null
          assigned_to_id?: string | null
          category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE'
          completed_at?: string | null
          created_at?: string | null
          created_by_id: string
          description: string
          difficulty: 'EASY' | 'MEDIUM' | 'HARD'
          due_date?: string | null
          family_id?: string | null
          gold_reward: number
          id?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED' | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          xp_reward: number
        }
        Update: {
          approved_at?: string | null
          assigned_to_id?: string | null
          category?: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE'
          completed_at?: string | null
          created_at?: string | null
          created_by_id?: string
          description?: string
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
          due_date?: string | null
          family_id?: string | null
          gold_reward?: number
          id?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED' | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          xp_reward?: number
        }
      }
    }
    Enums: {
      quest_category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE'
      quest_difficulty: 'EASY' | 'MEDIUM' | 'HARD'
      quest_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED'
    }
  }
}

// Convenience type aliases
export type QuestInstance = Database['public']['Tables']['quest_instances']['Row']
export type QuestDifficulty = Database['public']['Enums']['quest_difficulty']
export type QuestStatus = Database['public']['Enums']['quest_status']
export type QuestCategory = Database['public']['Enums']['quest_category']