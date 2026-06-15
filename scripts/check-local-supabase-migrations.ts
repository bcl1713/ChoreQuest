import { config } from "dotenv";
import { execFileSync } from "child_process";
import { resolve } from "path";

import { createClient } from "@supabase/supabase-js";

import {
  buildLocalSupabasePreflightMessage,
  createLocalSupabasePreflightPlan,
  isMissingSeasonsMigrationError,
} from "../lib/admin/start-season-reset-preflight";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const PREFLIGHT_SCHEMA_ATTEMPTS = readPositiveInteger(process.env.CHOREQUEST_SUPABASE_PREFLIGHT_ATTEMPTS, 30);
const PREFLIGHT_SCHEMA_RETRY_MS = readPositiveInteger(process.env.CHOREQUEST_SUPABASE_PREFLIGHT_RETRY_MS, 1_000);

type SupabasePreflightError = { message?: string; code?: string; details?: string; hint?: string };

async function main() {
  const plan = createLocalSupabasePreflightPlan(process.env);

  if (plan.action === "skip") {
    console.log(`Skipping local Supabase migration preflight: ${plan.reason}`);
    return;
  }

  console.log(`Applying pending local Supabase migrations with ${plan.migrationCommand.display}...`);
  execFileSync(plan.migrationCommand.command, plan.migrationCommand.args, { stdio: "inherit" });

  const client = createClient(plan.url, plan.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (let attempt = 1; attempt <= PREFLIGHT_SCHEMA_ATTEMPTS; attempt += 1) {
    const { error } = await client.from("seasons").select("id", { head: true }).limit(1);

    if (!error) {
      console.log("Local Supabase migration preflight passed: local migrations are applied and seasons schema is present.");
      return;
    }

    if (isMissingSeasonsMigrationError(error)) {
      throw new Error(buildLocalSupabasePreflightMessage());
    }

    if (attempt < PREFLIGHT_SCHEMA_ATTEMPTS) {
      console.warn(
        `Local Supabase migration preflight probe ${attempt}/${PREFLIGHT_SCHEMA_ATTEMPTS} failed; retrying in ${PREFLIGHT_SCHEMA_RETRY_MS}ms: ${formatSupabasePreflightError(error)}`,
      );
      await sleep(PREFLIGHT_SCHEMA_RETRY_MS);
      continue;
    }

    throw new Error(`Local Supabase migration preflight failed: ${formatSupabasePreflightError(error)}`);
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatSupabasePreflightError(error: SupabasePreflightError): string {
  const parts = [error.message, error.code, error.details, error.hint].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(error);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
