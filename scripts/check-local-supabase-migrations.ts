import { config } from "dotenv";
import { resolve } from "path";

import { createClient } from "@supabase/supabase-js";

import {
  buildLocalSupabasePreflightMessage,
  createLocalSupabasePreflightPlan,
  isMissingSeasonsMigrationError,
} from "../lib/admin/start-season-reset-preflight";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const plan = createLocalSupabasePreflightPlan(process.env);

  if (plan.action === "skip") {
    console.log(`Skipping local Supabase migration preflight: ${plan.reason}`);
    return;
  }

  const client = createClient(plan.url, plan.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.from("seasons").select("id", { head: true }).limit(1);
  if (isMissingSeasonsMigrationError(error)) {
    throw new Error(buildLocalSupabasePreflightMessage());
  }
  if (error) {
    throw new Error(`Local Supabase migration preflight failed: ${error.message}`);
  }

  console.log("Local Supabase migration preflight passed: seasons schema is present.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
