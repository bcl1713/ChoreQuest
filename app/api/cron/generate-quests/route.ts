/**
 * Cron Job: Generate Recurring Quests
 *
 * This endpoint is called by node-cron every 5 minutes to generate
 * recurring quest instances based on active quest templates.
 *
 * Authentication: Requires CRON_SECRET header for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/api-error-handler';
import { AppError, AuthError } from '@/lib/errors';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;

  try {
    // Validate cron secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured in environment variables');
      throw new AppError(
        'Cron job not configured',
        500,
        'CRON_NOT_CONFIGURED',
      );
    }

    if (providedSecret !== cronSecret) {
      console.warn('Unauthorized cron job attempt');
      throw new AuthError('Unauthorized', 'CRON_UNAUTHORIZED');
    }

    // Create Supabase client with service role for admin access
    const supabase = createServiceSupabaseClient();

    // Import and run quest generation
    const { generateRecurringQuests } = await import('@/lib/recurring-quest-generator');
    const generationResult = await generateRecurringQuests(supabase);

    const result = {
      ...generationResult,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    if (!generationResult.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    if (error instanceof AppError) {
      return handleRouteError(error);
    }

    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

// Allow GET for manual testing (still requires authentication)
export async function GET(request: NextRequest) {
  return POST(request);
}
