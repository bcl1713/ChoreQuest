type PreflightEnv = Record<string, string | undefined>;

export type LocalSupabasePreflightPlan =
  | { action: "check"; url: string; key: string }
  | { action: "skip"; reason: string };

const MIGRATION_PATH = "supabase/migrations/20260326000001_add_seasons.sql";
const MIGRATION_COMMAND = "npm run db:migrate:local";

export function createLocalSupabasePreflightPlan(env: PreflightEnv): LocalSupabasePreflightPlan {
  if (env.CHOREQUEST_SKIP_SUPABASE_PREFLIGHT) {
    return { action: "skip", reason: "CHOREQUEST_SKIP_SUPABASE_PREFLIGHT is set." };
  }

  const url = env.SUPABASE_INTERNAL_URL ?? env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return { action: "skip", reason: "No Supabase URL is configured." };
  }

  if (!isLocalSupabaseUrl(url)) {
    return { action: "skip", reason: "Resolved admin Supabase URL is not local; migration preflight is local-dev only." };
  }

  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return { action: "skip", reason: "No Supabase service-role key is configured for the local admin preflight." };
  }

  return { action: "check", url, key };
}

export function isMissingSeasonsMigrationError(error: { message?: string } | null | undefined): boolean {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return message.includes("public.seasons") && (message.includes("schema cache") || message.includes("does not exist"));
}

export function buildLocalSupabasePreflightMessage(): string {
  return [
    "Local Supabase is missing the seasons schema required by the admin start-season tooling.",
    `Apply the pending migration with \`${MIGRATION_COMMAND}\` before running \`npm run dev\` or admin start-season discovery/reset.`,
    `Expected migration: ${MIGRATION_PATH}`,
    "If you intentionally want to start the dev server without checking local Supabase, set CHOREQUEST_SKIP_SUPABASE_PREFLIGHT=1.",
  ].join("\n");
}

function isLocalSupabaseUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
