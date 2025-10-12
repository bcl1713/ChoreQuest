/**
 * Quest Release API Endpoint
 * Allows heroes to release claimed family quests back to AVAILABLE status
 * Also allows Guild Masters to release quests on behalf of heroes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { questInstanceService } from '@/lib/quest-instance-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Zod schema for release request
const releaseQuestSchema = z.object({
  characterId: z.string().uuid('Invalid character ID'),
});

/**
 * POST /api/quests/:id/release
 * Release a claimed family quest back to AVAILABLE status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = releaseQuestSchema.parse(body);

    // Get requester's profile to check if they are a Guild Master
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('family_id, role')
      .eq('id', user.id)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    // Fetch the character to validate
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, name')
      .eq('id', validatedData.characterId)
      .single();

    if (characterError || !character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Fetch the quest to verify family membership
    const { data: quest, error: questError } = await supabase
      .from('quest_instances')
      .select('family_id, quest_type, status, volunteered_by')
      .eq('id', id)
      .single();

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Verify the user is in the same family as the quest
    if (quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: 'Cannot release quests from other families' },
        { status: 403 }
      );
    }

    // Check authorization: either the character who claimed it, or a Guild Master
    const isGuildMaster = requesterProfile.role === 'GUILD_MASTER';
    const isQuestOwner = character.user_id === user.id && quest.volunteered_by === validatedData.characterId;

    if (!isGuildMaster && !isQuestOwner) {
      return NextResponse.json(
        { error: 'Only the hero who claimed this quest or a Guild Master can release it' },
        { status: 403 }
      );
    }

    // Release the quest using the service
    const releasedQuest = await questInstanceService.releaseQuest(
      id,
      validatedData.characterId
    );

    return NextResponse.json({
      success: true,
      quest: releasedQuest,
      message: `Quest released successfully by ${character.name}`,
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Handle service-level errors with appropriate status codes
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (errorMessage.includes('cannot be released') ||
          errorMessage.includes('only family quests') ||
          errorMessage.includes('only the hero who claimed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    console.error('Unexpected error in POST /api/quests/:id/release:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
