import { NextRequest, NextResponse } from 'next/server';
import { questTemplateService } from '@/lib/quest-template-service';
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

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('role, family_id')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    if (requesterProfile.role !== 'GUILD_MASTER') {
      return NextResponse.json({ error: 'Only Guild Masters can convert quests' }, { status: 403 });
    }

    if (!requesterProfile.family_id) {
      return NextResponse.json({ error: 'User is not associated with a family' }, { status: 400 });
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
    console.error('Error converting quest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
