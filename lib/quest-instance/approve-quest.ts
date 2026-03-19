import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type {
  QuestInstance,
  QuestTemplate,
  Character,
} from "@/lib/types/database";
import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { StreakService } from "@/lib/streak-service";
import { AchievementProgressService } from "@/lib/achievement-progress-service";
import {
  applyStreaks,
  buildCharacterUpdatePayload,
  fetchFamilyTimezone,
} from "./approve-quest-helpers";

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

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new AppError(
      `Failed to fetch quest: ${fetchError.message}`,
      500,
      "QUEST_FETCH_FAILED",
    );
  }

  if (!quest) {
    throw new NotFoundError("Quest not found", "QUEST_NOT_FOUND");
  }

  if (
    quest.status !== "CLAIMED" &&
    quest.status !== "IN_PROGRESS" &&
    quest.status !== "COMPLETED"
  ) {
    throw new ConflictError(
      `Quest cannot be approved (status: ${quest.status})`,
      "QUEST_NOT_APPROVABLE",
    );
  }

  if (!quest.assigned_to_id) {
    throw new ConflictError(
      "Quest is not assigned to a hero",
      "QUEST_NOT_ASSIGNED",
    );
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
    if (result.error) {
      throw new AppError(
        `Failed to fetch assigned character: ${result.error.message}`,
        500,
        "CHARACTER_FETCH_FAILED",
      );
    }
    if (!result.data) {
      throw new NotFoundError("Character not found", "CHARACTER_NOT_FOUND");
    }
    return result.data as Character;
  }

  if (!quest.assigned_to_id) {
    throw new ConflictError("Quest has no assigned user", "QUEST_NOT_ASSIGNED");
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
    throw new AppError(
      `Failed to fetch assigned character: ${result.error.message}`,
      500,
      "CHARACTER_FETCH_FAILED",
    );
  }

  throw new NotFoundError(
    "No characters found for assigned user",
    "CHARACTER_NOT_FOUND",
  );
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
    throw new AppError(
      `Failed to fetch quest template: ${templateError.message}`,
      500,
      "QUEST_TEMPLATE_FETCH_FAILED",
    );
  }

  return templateData ?? null;
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
  const characterUpdatePayload = buildCharacterUpdatePayload(
    character,
    updatedXp,
    updatedGold,
  );

  const { error: characterUpdateError } = await client
    .from("characters")
    .update(characterUpdatePayload)
    .eq("id", character.id);

  if (characterUpdateError) {
    throw new AppError(
      `Failed to update character stats: ${characterUpdateError.message}`,
      500,
      "CHARACTER_UPDATE_FAILED",
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
    throw new AppError(
      `Failed to approve quest: ${questUpdateError.message}`,
      500,
      "QUEST_APPROVE_FAILED",
    );
  }

  try {
    const progressService = new AchievementProgressService(client);
    await progressService.updateProgress(character.id, {
      type: "QUEST_APPROVED",
    });
  } catch (progressError) {
    console.error(
      "Achievement progress update failed after quest approval (non-blocking):",
      progressError,
    );
  }

  return approvedQuest as QuestInstance;
};
