/**
 * Quest Assign API Endpoint
 * Allows Guild Masters to manually assign family quests to heroes
 * No volunteer bonus is applied for GM assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { questInstanceService } from '@/lib/quest-instance-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Zod schema for assign request
const assignQuestSchema = z.object({
  characterId: z.string().uuid('Invalid character ID'),
});

/**
 * POST /api/quests/:id/assign
 * Manually assign a family quest to a hero (Guild Master only)
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

    // Verify the user is a Guild Master
    if (requesterProfile.role !== 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'Only Guild Masters can manually assign quests' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = assignQuestSchema.parse(body);

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
      .select('family_id, quest_type, status')
      .eq('id', id)
      .single();

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Verify the quest is in the same family as the GM
    if (quest.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: 'Cannot assign quests from other families' },
        { status: 403 }
      );
    }

    // Verify the character belongs to the same family
    const { data: characterProfile, error: characterProfileError } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', character.user_id)
      .single();

    if (characterProfileError || !characterProfile) {
      return NextResponse.json(
        { error: 'Failed to load character profile' },
        { status: 500 }
      );
    }

    if (characterProfile.family_id !== requesterProfile.family_id) {
      return NextResponse.json(
        { error: 'Cannot assign quests to characters from other families' },
        { status: 403 }
      );
    }

    // Assign the quest using the service
    const assignedQuest = await questInstanceService.assignQuest(
      id,
      validatedData.characterId,
      user.id
    );

    return NextResponse.json({
      success: true,
      quest: assignedQuest,
      message: `Quest assigned successfully to ${character.name}`,
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

      if (errorMessage.includes('not available') ||
          errorMessage.includes('already has an active family quest') ||
          errorMessage.includes('only family quests')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    console.error('Unexpected error in POST /api/quests/:id/assign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
