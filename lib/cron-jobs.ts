/**
 * Cron Job Initialization
 *
 * Sets up scheduled tasks using node-cron for self-hosted deployment.
 * Jobs run every 5 minutes to generate and expire recurring quests.
 */

import cron from 'node-cron';

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';

/**
 * Call a cron endpoint with authentication
 */
async function callCronEndpoint(endpoint: string, jobName: string): Promise<void> {
  try {
    console.log(`[CRON] Running ${jobName}...`);

    const response = await fetch(`${BASE_URL}/api/cron/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[CRON] ${jobName} completed successfully:`, result);
    } else {
      console.error(`[CRON] ${jobName} failed:`, result);
    }
  } catch (error) {
    console.error(`[CRON] Error calling ${jobName}:`, error);
  }
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  if (!CRON_SECRET) {
    console.warn('[CRON] CRON_SECRET not configured - cron jobs will not run');
    return;
  }

  console.log('[CRON] Initializing cron jobs...');

  // In development, run more frequently for faster testing
  const isDev = process.env.NODE_ENV === 'development';
  const cronSchedule = isDev ? '* * * * *' : '*/5 * * * *'; // Every 1 min in dev, 5 min in prod
  const scheduleDesc = isDev ? 'every 1 minute' : 'every 5 minutes';

  // Generate recurring quests
  cron.schedule(cronSchedule, () => {
    callCronEndpoint('generate-quests', 'Generate Recurring Quests');
  });

  // Expire quests
  cron.schedule(cronSchedule, () => {
    callCronEndpoint('expire-quests', 'Expire Quests');
  });

  console.log('[CRON] Cron jobs initialized successfully');
  console.log(`[CRON] - Generate quests: ${scheduleDesc}`);
  console.log(`[CRON] - Expire quests: ${scheduleDesc}`);
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs(): void {
  cron.getTasks().forEach(task => task.stop());
  console.log('[CRON] All cron jobs stopped');
}
