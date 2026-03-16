import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { Character } from "@/lib/types/database";
import { RewardCalculator } from "@/lib/reward-calculator";
import { StreakService } from "@/lib/streak-service";
import {
  validateConsecutiveCompletion,
  calculateStreakBonus,
} from "@/lib/streak-utils";

type RecurrencePattern = "DAILY" | "WEEKLY" | "CUSTOM" | null;

type StreakResult = {
  streakCount: number;
  streakBonus: number;
  xp: number;
  gold: number;
};

export const fetchFamilyTimezone = async (
  client: SupabaseClient<Database>,
  familyId: string | null,
) => {
  if (!familyId) return "UTC";

  const { data: family } = await client
    .from("families")
    .select("timezone")
    .eq("id", familyId)
    .maybeSingle();

  return family?.timezone ?? "UTC";
};

export const applyStreaks = async (
  streakService: StreakService,
  characterId: string,
  templateId: string | null,
  recurrencePattern: RecurrencePattern,
  completionDate: Date,
  familyTimezone: string,
  currentXp: number,
  currentGold: number,
  baseXp: number,
  baseGold: number,
): Promise<StreakResult> => {
  if (!templateId || !recurrencePattern) {
    return { streakCount: 0, streakBonus: 0, xp: currentXp, gold: currentGold };
  }

  const streak = await streakService.getStreak(characterId, templateId);
  const isConsecutive = validateConsecutiveCompletion(
    streak.last_completed_date,
    recurrencePattern,
    completionDate,
    familyTimezone,
  );

  if (isConsecutive) {
    const updatedStreak = await streakService.incrementStreak(
      characterId,
      templateId,
      completionDate,
    );
    const streakCount = updatedStreak.current_streak ?? 0;
    const streakBonus = calculateStreakBonus(streakCount);

    return {
      streakCount,
      streakBonus,
      xp: currentXp + baseXp * streakBonus,
      gold: currentGold + baseGold * streakBonus,
    };
  }

  const resetStreak = await streakService.resetStreak(characterId, templateId);

  return {
    streakCount: resetStreak.current_streak ?? 0,
    streakBonus: 0,
    xp: currentXp,
    gold: currentGold,
  };
};

export const buildCharacterUpdatePayload = (
  character: Character,
  updatedXp: number,
  updatedGold: number,
) => {
  const payload: {
    gold: number;
    xp: number;
    active_family_quest_id: null;
    level?: number;
  } = {
    gold: (character.gold || 0) + updatedGold,
    xp: (character.xp || 0) + updatedXp,
    active_family_quest_id: null,
  };

  const levelResult = RewardCalculator.calculateLevelUp(
    character.xp || 0,
    updatedXp,
    character.level || 1,
  );

  if (levelResult) {
    payload.level = levelResult.newLevel;
  }

  return payload;
};
