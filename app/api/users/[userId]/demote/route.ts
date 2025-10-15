/**
 * User Demotion API Endpoint
 * Allows Guild Masters to demote other Guild Masters to Hero role
 * Prevents self-demotion and ensures at least one GM remains
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;

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
    const supabase = createServerSupabaseClient(token);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const requesterId = user.id;

    // 1.8: Get requester's profile to check if they are a Guild Master
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('user_profiles')
      .select('role, family_id')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Failed to load requester profile' },
        { status: 500 }
      );
    }

    if (requesterProfile.role !== 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'Only Guild Masters can demote users' },
        { status: 403 }
      );
    }

    // 1.9: Check for self-demotion
    if (requesterId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot demote yourself' },
        { status: 400 }
      );
    }

    // 1.8 (continued): Get target user's profile to verify family membership
    const { data: targetProfile, error: targetError } = await supabase
      .from('user_profiles')
      .select('role, family_id, name, email')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Verify both users are in the same family
    if (requesterProfile.family_id !== targetProfile.family_id) {
      return NextResponse.json(
        { error: 'Can only demote users in your family' },
        { status: 403 }
      );
    }

    // Verify target is a Guild Master
    if (targetProfile.role !== 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'User is not a Guild Master' },
        { status: 400 }
      );
    }

    // 1.10: Count Guild Masters in the family
    const { count: gmCount, error: countError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', requesterProfile.family_id)
      .eq('role', 'GUILD_MASTER');

    if (countError) {
      console.error('Error counting Guild Masters:', countError);
      return NextResponse.json(
        { error: 'Failed to verify Guild Master count' },
        { status: 500 }
      );
    }

    // Prevent demoting the last Guild Master
    if (gmCount !== null && gmCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last Guild Master. Promote another family member first.' },
        { status: 400 }
      );
    }

    // 1.11: Update the target user's role to HERO
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'HERO' })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error demoting user:', updateError);
      return NextResponse.json(
        { error: 'Failed to demote user' },
        { status: 500 }
      );
    }

    // 1.12: Return the updated user profile
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: `${targetProfile.name} has been demoted to Hero`,
    });

  } catch (error) {
    console.error('Unexpected error in demote endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
