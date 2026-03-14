/**
 * Quest Templates API Endpoint
 * Handles creation and listing of quest templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError } from '@/lib/api-error-handler';
import {
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
} from '@/lib/errors';
import { questTemplateService } from '@/lib/quest-template-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Zod schema for creating quest templates
const createQuestTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.enum(['DAILY', 'WEEKLY', 'BOSS_BATTLE']),
  xp_reward: z.number().int().min(0, 'XP reward must be non-negative'),
  gold_reward: z.number().int().min(0, 'Gold reward must be non-negative'),
  quest_type: z.enum(['INDIVIDUAL', 'FAMILY']).optional(),
  recurrence_pattern: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
  assigned_character_ids: z.array(z.string().uuid()).optional(),
  family_id: z.string().uuid(),
  class_bonuses: z.record(z.string(), z.object({
    xp: z.number().optional(),
    gold: z.number().optional(),
    gems: z.number().optional(),
    honor: z.number().optional(),
  })).optional(),
});

/**
 * POST /api/quest-templates
 * Create a new quest template
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(
        'Missing or invalid authorization header',
        'AUTH_HEADER_INVALID',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the user's token
    const supabase = createServerSupabaseClient(token);

    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (authError || !user) {
      throw new AuthError();
    }
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('role, family_id')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      throw new AppError('Failed to load user profile', 500, 'PROFILE_LOAD_FAILED');
    }

    if (requesterProfile.role !== 'GUILD_MASTER') {
      throw new ForbiddenError(
        'Only Guild Masters can create quest templates',
        'QUEST_TEMPLATE_CREATE_FORBIDDEN',
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createQuestTemplateSchema.parse(body);

    // Verify the family_id matches the user's family
    if (validatedData.family_id !== requesterProfile.family_id) {
      throw new ForbiddenError(
        'Cannot create templates for other families',
        'QUEST_TEMPLATE_CREATE_FORBIDDEN',
      );
    }

    // Validate INDIVIDUAL quest requirements
    if (validatedData.quest_type === 'INDIVIDUAL') {
      if (!validatedData.assigned_character_ids || validatedData.assigned_character_ids.length === 0) {
        throw new ValidationError(
          'INDIVIDUAL quests must have at least one assigned character',
          'QUEST_TEMPLATE_ASSIGNMENT_REQUIRED',
        );
      }
    }

    // Create the template using the service
    const template = await questTemplateService.createTemplate({
      title: validatedData.title,
      description: validatedData.description,
      difficulty: validatedData.difficulty,
      category: validatedData.category,
      xp_reward: validatedData.xp_reward,
      gold_reward: validatedData.gold_reward,
      quest_type: validatedData.quest_type || null,
      recurrence_pattern: validatedData.recurrence_pattern || null,
      assigned_character_ids: validatedData.assigned_character_ids || null,
      family_id: validatedData.family_id,
      class_bonuses: validatedData.class_bonuses,
      is_active: true,
      is_paused: false,
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Quest template created successfully',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ValidationError(
          'Validation failed',
          'VALIDATION_ERROR',
          error.issues,
        ),
      );
    }

    return handleRouteError(error);
  }
}

/**
 * GET /api/quest-templates?familyId=X&questType=INDIVIDUAL|FAMILY
 * List quest templates for a family, optionally filtered by type
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(
        'Missing or invalid authorization header',
        'AUTH_HEADER_INVALID',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the user's token
    const supabase = createServerSupabaseClient(token);

    // Get the authenticated user
    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (authError || !user) {
      throw new AuthError();
    }

    // Get requester's profile
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      throw new AppError('Failed to load user profile', 500, 'PROFILE_LOAD_FAILED');
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const familyId = searchParams.get('familyId');
    const questType = searchParams.get('questType');

    if (!familyId) {
      throw new ValidationError(
        'familyId query parameter is required',
        'FAMILY_ID_REQUIRED',
      );
    }

    // Verify the user has access to this family
    if (familyId !== requesterProfile.family_id) {
      throw new ForbiddenError(
        'Cannot access templates for other families',
        'QUEST_TEMPLATE_ACCESS_FORBIDDEN',
      );
    }

    // Validate questType if provided
    if (questType && questType !== 'INDIVIDUAL' && questType !== 'FAMILY') {
      throw new ValidationError(
        'Invalid questType. Must be INDIVIDUAL or FAMILY',
        'QUEST_TYPE_INVALID',
      );
    }

    // Fetch templates
    let templates;
    if (questType) {
      templates = await questTemplateService.getTemplatesByType(
        familyId,
        questType as 'INDIVIDUAL' | 'FAMILY'
      );
    } else {
      templates = await questTemplateService.getTemplatesForFamily(familyId);
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
