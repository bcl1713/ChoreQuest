import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { questTemplateService } from '@/lib/quest-template-service';
import { QuestTemplate } from '@/lib/types/database';
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
    return { authorized: false, error: 'Failed to load user profile' };
  }

  if (requesterProfile.role !== 'GUILD_MASTER') {
    return { authorized: false, error: 'Only Guild Masters can manage quest templates' };
  }

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

const extractToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

const loadAuthContext = async (
  token: string | null,
  templateId: string
): Promise<
  | { response: NextResponse }
  | { supabase: SupabaseClient<Database>; userId: string; template?: QuestTemplate; authorized: boolean; error?: string }
> => {
  if (!token) {
    return { response: NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 }) };
  }

  const supabase = createServerSupabaseClient(token);
  const { data, error: authError } = await supabase.auth.getUser(token);
  const user = data?.user;

  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }) };
  }

  const access = await verifyGuildMasterAccess(supabase, user.id, templateId);
  if (!access.authorized) {
    return {
      supabase,
      userId: user.id,
      authorized: false,
      error: access.error,
      template: access.template,
    };
  }

  return { supabase, userId: user.id, authorized: true, template: access.template };
};

const isSupabaseLikeError = (error: unknown): error is { data?: unknown; error?: unknown } =>
  typeof error === 'object' && error !== null && 'data' in error && 'error' in error;

const handleUnexpectedError = (error: unknown, verb: string) => {
  if (isSupabaseLikeError(error)) {
    console.error(`Unexpected error in ${verb}: data=`, error.data, 'error=', error.error);
  } else {
    console.error(`Unexpected error in ${verb}:`, error);
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractToken(request);
    const context = await loadAuthContext(token, templateId);
    if ('response' in context) return context.response;
    if (!context.authorized) {
      return NextResponse.json(
        { error: context.error || 'Access denied' },
        { status: context.error === 'Quest template not found' ? 404 : 403 }
      );
    }

    return NextResponse.json({ success: true, template: context.template });
  } catch (error) {
    return handleUnexpectedError(error, 'GET /api/quest-templates/[id]');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractToken(request);
    const context = await loadAuthContext(token, templateId);
    if ('response' in context) return context.response;
    if (!context.authorized) {
      return NextResponse.json(
        { error: context.error || 'Access denied' },
        { status: context.error === 'Quest template not found' ? 404 : 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateQuestTemplateSchema.parse(body);

    if (validatedData.quest_type === 'INDIVIDUAL' && validatedData.assigned_character_ids?.length === 0) {
      return NextResponse.json(
        { error: 'INDIVIDUAL quests must have at least one assigned character' },
        { status: 400 }
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
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return handleUnexpectedError(error, 'PATCH /api/quest-templates/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const token = extractToken(request);
    const context = await loadAuthContext(token, templateId);
    if ('response' in context) return context.response;
    if (!context.authorized) {
      return NextResponse.json(
        { error: context.error || 'Access denied' },
        { status: context.error === 'Quest template not found' ? 404 : 403 }
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
    return handleUnexpectedError(error, 'DELETE /api/quest-templates/[id]');
  }
}
