/**
 * Recurring Quest Generator Service
 *
 * Handles the core logic for generating recurring quest instances
 * from quest templates.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database-generated';
import {
  getStartOfDayInTimezone,
  getEndOfDayInTimezone,
  getStartOfWeekInTimezone,
  getEndOfWeekInTimezone,
} from './timezone-utils';

const TEST_INTERVAL_MINUTES_ENV = process.env.RECURRING_TEST_INTERVAL_MINUTES;
const TEST_INTERVAL_MINUTES = TEST_INTERVAL_MINUTES_ENV
  ? Number.parseInt(TEST_INTERVAL_MINUTES_ENV, 10)
  : null;

type QuestTemplate = Database['public']['Tables']['quest_templates']['Row'];

// Type definitions for database queries that may not yet be in generated types
interface ExpiredQuest {
  id: string;
  template_id: string | null;
  assigned_to_id: string | null;
  quest_type: 'INDIVIDUAL' | 'FAMILY';
  status: string;
}

interface FamilyRow {
  id: string;
  week_start_day: number | null;
  timezone: string | null;
}

interface TemplateRow {
  id: string;
  is_paused: boolean;
}

interface QuestTemplateWithAssignments extends QuestTemplate {
  assigned_character_ids: string[];
  quest_type: 'INDIVIDUAL' | 'FAMILY';
  recurrence_pattern: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  family_id: string;
  created_at: string;
}

interface GenerationResult {
  success: boolean;
  generated: {
    individual: number;
    family: number;
    total: number;
  };
  errors: string[];
}

/**
 * Calculate cycle dates based on recurrence pattern in a specific timezone
 */
