/**
 * User Promotion API Endpoint
 * Allows Guild Masters to promote Heroes to Guild Master role
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/api-error-handler';
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from '@/lib/api-auth-helpers';
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
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
        'Only Guild Masters can promote users',
        'USER_PROMOTE_FORBIDDEN',
      );
    }

    // 1.3: Get target user's profile to verify family membership
    const { data: targetProfile, error: targetError } = await supabase
      .from('user_profiles')
      .select('role, family_id, name, email')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetError) {
      throw new AppError(
        'Failed to fetch target user',
        500,
        'TARGET_USER_FETCH_FAILED',
      );
    }

    if (!targetProfile) {
      throw new NotFoundError(
        'Target user not found',
        'TARGET_USER_NOT_FOUND',
      );
    }

    // Verify both users are in the same family
    if (requesterProfile.family_id !== targetProfile.family_id) {
      throw new ForbiddenError(
        'Can only promote users in your family',
        'USER_PROMOTE_FORBIDDEN',
      );
    }

    // 1.4: Check if target is already a Guild Master
    if (targetProfile.role === 'GUILD_MASTER') {
      throw new ValidationError(
        'User is already a Guild Master',
        'USER_ALREADY_GUILD_MASTER',
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
      throw new AppError(
        'Failed to promote user',
        500,
        'USER_PROMOTE_UPDATE_FAILED',
      );
    }

    // 1.6: Return the updated user profile
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: `${targetProfile.name} has been promoted to Guild Master`,
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
