import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type {
  QuestInstance,
  QuestTemplate,
  Character,
} from "@/lib/types/database";
import { RewardCalculator } from "@/lib/reward-calculator";
import { StreakService } from "@/lib/streak-service";
import {
  validateConsecutiveCompletion,
  calculateStreakBonus,
} from "@/lib/streak-utils";

type ApproveQuestDeps = {
  client: SupabaseClient<Database>;
  streakService: StreakService;
};

const fetchQuest = async (
  client: SupabaseClient<Database>,
  questId: string,
) => {
  const { data: quest, error: fetchError } = await client
    .from("quest_instances")
    .select("*")
    .eq("id", questId)
    .single();

  if (fetchError || !quest) {
    throw new Error(
      `Failed to fetch quest: ${fetchError?.message || "Quest not found"}`,
    );
  }

  if (
    quest.status !== "CLAIMED" &&
    quest.status !== "IN_PROGRESS" &&
    quest.status !== "COMPLETED"
  ) {
    throw new Error(`Quest cannot be approved (status: ${quest.status})`);
  }

  if (!quest.assigned_to_id) {
    throw new Error("Quest is not assigned to a hero");
  }

  return quest;
};

const resolveAssignedCharacter = async (
  client: SupabaseClient<Database>,
  quest: QuestInstance,
): Promise<Character> => {
  if (quest.volunteered_by) {
    const result = await client
      .from("characters")
      .select("*")
      .eq("id", quest.volunteered_by)
      .single();
    if (result.error || !result.data) {
      throw new Error(
        `Failed to fetch assigned character: ${result.error?.message || "Character not found"}`,
      );
    }
    return result.data as Character;
  }

  if (!quest.assigned_to_id) {
    throw new Error("Quest has no assigned user");
  }

  const result = await client
    .from("characters")
    .select("*")
    .eq("user_id", quest.assigned_to_id)
    .order("created_at", { ascending: true });

  if (result.data && result.data.length > 0) {
    return result.data[0] as Character;
  }

  if (result.error) {
    throw new Error(
      `Failed to fetch assigned character: ${result.error.message}`,
    );
  }

  throw new Error("No characters found for assigned user");
};

const fetchTemplate = async (
  client: SupabaseClient<Database>,
  quest: QuestInstance,
): Promise<QuestTemplate | null> => {
  if (!quest.template_id) return null;

  const { data: templateData, error: templateError } = await client
    .from("quest_templates")
    .select("*")
    .eq("id", quest.template_id)
    .maybeSingle();

  if (templateError) {
    throw new Error(`Failed to fetch quest template: ${templateError.message}`);
  }

  return templateData ?? null;
};

const fetchFamilyTimezone = async (
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

const applyStreaks = async (
  streakService: StreakService,
  characterId: string,
  templateId: string | null,
  recurrencePattern: "DAILY" | "WEEKLY" | "CUSTOM" | null,
  completionDate: Date,
  familyTimezone: string,
  currentXp: number,
  currentGold: number,
  baseXp: number,
  baseGold: number,
) => {
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

export const approveQuest = async (
  deps: ApproveQuestDeps,
  questId: string,
): Promise<QuestInstance> => {
  const { client, streakService } = deps;

  const quest = await fetchQuest(client, questId);
  const character = await resolveAssignedCharacter(client, quest);
  const completionDate = quest.completed_at
    ? new Date(quest.completed_at)
    : new Date();
  const completionTimestamp = completionDate.toISOString();
  const template = await fetchTemplate(client, quest);

  const baseXp = quest.xp_reward ?? template?.xp_reward ?? 0;
  const baseGold = quest.gold_reward ?? template?.gold_reward ?? 0;

  let totalXp = baseXp;
  let totalGold = baseGold;

  if (
    quest.volunteer_bonus &&
    quest.volunteer_bonus > 0 &&
    quest.volunteered_by === character.id
  ) {
    totalXp += baseXp * quest.volunteer_bonus;
    totalGold += baseGold * quest.volunteer_bonus;
  }

  const templateIdForStreaks = template?.id ?? quest.template_id ?? null;
  const recurrencePattern = (quest.recurrence_pattern ??
    template?.recurrence_pattern ??
    null) as "DAILY" | "WEEKLY" | "CUSTOM" | null;

  const familyTimezone = await fetchFamilyTimezone(
    client,
    quest.family_id ?? null,
  );

  const streakResult = await applyStreaks(
    streakService,
    character.id,
    templateIdForStreaks,
    recurrencePattern,
    completionDate,
    familyTimezone,
    totalXp,
    totalGold,
    baseXp,
    baseGold,
  );

  const updatedXp = Math.round(streakResult.xp);
  const updatedGold = Math.round(streakResult.gold);

  const characterUpdatePayload: {
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
    characterUpdatePayload.level = levelResult.newLevel;
  }

  const { error: characterUpdateError } = await client
    .from("characters")
    .update(characterUpdatePayload)
    .eq("id", character.id);

  if (characterUpdateError) {
    throw new Error(
      `Failed to update character stats: ${characterUpdateError.message}`,
    );
  }

  const { data: approvedQuest, error: questUpdateError } = await client
    .from("quest_instances")
    .update({
      status: "APPROVED",
      completed_at: completionTimestamp,
      approved_at: new Date().toISOString(),
      streak_count: streakResult.streakCount,
      streak_bonus: streakResult.streakBonus,
    })
    .eq("id", questId)
    .select()
    .single();

  if (questUpdateError) {
    throw new Error(`Failed to approve quest: ${questUpdateError.message}`);
  }

  return approvedQuest as QuestInstance;
};
