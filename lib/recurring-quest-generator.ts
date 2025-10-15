/**
 * Recurring Quest Generator Service
 *
 * Handles the core logic for generating recurring quest instances
 * from quest templates.
 *
 * NOTE: This file uses `any` type assertions because the generated database types
 * are not yet fully updated with the new recurring quest schema. After running
 * migrations in production, regenerate types with:
 * `npx supabase gen types typescript --local > lib/types/database-generated.ts`
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database';

const TEST_INTERVAL_MINUTES_ENV = process.env.RECURRING_TEST_INTERVAL_MINUTES;
const TEST_INTERVAL_MINUTES = TEST_INTERVAL_MINUTES_ENV
  ? Number.parseInt(TEST_INTERVAL_MINUTES_ENV, 10)
  : null;

type QuestTemplate = Database['public']['Tables']['quest_templates']['Row'];

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
 * Calculate cycle dates based on recurrence pattern
 */
function calculateCycleDates(
  recurrencePattern: string,
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
    // Daily: midnight to midnight
    const cycleStart = new Date(now);
    cycleStart.setHours(0, 0, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 1);
    cycleEnd.setMilliseconds(cycleEnd.getMilliseconds() - 1);

    return { cycleStart, cycleEnd };
  } else if (recurrencePattern === 'WEEKLY') {
    // Weekly: start of week to end of week
    const dayOfWeek = now.getDay();
    const daysUntilWeekStart = (dayOfWeek - weekStartDay + 7) % 7;

    const cycleStart = new Date(now);
    cycleStart.setDate(cycleStart.getDate() - daysUntilWeekStart);
    cycleStart.setHours(0, 0, 0, 0);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 7);
    cycleEnd.setMilliseconds(cycleEnd.getMilliseconds() - 1);

    return { cycleStart, cycleEnd };
  }

  // CUSTOM: default to daily for now
  // TODO: Implement custom patterns in future
  return calculateCycleDates('DAILY', weekStartDay);
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
    errors.push(`Template ${template.id} has no assigned characters`);
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
      console.log(`Quest already exists for template ${template.id}, character ${character.id}`);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(questInstance as any);

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
    console.log(`Family quest already exists for template ${template.id}`);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(questInstance as any);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: expiredQuests, error: fetchError } = await (supabase as any)
      .from('quest_instances')
      .select('id, template_id, assigned_to_id, quest_type, status')
      .not('template_id', 'is', null)
      .lt('cycle_end_date', now)
      .in('status', ['PENDING', 'IN_PROGRESS', 'AVAILABLE', 'CLAIMED']);

    if (fetchError) {
      result.success = false;
      result.errors.push(`Failed to fetch expired quests: ${fetchError.message}`);
      return result;
    }

    if (!expiredQuests || expiredQuests.length === 0) {
      console.log('No expired quests found');
      return result;
    }

    // Get templates to check if they're paused
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateIds = [...new Set(expiredQuests.map((q: any) => q.template_id).filter(Boolean))] as string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates } = await (supabase as any)
      .from('quest_templates')
      .select('*')
      .in('id', templateIds);

    const pausedTemplateIds = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (templates || []).filter((t: any) => t.is_paused).map((t: any) => t.id)
    );

    // Mark quests as MISSED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questIds = expiredQuests.map((q: any) => q.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('quest_instances')
      .update({ status: 'MISSED' })
      .in('id', questIds);

    if (updateError) {
      result.success = false;
      result.errors.push(`Failed to mark quests as MISSED: ${updateError.message}`);
      return result;
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
      console.log('No active recurring quest templates found');
      return result;
    }

    // Get family week_start_day settings
    const familyIds = [...new Set(templates.map(t => t.family_id).filter(Boolean))] as string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: families } = await (supabase as any)
      .from('families')
      .select('*')
      .in('id', familyIds);

    const familyWeekStartMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (families || []).map((f: any) => [f.id, f.week_start_day ?? 0])
    );

    // Get a GM user_id for created_by_id (use first GM found)
    const { data: gmProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'GUILD_MASTER')
      .limit(1)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gmUserId = gmProfile?.id || (templates[0] as any).created_at || 'system'; // Fallback to template creator

    // Generate quests for each template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const template of templates as any[]) {
      const weekStartDay = (familyWeekStartMap.get(template.family_id || '') ?? 0) as number;
      const { cycleStart, cycleEnd } = calculateCycleDates(
        template.recurrence_pattern || 'DAILY',
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
