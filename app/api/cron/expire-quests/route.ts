/**
 * Cron Job: Expire Quests and Break Streaks
 *
 * This endpoint is called by node-cron every 5 minutes to:
 * - Mark expired quests as MISSED
 * - Break streaks for missed INDIVIDUAL quests (unless template is paused)
 *
 * Authentication: Requires CRON_SECRET header for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Import and run quest expiration
    const { expireQuests } = await import('@/lib/recurring-quest-generator');
    const expirationResult = await expireQuests(supabase);

    const result = {
      ...expirationResult,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };

    console.log('Quest expiration completed:', result);

    return NextResponse.json(result, {
      status: expirationResult.success ? 200 : 500
    });

  } catch (error) {
    console.error('Error in expire-quests cron job:', error);

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
