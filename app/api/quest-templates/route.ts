/**
 * Quest Templates API Endpoint
 * Handles creation and listing of quest templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { questTemplateService } from '@/lib/quest-template-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('role, family_id')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    if (requesterProfile.role !== 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'Only Guild Masters can create quest templates' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Received body for quest template creation:', body);
    const validatedData = createQuestTemplateSchema.parse(body);

    // Verify the family_id matches the user's family
    if (validatedData.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: 'Cannot create templates for other families' },
        { status: 403 }
      );
    }

    // Validate INDIVIDUAL quest requirements
    if (validatedData.quest_type === 'INDIVIDUAL') {
      if (!validatedData.assigned_character_ids || validatedData.assigned_character_ids.length === 0) {
        return NextResponse.json(
          { error: 'INDIVIDUAL quests must have at least one assigned character' },
          { status: 400 }
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
      console.error('Zod Validation Error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error && typeof error === 'object' && 'data' in error && 'error' in error) {
      console.error('Unexpected error in POST /api/quest-templates: data=', error.data, 'error=', error.error);
    } else {
      console.error('Unexpected error in POST /api/quest-templates:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the authenticated user
    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get requester's profile
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const familyId = searchParams.get('familyId');
    const questType = searchParams.get('questType');

    if (!familyId) {
      return NextResponse.json(
        { error: 'familyId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify the user has access to this family
    if (familyId !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: 'Cannot access templates for other families' },
        { status: 403 }
      );
    }

    // Validate questType if provided
    if (questType && questType !== 'INDIVIDUAL' && questType !== 'FAMILY') {
      return NextResponse.json(
        { error: 'Invalid questType. Must be INDIVIDUAL or FAMILY' },
        { status: 400 }
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
    if (error && typeof error === 'object' && 'data' in error && 'error' in error) {
      console.error('Unexpected error in GET /api/quest-templates: data=', error.data, 'error=', error.error);
    } else {
      console.error('Unexpected error in GET /api/quest-templates:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
