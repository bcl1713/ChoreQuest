import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError } from '@/lib/api-error-handler';
import { questTemplateService } from '@/lib/quest-template-service';
import { QuestTemplate } from '@/lib/types/database';
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from '@/lib/api-auth-helpers';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database-generated';

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

async function verifyGuildMasterAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  templateId: string
): Promise<{ authorized: boolean; error?: string; template?: QuestTemplate }> {
  const { data: requesterProfile, error: requesterError } = await supabase
    .from('user_profiles')
    .select('role, family_id')
    .eq('id', userId)
    .single();

  if (requesterError || !requesterProfile) {
    throw new AppError('Failed to load user profile', 500, 'PROFILE_LOAD_FAILED');
  }

  if (requesterProfile.role !== 'GUILD_MASTER') {
    return { authorized: false, error: 'Only Guild Masters can manage quest templates' };
  }

  const { data: template, error: templateError } = await supabase
    .from('quest_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError?.code === 'PGRST116') {
    return { authorized: false, error: 'Quest template not found' };
  }

  if (templateError) {
    throw new AppError(
      'Failed to load quest template',
      500,
      'QUEST_TEMPLATE_LOOKUP_FAILED',
    );
  }

  if (!template) {
    return { authorized: false, error: 'Quest template not found' };
  }

  if (template.family_id !== requesterProfile.family_id) {
    return { authorized: false, error: 'Cannot access templates from other families' };
  }

  return { authorized: true, template };
}

const loadAuthContext = async (
  token: string,
  templateId: string
): Promise<
  | { supabase: SupabaseClient<Database>; userId: string; template?: QuestTemplate; authorized: boolean; error?: string }
> => {
  const supabase = createServerSupabaseClient(token);
  const requester = await authenticateAndFetchUserProfile(supabase, token);

  const access = await verifyGuildMasterAccess(supabase, requester.id, templateId);
  if (!access.authorized) {
    return {
      supabase,
      userId: requester.id,
      authorized: false,
      error: access.error,
      template: access.template,
    };
  }

  return { supabase, userId: requester.id, authorized: true, template: access.template };
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractBearerToken(request);
    const context = await loadAuthContext(token, templateId);
    if (!context.authorized) {
      if (context.error === 'Quest template not found') {
        throw new NotFoundError('Quest template not found', 'QUEST_TEMPLATE_NOT_FOUND');
      }
      throw new ForbiddenError(
        context.error || 'Access denied',
        'QUEST_TEMPLATE_ACCESS_FORBIDDEN',
      );
    }

    return NextResponse.json({ success: true, template: context.template });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractBearerToken(request);
    const context = await loadAuthContext(token, templateId);
    if (!context.authorized) {
      if (context.error === 'Quest template not found') {
        throw new NotFoundError('Quest template not found', 'QUEST_TEMPLATE_NOT_FOUND');
      }
      throw new ForbiddenError(
        context.error || 'Access denied',
        'QUEST_TEMPLATE_ACCESS_FORBIDDEN',
      );
    }

    const body = await request.json();
    const validatedData = updateQuestTemplateSchema.parse(body);

    if (validatedData.quest_type === 'INDIVIDUAL' && validatedData.assigned_character_ids?.length === 0) {
      throw new ValidationError(
        'INDIVIDUAL quests must have at least one assigned character',
        'QUEST_TEMPLATE_ASSIGNMENT_REQUIRED',
      );
    }

    const updatedTemplate = await questTemplateService.updateTemplate(templateId, validatedData);

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Quest template updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 },
      );
    }
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractBearerToken(request);
    const context = await loadAuthContext(token, templateId);
    if (!context.authorized) {
      if (context.error === 'Quest template not found') {
        throw new NotFoundError('Quest template not found', 'QUEST_TEMPLATE_NOT_FOUND');
      }
      throw new ForbiddenError(
        context.error || 'Access denied',
        'QUEST_TEMPLATE_ACCESS_FORBIDDEN',
      );
    }

    const body = await request.json();
    const cleanup = body.cleanup || false;
    const deletedTemplate = await questTemplateService.deleteTemplate(templateId, cleanup);

    return NextResponse.json({
      success: true,
      template: deletedTemplate,
      message: 'Quest template deleted successfully',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
