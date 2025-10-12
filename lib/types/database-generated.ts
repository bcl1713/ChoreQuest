export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_url: string | null
          condition: Json
          created_at: string | null
          description: string
          gem_reward: number | null
          gold_reward: number | null
          id: string
          name: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          badge_url?: string | null
          condition: Json
          created_at?: string | null
          description: string
          gem_reward?: number | null
          gold_reward?: number | null
          id?: string
          name: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          badge_url?: string | null
          condition?: Json
          created_at?: string | null
          description?: string
          gem_reward?: number | null
          gold_reward?: number | null
          id?: string
          name?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      boss_battle_participants: {
        Row: {
          boss_battle_id: string | null
          created_at: string | null
          damage_dealt: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          boss_battle_id?: string | null
          created_at?: string | null
          damage_dealt?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          boss_battle_id?: string | null
          created_at?: string | null
          damage_dealt?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boss_battle_participants_boss_battle_id_fkey"
            columns: ["boss_battle_id"]
            isOneToOne: false
            referencedRelation: "boss_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_battle_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_battles: {
        Row: {
          created_at: string | null
          current_hp: number
          description: string
          end_date: string
          family_id: string | null
          gem_reward: number | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["boss_battle_status"] | null
          total_hp: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_hp: number
          description: string
          end_date: string
          family_id?: string | null
          gem_reward?: number | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["boss_battle_status"] | null
          total_hp: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_hp?: number
          description?: string
          end_date?: string
          family_id?: string | null
          gem_reward?: number | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["boss_battle_status"] | null
          total_hp?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boss_battles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      character_quest_streaks: {
        Row: {
          character_id: string
          created_at: string | null
          current_streak: number | null
          id: string
          last_completed_date: string | null
          longest_streak: number | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_quest_streaks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_quest_streaks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quest_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          active_family_quest_id: string | null
          avatar_url: string | null
          class: Database["public"]["Enums"]["character_class"] | null
          created_at: string | null
          gems: number | null
          gold: number | null
          honor_points: number | null
          id: string
          level: number | null
          name: string
          updated_at: string | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          active_family_quest_id?: string | null
          avatar_url?: string | null
          class?: Database["public"]["Enums"]["character_class"] | null
          created_at?: string | null
          gems?: number | null
          gold?: number | null
          honor_points?: number | null
          id?: string
          level?: number | null
          name: string
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          active_family_quest_id?: string | null
          avatar_url?: string | null
          class?: Database["public"]["Enums"]["character_class"] | null
          created_at?: string | null
          gems?: number | null
          gold?: number | null
          honor_points?: number | null
          id?: string
          level?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_active_family_quest_id_fkey"
            columns: ["active_family_quest_id"]
            isOneToOne: false
            referencedRelation: "quest_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          week_start_day: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          week_start_day?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          week_start_day?: number | null
        }
        Relationships: []
      }
      quest_instances: {
        Row: {
          approved_at: string | null
          assigned_to_id: string | null
          category: Database["public"]["Enums"]["quest_category"]
          completed_at: string | null
          created_at: string | null
          created_by_id: string
          cycle_end_date: string | null
          cycle_start_date: string | null
          description: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          due_date: string | null
          family_id: string | null
          gold_reward: number
          id: string
          quest_type: Database["public"]["Enums"]["quest_type"] | null
          status: Database["public"]["Enums"]["quest_status"] | null
          streak_bonus: number | null
          streak_count: number | null
          template_id: string | null
          title: string
          updated_at: string | null
          volunteer_bonus: number | null
          volunteered_by: string | null
          xp_reward: number
        }
        Insert: {
          approved_at?: string | null
          assigned_to_id?: string | null
          category: Database["public"]["Enums"]["quest_category"]
          completed_at?: string | null
          created_at?: string | null
          created_by_id: string
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          description: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          due_date?: string | null
          family_id?: string | null
          gold_reward: number
          id?: string
          quest_type?: Database["public"]["Enums"]["quest_type"] | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          streak_bonus?: number | null
          streak_count?: number | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          volunteer_bonus?: number | null
          volunteered_by?: string | null
          xp_reward: number
        }
        Update: {
          approved_at?: string | null
          assigned_to_id?: string | null
          category?: Database["public"]["Enums"]["quest_category"]
          completed_at?: string | null
          created_at?: string | null
          created_by_id?: string
          cycle_end_date?: string | null
          cycle_start_date?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          due_date?: string | null
          family_id?: string | null
          gold_reward?: number
          id?: string
          quest_type?: Database["public"]["Enums"]["quest_type"] | null
          status?: Database["public"]["Enums"]["quest_status"] | null
          streak_bonus?: number | null
          streak_count?: number | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          volunteer_bonus?: number | null
          volunteered_by?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_instances_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_instances_volunteered_by_fkey"
            columns: ["volunteered_by"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_templates: {
        Row: {
          assigned_character_ids: string[] | null
          category: Database["public"]["Enums"]["quest_category"]
          class_bonuses: Json | null
          created_at: string | null
          description: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          family_id: string | null
          gold_reward: number
          id: string
          is_active: boolean | null
          is_paused: boolean | null
          quest_type: Database["public"]["Enums"]["quest_type"] | null
          recurrence_pattern:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          title: string
          updated_at: string | null
          xp_reward: number
        }
        Insert: {
          assigned_character_ids?: string[] | null
          category: Database["public"]["Enums"]["quest_category"]
          class_bonuses?: Json | null
          created_at?: string | null
          description: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          family_id?: string | null
          gold_reward: number
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          quest_type?: Database["public"]["Enums"]["quest_type"] | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          title: string
          updated_at?: string | null
          xp_reward: number
        }
        Update: {
          assigned_character_ids?: string[] | null
          category?: Database["public"]["Enums"]["quest_category"]
          class_bonuses?: Json | null
          created_at?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          family_id?: string | null
          gold_reward?: number
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          quest_type?: Database["public"]["Enums"]["quest_type"] | null
          recurrence_pattern?:
            | Database["public"]["Enums"]["recurrence_pattern"]
            | null
          title?: string
          updated_at?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cost: number
          fulfilled_at: string | null
          id: string
          notes: string | null
          requested_at: string | null
          reward_description: string | null
          reward_id: string | null
          reward_name: string | null
          reward_type: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cost: number
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          reward_description?: string | null
          reward_id?: string | null
          reward_name?: string | null
          reward_type?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cost?: number
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          reward_description?: string | null
          reward_id?: string | null
          reward_name?: string | null
          reward_type?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost: number
          created_at: string | null
          description: string
          family_id: string | null
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["reward_type"]
          updated_at: string | null
        }
        Insert: {
          cost: number
          created_at?: string | null
          description: string
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["reward_type"]
          updated_at?: string | null
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["reward_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_requests: {
        Row: {
          created_at: string | null
          description: string
          helper_id: string | null
          honor_reward: number | null
          id: string
          is_resolved: boolean | null
          requester_id: string | null
          resolved_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          helper_id?: string | null
          honor_reward?: number | null
          id?: string
          is_resolved?: boolean | null
          requester_id?: string | null
          resolved_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          helper_id?: string | null
          honor_reward?: number | null
          id?: string
          is_resolved?: boolean | null
          requester_id?: string | null
          resolved_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_requests_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          description: string
          gems_change: number | null
          gold_change: number | null
          honor_change: number | null
          id: string
          related_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
          xp_change: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          gems_change?: number | null
          gold_change?: number | null
          honor_change?: number | null
          id?: string
          related_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          xp_change?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          gems_change?: number | null
          gold_change?: number | null
          honor_change?: number | null
          id?: string
          related_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          xp_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          family_id: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          family_id?: string | null
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          family_id?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_profile_policies: {
        Args: { test_user_id: string }
        Returns: Json
      }
      get_user_family_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_user_profile_insert: {
        Args: {
          test_email: string
          test_family_id: string
          test_name: string
          test_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      boss_battle_status: "ACTIVE" | "DEFEATED" | "EXPIRED"
      character_class: "KNIGHT" | "MAGE" | "RANGER" | "ROGUE" | "HEALER"
      quest_category: "DAILY" | "WEEKLY" | "BOSS_BATTLE"
      quest_difficulty: "EASY" | "MEDIUM" | "HARD"
      quest_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "APPROVED"
        | "EXPIRED"
        | "AVAILABLE"
        | "CLAIMED"
        | "MISSED"
      quest_type: "INDIVIDUAL" | "FAMILY"
      recurrence_pattern: "DAILY" | "WEEKLY" | "CUSTOM"
      reward_type: "SCREEN_TIME" | "PRIVILEGE" | "PURCHASE" | "EXPERIENCE"
      transaction_type:
        | "QUEST_REWARD"
        | "BOSS_VICTORY"
        | "STORE_PURCHASE"
        | "REWARD_REFUND"
        | "BONUS_AWARD"
        | "SOS_HELP"
      user_role: "GUILD_MASTER" | "HERO" | "YOUNG_HERO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      boss_battle_status: ["ACTIVE", "DEFEATED", "EXPIRED"],
      character_class: ["KNIGHT", "MAGE", "RANGER", "ROGUE", "HEALER"],
      quest_category: ["DAILY", "WEEKLY", "BOSS_BATTLE"],
      quest_difficulty: ["EASY", "MEDIUM", "HARD"],
      quest_status: [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "APPROVED",
        "EXPIRED",
        "AVAILABLE",
        "CLAIMED",
        "MISSED",
      ],
      quest_type: ["INDIVIDUAL", "FAMILY"],
      recurrence_pattern: ["DAILY", "WEEKLY", "CUSTOM"],
      reward_type: ["SCREEN_TIME", "PRIVILEGE", "PURCHASE", "EXPERIENCE"],
      transaction_type: [
        "QUEST_REWARD",
        "BOSS_VICTORY",
        "STORE_PURCHASE",
        "REWARD_REFUND",
        "BONUS_AWARD",
        "SOS_HELP",
      ],
      user_role: ["GUILD_MASTER", "HERO", "YOUNG_HERO"],
    },
  },
} as const

