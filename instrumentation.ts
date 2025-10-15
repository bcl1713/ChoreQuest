/**
 * Next.js Instrumentation Hook
 *
 * This file is called once when the Next.js server starts.
 * We use it to initialize cron jobs for recurring quest generation.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run cron jobs in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeCronJobs } = await import('./lib/cron-jobs');
    initializeCronJobs();
  }
}
