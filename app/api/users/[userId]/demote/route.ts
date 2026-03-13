/**
 * User Demotion API Endpoint
 * Allows Guild Masters to demote other Guild Masters to Hero role
 * Prevents self-demotion and ensures at least one GM remains
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/api-error-handler';
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from '@/lib/api-auth-helpers';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;

    const token = extractBearerToken(request);

    // Create Supabase client with the user's token
    const supabase = createServerSupabaseClient(token);

    const requesterProfile = await authenticateAndFetchUserProfile(supabase, token);

    if (requesterProfile.role !== 'GUILD_MASTER') {
      throw new ForbiddenError(
        'Only Guild Masters can demote users',
        'USER_DEMOTE_FORBIDDEN',
      );
    }

    // 1.9: Check for self-demotion
    if (requesterProfile.id === targetUserId) {
      throw new ValidationError(
        'Cannot demote yourself',
        'SELF_DEMOTION_FORBIDDEN',
      );
    }

    // 1.8 (continued): Get target user's profile to verify family membership
    const { data: targetProfile, error: targetError } = await supabase
      .from('user_profiles')
      .select('role, family_id, name, email')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      throw new NotFoundError(
        'Target user not found',
        'TARGET_USER_NOT_FOUND',
      );
    }

    // Verify both users are in the same family
    if (requesterProfile.family_id !== targetProfile.family_id) {
      throw new ForbiddenError(
        'Can only demote users in your family',
        'USER_DEMOTE_FORBIDDEN',
      );
    }

    if (!requesterProfile.family_id) {
      throw new ValidationError(
        'Requester is not associated with a family',
        'REQUESTER_FAMILY_REQUIRED',
      );
    }

    // Verify target is a Guild Master
    if (targetProfile.role !== 'GUILD_MASTER') {
      throw new ValidationError(
        'User is not a Guild Master',
        'TARGET_USER_NOT_GUILD_MASTER',
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
      throw new Error('Failed to verify Guild Master count');
    }

    // Prevent demoting the last Guild Master
    if (gmCount !== null && gmCount <= 1) {
      throw new ValidationError(
        'Cannot demote the last Guild Master. Promote another family member first.',
        'LAST_GUILD_MASTER',
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
      throw new Error('Failed to demote user');
    }

    // 1.12: Return the updated user profile
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: `${targetProfile.name} has been demoted to Hero`,
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
