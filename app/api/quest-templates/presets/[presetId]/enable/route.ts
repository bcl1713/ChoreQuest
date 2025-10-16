import { NextRequest, NextResponse } from 'next/server';
import { presetTemplates } from '@/lib/preset-templates';
import { questTemplateService } from '@/lib/quest-template-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ presetId: string }> }
) {
  try {
    const { presetId } = await context.params;
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
      return NextResponse.json({ error: 'Only Guild Masters can enable presets' }, { status: 403 });
    }

    if (!requesterProfile.family_id) {
      return NextResponse.json({ error: 'User is not associated with a family' }, { status: 400 });
    }

    const preset = Object.values(presetTemplates).flat().find(p => p.name === presetId);
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
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
    console.error('Error enabling preset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