function calculateCycleDates(
  recurrencePattern: string,
  timezone: string = 'UTC',
  weekStartDay: number = 0
): { cycleStart: Date; cycleEnd: Date } {
  const now = new Date();

  if (TEST_INTERVAL_MINUTES && TEST_INTERVAL_MINUTES > 0) {
    const interval = Math.max(TEST_INTERVAL_MINUTES, 1);
    const cycleStart = new Date(now);
    const minutes = cycleStart.getMinutes();
    const alignedMinutes = Math.floor(minutes / interval) * interval;
    cycleStart.setMinutes(alignedMinutes, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMinutes(cycleEnd.getMinutes() + interval);
    cycleEnd.setMilliseconds(cycleEnd.getMilliseconds() - 1);

    return { cycleStart, cycleEnd };
  }

  if (recurrencePattern === 'DAILY') {
    // Daily: midnight to midnight in family's timezone
    const cycleStart = getStartOfDayInTimezone(now, timezone);
    const cycleEnd = getEndOfDayInTimezone(now, timezone);

    return { cycleStart, cycleEnd };
  } else if (recurrencePattern === 'WEEKLY') {
    // Weekly: start of week to end of week in family's timezone
    const cycleStart = getStartOfWeekInTimezone(now, timezone, weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    const cycleEnd = getEndOfWeekInTimezone(now, timezone, weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);

    return { cycleStart, cycleEnd };
  }

  // CUSTOM: default to daily for now
  // TODO: Implement custom patterns in future
  return calculateCycleDates('DAILY', timezone, weekStartDay);
}

/**
 * Check if a quest instance already exists for the current cycle
 */
async function questExistsForCycle(
  supabase: SupabaseClient<Database>,
  templateId: string,
  cycleStart: Date,
  cycleEnd: Date,
  characterId?: string
): Promise<boolean> {
  let query = supabase
    .from('quest_instances')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .gte('cycle_start_date', cycleStart.toISOString())
    .lte('cycle_start_date', cycleEnd.toISOString());

  // For INDIVIDUAL quests, check for specific character
  if (characterId) {
    query = query.eq('assigned_to_id', characterId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error checking for existing quest:', error);
    return false; // Assume doesn't exist if error (fail-safe)
  }

  return (count ?? 0) > 0;
}

/**
 * Generate INDIVIDUAL quest instances
 */
async function generateIndividualQuests(
  supabase: SupabaseClient<Database>,
  template: QuestTemplate & { assigned_character_ids: string[] },
  cycleStart: Date,
  cycleEnd: Date,
  gmUserId: string
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  const characterIds = template.assigned_character_ids || [];

  if (characterIds.length === 0) {
    // Silently skip templates with no assigned characters - this is a valid state
    return { count, errors };
  }

  // Get character details to find user_id
  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('id, user_id')
    .in('id', characterIds);

  if (charError) {
    errors.push(`Failed to fetch characters for template ${template.id}: ${charError.message}`);
    return { count, errors };
  }

  for (const character of characters || []) {
    if (!character.user_id) {
      errors.push(`Character ${character.id} has no user_id`);
      continue;
    }

    // Check if quest already exists for this character in this cycle (idempotency)
    const exists = await questExistsForCycle(
      supabase,
      template.id,
      cycleStart,
      cycleEnd,
      character.user_id
    );

    if (exists) {
      // Quest already exists (idempotency)
      continue;
    }

    // Create quest instance
    const questInstance = {
      template_id: template.id,
      recurrence_pattern: template.recurrence_pattern,
      title: template.title,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      xp_reward: template.xp_reward,
      gold_reward: template.gold_reward,
      family_id: template.family_id,
      created_by_id: gmUserId, // System user or first GM
      assigned_to_id: character.user_id,
      status: 'PENDING' as const,
      quest_type: 'INDIVIDUAL' as const,
      cycle_start_date: cycleStart.toISOString(),
      cycle_end_date: cycleEnd.toISOString(),
      volunteer_bonus: 0,
      streak_count: 0,
      streak_bonus: 0,
    };

    const { error: insertError } = await supabase
      .from('quest_instances')
      .insert(questInstance);

    if (insertError) {
      errors.push(
        `Failed to create quest for character ${character.id}: ${insertError.message}`
      );
    } else {
      count++;
    }
  }

  return { count, errors };
}

/**
 * Generate FAMILY quest instances
 */
async function generateFamilyQuest(
  supabase: SupabaseClient<Database>,
  template: QuestTemplate,
  cycleStart: Date,
  cycleEnd: Date,
  gmUserId: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];

  // Check if quest already exists for this family in this cycle (idempotency)
  const exists = await questExistsForCycle(
    supabase,
    template.id,
    cycleStart,
    cycleEnd
  );

  if (exists) {
    // Quest already exists (idempotency)
    return { count: 0, errors };
  }

  // Create family quest instance in AVAILABLE status
  const questInstance = {
    template_id: template.id,
    recurrence_pattern: template.recurrence_pattern,
    title: template.title,
    description: template.description,
    category: template.category,
    difficulty: template.difficulty,
    xp_reward: template.xp_reward,
    gold_reward: template.gold_reward,
    family_id: template.family_id,
    created_by_id: gmUserId,
    assigned_to_id: null, // Not assigned until claimed
    status: 'AVAILABLE' as const, // Family quests start as AVAILABLE
    quest_type: 'FAMILY' as const,
    cycle_start_date: cycleStart.toISOString(),
    cycle_end_date: cycleEnd.toISOString(),
    volunteer_bonus: 0, // Set when claimed
    streak_count: 0,
    streak_bonus: 0,
  };

  const { error: insertError } = await supabase
    .from('quest_instances')
    .insert(questInstance);

  if (insertError) {
    errors.push(`Failed to create family quest: ${insertError.message}`);
    return { count: 0, errors };
  }

  return { count: 1, errors };
}

/**
 * Reset streak for a character and template
 */
async function resetStreak(
  supabase: SupabaseClient<Database>,
  characterId: string,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from('character_quest_streaks')
    .update({ current_streak: 0 })
    .eq('character_id', characterId)
    .eq('template_id', templateId);

  if (error) {
    console.error(
      `Failed to reset streak for character ${characterId}, template ${templateId}:`,
      error
    );
  }
}

/**
 * Expire quests and break streaks
 */
export interface ExpirationResult {
  success: boolean;
  expired: {
    individual: number;
    family: number;
    total: number;
  };
  streaksBroken: number;
  errors: string[];
}

export async function expireQuests(
  supabase: SupabaseClient<Database>
): Promise<ExpirationResult> {
  const result: ExpirationResult = {
    success: true,
    expired: {
      individual: 0,
      family: 0,
      total: 0,
    },
    streaksBroken: 0,
    errors: [],
  };

  try {
    const now = new Date().toISOString();

    // Find all quests past their cycle_end_date that are not completed/approved
    const { data: expiredQuests, error: fetchError } = await supabase
      .from('quest_instances')
      .select('id, template_id, assigned_to_id, quest_type, status')
      .not('template_id', 'is', null)
      .lt('cycle_end_date', now)
      .in('status', ['PENDING', 'IN_PROGRESS', 'AVAILABLE', 'CLAIMED']) as { data: ExpiredQuest[] | null; error: { message: string } | null };

    if (fetchError) {
      result.success = false;
      result.errors.push(`Failed to fetch expired quests: ${fetchError.message}`);
      return result;
    }

    if (!expiredQuests || expiredQuests.length === 0) {
      return result;
    }

    // Get templates to check if they're paused
    const templateIds = [...new Set(expiredQuests.map((q) => q.template_id).filter(Boolean))] as string[];
    const { data: templates } = await supabase
      .from('quest_templates')
      .select('*')
      .in('id', templateIds) as { data: TemplateRow[] | null };

    const pausedTemplateIds = new Set(
      (templates || []).filter((t) => t.is_paused).map((t) => t.id)
    );

    // Mark quests as MISSED
    const questIds = expiredQuests.map((q) => q.id);
    const { error: updateError } = await supabase
      .from('quest_instances')
      .update({ status: 'MISSED' })
      .in('id', questIds);

    if (updateError) {
      result.success = false;
      result.errors.push(`Failed to mark quests as MISSED: ${updateError.message}`);
      return result;
    }

    // Clear active_family_quest_id for any family quests that expired while assigned to a hero
    const familyQuestIdsWithActiveHeroes = expiredQuests
      .filter((q) => q.quest_type === 'FAMILY' && Boolean(q.assigned_to_id))
      .map((q) => q.id);

    if (familyQuestIdsWithActiveHeroes.length > 0) {
      const { error: clearError } = await supabase
        .from('characters')
        .update({ active_family_quest_id: null })
        .in('active_family_quest_id', familyQuestIdsWithActiveHeroes);

      if (clearError) {
        result.errors.push(`Failed to clear active_family_quest_id: ${clearError.message}`);
      }
    }

    // Count by type
    for (const quest of expiredQuests) {
      if (quest.quest_type === 'INDIVIDUAL') {
        result.expired.individual++;
      } else if (quest.quest_type === 'FAMILY') {
        result.expired.family++;
      }
    }
    result.expired.total = expiredQuests.length;

    // Break streaks for INDIVIDUAL quests (unless template is paused)
    for (const quest of expiredQuests) {
      if (
        quest.quest_type === 'INDIVIDUAL' &&
        quest.assigned_to_id &&
        quest.template_id &&
        !pausedTemplateIds.has(quest.template_id)
      ) {
        // Get character_id from assigned_to_id
        const { data: character } = await supabase
          .from('characters')
          .select('id')
          .eq('user_id', quest.assigned_to_id)
          .single();

        if (character) {
          await resetStreak(supabase, character.id, quest.template_id);
          result.streaksBroken++;
        }
      }
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error during quest expiration'
    );
  }

  return result;
}

/**
 * Main function to generate recurring quests
 */
export async function generateRecurringQuests(
  supabase: SupabaseClient<Database>
): Promise<GenerationResult> {
  const result: GenerationResult = {
    success: true,
    generated: {
      individual: 0,
      family: 0,
      total: 0,
    },
    errors: [],
  };

  try {
    // Fetch all active, non-paused quest templates
    const { data: templates, error: templatesError } = await supabase
      .from('quest_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_paused', false)
      .not('recurrence_pattern', 'is', null);

    if (templatesError) {
      result.success = false;
      result.errors.push(`Failed to fetch templates: ${templatesError.message}`);
      return result;
    }

    if (!templates || templates.length === 0) {
      return result;
    }

    // Get family timezone and week_start_day settings
    const familyIds = [...new Set(templates.map(t => t.family_id).filter(Boolean))] as string[];
    const { data: families } = await supabase
      .from('families')
      .select('*')
      .in('id', familyIds) as { data: FamilyRow[] | null };

    const familyWeekStartMap = new Map(
      (families || []).map((f) => [f.id, f.week_start_day ?? 0])
    );

    const familyTimezoneMap = new Map(
      (families || []).map((f) => [f.id, f.timezone ?? 'UTC'])
    );

    // Get a GM user_id for created_by_id (use first GM found)
    const { data: gmProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'GUILD_MASTER')
      .limit(1)
      .single();

    const gmUserId = gmProfile?.id || (templates[0] as QuestTemplateWithAssignments).created_at || 'system'; // Fallback to template creator

    // Generate quests for each template
    for (const template of templates as QuestTemplateWithAssignments[]) {
      const timezone = (familyTimezoneMap.get(template.family_id || '') ?? 'UTC') as string;
      const weekStartDay = (familyWeekStartMap.get(template.family_id || '') ?? 0) as number;
      const { cycleStart, cycleEnd } = calculateCycleDates(
        template.recurrence_pattern || 'DAILY',
        timezone,
        weekStartDay
      );

      if (template.quest_type === 'INDIVIDUAL') {
        const { count, errors } = await generateIndividualQuests(
          supabase,
          template as QuestTemplate & { assigned_character_ids: string[] },
          cycleStart,
          cycleEnd,
          gmUserId
        );
        result.generated.individual += count;
        result.errors.push(...errors);
      } else if (template.quest_type === 'FAMILY') {
        const { count, errors } = await generateFamilyQuest(
          supabase,
          template,
          cycleStart,
          cycleEnd,
          gmUserId
        );
        result.generated.family += count;
        result.errors.push(...errors);
      }
    }

    result.generated.total =
      result.generated.individual + result.generated.family;
    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error during quest generation'
    );
  }

  return result;
}
