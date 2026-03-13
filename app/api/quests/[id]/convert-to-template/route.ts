import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/api-error-handler';
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from '@/lib/api-auth-helpers';
import { questTemplateService } from '@/lib/quest-template-service';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { TemplateFormData } from '@/lib/types/quest-templates';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
  ) {
  try {
    const { id: questId } = await context.params;
    const { templateData, deleteOriginal } = (await request.json()) as {
      templateData: TemplateFormData;
      deleteOriginal: boolean;
    };

    const tokenOrError = extractBearerToken(request);
    if (isAuthError(tokenOrError)) {
      return authErrorResponse(tokenOrError);
    }
    const token = tokenOrError;
    const supabase = createServerSupabaseClient(token);

    const requesterOrError = await authenticateAndFetchUserProfile(supabase, token);
    if (isAuthError(requesterOrError)) {
      return authErrorResponse(requesterOrError);
    }
    const requesterProfile = requesterOrError;

    if (requesterProfile.role !== 'GUILD_MASTER') {
      throw new ForbiddenError(
        'Only Guild Masters can convert quests',
        'QUEST_CONVERT_FORBIDDEN',
      );
    }

    if (!requesterProfile.family_id) {
      throw new ValidationError(
        'User is not associated with a family',
        'REQUESTER_FAMILY_REQUIRED',
      );
    }

    const newTemplate = await questTemplateService.createTemplate({
      title: templateData.title,
      description: templateData.description,
      difficulty: templateData.difficulty,
      category: templateData.category,
      xp_reward: templateData.xp_reward,
      gold_reward: templateData.gold_reward,
      quest_type: templateData.quest_type,
      recurrence_pattern: templateData.recurrence_pattern,
      assigned_character_ids: templateData.assigned_character_ids,
      class_bonuses: null,
      family_id: requesterProfile.family_id,
      is_active: true,
      is_paused: false,
    });

    if (deleteOriginal) {
      await supabase.from('quest_instances').delete().eq('id', questId);
    }

    return NextResponse.json({ success: true, template: newTemplate }, { status: 201 });

  } catch (error) {
    return handleRouteError(error);
  }
}
