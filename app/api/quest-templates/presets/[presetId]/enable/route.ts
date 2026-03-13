import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/api-error-handler';
import { presetTemplates } from '@/lib/preset-templates';
import { questTemplateService } from '@/lib/quest-template-service';
import {
  authenticateAndFetchUserProfile,
  authErrorResponse,
  extractBearerToken,
  isAuthError,
} from '@/lib/api-auth-helpers';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ presetId: string }> }
) {
  try {
    const { presetId } = await context.params;
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
        'Only Guild Masters can enable presets',
        'PRESET_ENABLE_FORBIDDEN',
      );
    }

    if (!requesterProfile.family_id) {
      throw new ValidationError(
        'User is not associated with a family',
        'REQUESTER_FAMILY_REQUIRED',
      );
    }

    const preset = Object.values(presetTemplates).flat().find(p => p.name === presetId);
    if (!preset) {
      throw new NotFoundError('Preset not found', 'PRESET_NOT_FOUND');
    }

    const newTemplate = await questTemplateService.createTemplate({
      title: preset.name,
      description: preset.description,
      difficulty: preset.difficulty,
      category: preset.category,
      xp_reward: preset.xp_reward,
      gold_reward: preset.gold_reward,
      quest_type: preset.quest_type,
      recurrence_pattern: preset.recurrence_pattern,
      assigned_character_ids: [],
      family_id: requesterProfile.family_id,
      class_bonuses: null,
      is_active: true,
      is_paused: false,
    });

    return NextResponse.json({ success: true, template: newTemplate }, { status: 201 });

  } catch (error) {
    return handleRouteError(error);
  }
}
