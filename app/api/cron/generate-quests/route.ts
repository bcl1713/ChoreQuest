/**
 * Cron Job: Generate Recurring Quests
 *
 * This endpoint is called by node-cron every 5 minutes to generate
 * recurring quest instances based on active quest templates.
 *
 * Authentication: Requires CRON_SECRET header for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

const cronSecret = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate cron secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured in environment variables');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (providedSecret !== cronSecret) {
      console.warn('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    console.log('Quest generation completed:', result);

    return NextResponse.json(result, {
      status: generationResult.success ? 200 : 500
    });

  } catch (error) {
    console.error('Error in generate-quests cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (still requires authentication)
export async function GET(request: NextRequest) {
  return POST(request);
}
