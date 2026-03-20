import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";

export type AchievementEventType =
  | "QUEST_APPROVED"
  | "REWARD_APPROVED"
  | "BOSS_COMPLETED"
  | "CLASS_CHANGED";

export type AchievementEvent = {
  type: AchievementEventType;
};

export type CriteriaConfig = {
  threshold?: number;
  difficulty?: string;
  [key: string]: unknown;
};

export type EvaluatorFn = (
  client: SupabaseClient<Database>,
  characterId: string,
  userId: string,
  criteriaConfig?: CriteriaConfig,
) => Promise<{ current: number }>;

export type AchievementProgressRecord = {
  character_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: { current: number; threshold: number } | null;
  notified: boolean | null;
  achievement: {
    id: string;
    name: string;
    description: string;
    criteria_type: string;
    criteria_config: CriteriaConfig;
  };
};
