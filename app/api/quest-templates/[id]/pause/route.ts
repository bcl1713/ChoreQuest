/**
 * Quest Template Pause/Resume API Endpoint
 * Handles pausing and resuming quest templates (vacation mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { questTemplateService } from '@/lib/quest-template-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database-generated';

/**
 * Helper function to verify Guild Master authorization for a template
 */
async function verifyGuildMasterAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  templateId: string
): Promise<{ authorized: boolean; error?: string }> {
  // Get requester's profile
  const { data: userProfile, error: userError } = await supabase
    .from('user_profiles')
    .select('role, family_id')
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    return { authorized: false, error: 'Failed to load user profile' };
  }

  // Type assertion after null check
  const userRole = (userProfile as unknown as { role: string | null }).role;
  const userFamilyId = (userProfile as unknown as { family_id: string | null }).family_id;

  if (userRole !== 'GUILD_MASTER') {
    return { authorized: false, error: 'Only Guild Masters can manage quest templates' };
  }

  // Get the template to verify family ownership
  const { data: template, error: templateError } = await supabase
    .from('quest_templates')
    .select('family_id')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    return { authorized: false, error: 'Quest template not found' };
  }

  const templateFamilyId = (template as unknown as { family_id: string | null }).family_id;

  if (templateFamilyId !== userFamilyId) {
    return { authorized: false, error: 'Cannot access templates from other families' };
  }

  return { authorized: true };
}

/**
 * PATCH /api/quest-templates/[id]/pause
 * Pause or resume a quest template
 * Body: { paused: boolean }
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
    const supabase = createServerSupabaseClient(token);

    // Get the authenticated user
    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

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

    // Parse request body
    const body = await request.json();
    const { paused } = body;

    if (typeof paused !== 'boolean') {
      return NextResponse.json(
        { error: 'Body must contain a boolean "paused" field' },
        { status: 400 }
      );
    }

    // Pause or resume the template
    const updatedTemplate = paused
      ? await questTemplateService.pauseTemplate(templateId)
      : await questTemplateService.resumeTemplate(templateId);

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: paused
        ? 'Quest template paused successfully (vacation mode)'
        : 'Quest template resumed successfully',
    });

  } catch (error) {
    if (error && typeof error === 'object' && 'data' in error && 'error' in error) {
      console.error('Unexpected error in PATCH /api/quest-templates/[id]/pause: data=', error.data, 'error=', error.error);
    } else {
      console.error('Unexpected error in PATCH /api/quest-templates/[id]/pause:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
