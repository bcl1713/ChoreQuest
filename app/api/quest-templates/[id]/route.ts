/**
 * Individual Quest Template API Endpoint
 * Handles operations on specific quest templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { questTemplateService } from '@/lib/quest-template-service';
import { QuestTemplate } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Zod schema for updating quest templates
const updateQuestTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  category: z.enum(['DAILY', 'WEEKLY', 'BOSS_BATTLE']).optional(),
  xp_reward: z.number().int().min(0, 'XP reward must be non-negative').optional(),
  gold_reward: z.number().int().min(0, 'Gold reward must be non-negative').optional(),
  quest_type: z.enum(['INDIVIDUAL', 'FAMILY']).optional(),
  recurrence_pattern: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
  assigned_character_ids: z.array(z.string().uuid()).optional(),
  class_bonuses: z.record(z.string(), z.object({
    xp: z.number().optional(),
    gold: z.number().optional(),
    gems: z.number().optional(),
    honor: z.number().optional(),
  })).optional(),
});

/**
 * Helper function to verify Guild Master authorization for a template
 */
async function verifyGuildMasterAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  templateId: string
): Promise<{ authorized: boolean; error?: string; template?: QuestTemplate }> {
  // Get requester's profile
  const { data: requesterProfile, error: requesterError } = await supabase
    .from('user_profiles')
    .select('role, family_id')
    .eq('id', userId)
    .single();

  if (requesterError || !requesterProfile) {
    return { authorized: false, error: 'Failed to load user profile' };
  }

  if (requesterProfile.role !== 'GUILD_MASTER') {
    return { authorized: false, error: 'Only Guild Masters can manage quest templates' };
  }

  // Get the template to verify family ownership
  const { data: template, error: templateError } = await supabase
    .from('quest_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    return { authorized: false, error: 'Quest template not found' };
  }

  if (template.family_id !== requesterProfile.family_id) {
    return { authorized: false, error: 'Cannot access templates from other families' };
  }

  return { authorized: true, template };
}

/**
 * GET /api/quest-templates/[id]
 * Get a single quest template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify authorization and get template
    const { authorized, error, template } = await verifyGuildMasterAccess(
      supabase,
      user.id,
      templateId
    );

    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Access denied' },
        { status: error === 'Quest template not found' ? 404 : 403 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/quest-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quest-templates/[id]
 * Update a quest template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify authorization
    const { authorized, error } = await verifyGuildMasterAccess(
      supabase,
      user.id,
      templateId
    );

    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Access denied' },
        { status: error === 'Quest template not found' ? 404 : 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateQuestTemplateSchema.parse(body);

    // Validate INDIVIDUAL quest requirements if quest_type is being updated
    if (validatedData.quest_type === 'INDIVIDUAL' && validatedData.assigned_character_ids) {
      if (validatedData.assigned_character_ids.length === 0) {
        return NextResponse.json(
          { error: 'INDIVIDUAL quests must have at least one assigned character' },
          { status: 400 }
        );
      }
    }

    // Update the template using the service
    const updatedTemplate = await questTemplateService.updateTemplate(
      templateId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Quest template updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Unexpected error in PATCH /api/quest-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quest-templates/[id]
 * Soft delete a quest template by setting is_active to false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify authorization
    const { authorized, error } = await verifyGuildMasterAccess(
      supabase,
      user.id,
      templateId
    );

    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Access denied' },
        { status: error === 'Quest template not found' ? 404 : 403 }
      );
    }

    // Soft delete the template using the service
    const deletedTemplate = await questTemplateService.deleteTemplate(templateId);

    return NextResponse.json({
      success: true,
      template: deletedTemplate,
      message: 'Quest template deleted successfully',
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/quest-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
