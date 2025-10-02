/**
 * User Promotion API Endpoint
 * Allows Guild Masters to promote Heroes to Guild Master role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const requesterId = user.id;

    // 1.2: Get requester's profile to check if they are a Guild Master
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
        { error: 'Only Guild Masters can promote users' },
        { status: 403 }
      );
    }

    // 1.3: Get target user's profile to verify family membership
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
        { error: 'Can only promote users in your family' },
        { status: 403 }
      );
    }

    // 1.4: Check if target is already a Guild Master
    if (targetProfile.role === 'GUILD_MASTER') {
      return NextResponse.json(
        { error: 'User is already a Guild Master' },
        { status: 400 }
      );
    }

    // 1.5: Update the target user's role to GUILD_MASTER
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'GUILD_MASTER' })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error promoting user:', updateError);
      return NextResponse.json(
        { error: 'Failed to promote user' },
        { status: 500 }
      );
    }

    // 1.6: Return the updated user profile
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: `${targetProfile.name} has been promoted to Guild Master`,
    });

  } catch (error) {
    console.error('Unexpected error in promote endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
