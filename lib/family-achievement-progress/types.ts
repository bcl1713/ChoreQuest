import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type {
  AchievementEventType,
  AchievementEvent,
} from "../achievement-progress/types";

export type { AchievementEventType, AchievementEvent };

export type FamilyMemberPair = {
  userId: string;
  characterIds: string[];
};

export type FamilyEvaluatorFn = (
  client: SupabaseClient<Database>,
  familyId: string,
  userIds: string[],
  characterIds: string[],
  allUserIds: string[],
  mode: "sum" | "all",
  memberPairs: FamilyMemberPair[],
  criteriaConfig: FamilyCriteriaConfig,
) => Promise<{ current: number }>;

export type FamilyCriteriaConfig = {
  threshold?: number;
  difficulty?: string;
  family_evaluation_mode?: "sum" | "all";
  [key: string]: unknown;
};

export type FetchedFamilyAchievement = {
  id: string;
  name: string;
  criteria_type: string;
  criteria_config: FamilyCriteriaConfig;
  xp_reward: number | null;
  gold_reward: number | null;
};

export type FamilyAchievementProgressRecord = {
  family_id: string;
  family_achievement_id: string;
  unlocked_at: string | null;
  progress: { current: number; threshold: number } | null;
  notified: boolean | null;
  family_achievement: {
    id: string;
    name: string;
    description: string;
    criteria_type: string;
    criteria_config: FamilyCriteriaConfig;
  };
};
