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

export type CompoundCondition = {
  criteria_type: string;
  threshold?: number;
  boolean?: boolean;
};

export type CompoundConditionResult = {
  criteria_type: string;
  current: number;
  threshold: number;
  met: boolean;
};

export type StandardProgress = {
  current: number;
  threshold: number;
};

export type CompoundProgress = {
  conditions: CompoundConditionResult[];
  met: boolean;
};

export type AchievementProgressValue = StandardProgress | CompoundProgress;

export type CriteriaConfig = {
  threshold?: number;
  difficulty?: string;
  evaluation_strategy?: string;
  operator?: "AND" | "OR";
  conditions?: CompoundCondition[];
  boolean?: boolean;
  [key: string]: unknown;
};

export type EvaluatorResult = {
  current: number;
  compoundConditions?: CompoundConditionResult[];
  compoundMet?: boolean;
};

export type EvaluatorFn = (
  client: SupabaseClient<Database>,
  characterId: string,
  userId: string,
  criteriaConfig?: CriteriaConfig,
) => Promise<EvaluatorResult>;

export type AchievementProgressRecord = {
  character_id: string;
  achievement_id: string;
  unlocked_at: string | null;
  progress: AchievementProgressValue | null;
  notified: boolean | null;
  achievement: {
    id: string;
    name: string;
    description: string;
    criteria_type: string;
    criteria_config: CriteriaConfig;
  };
};
