import { config } from "dotenv";
import { resolve } from "path";

import {
  formatStartSeasonResetAudit,
  parseStartSeasonResetArgs,
  runStartSeasonReset,
} from "../lib/admin/start-season-reset";
import { createSupabaseSeasonResetStore } from "../lib/admin/start-season-reset-store";
import { createServiceSupabaseClient } from "../lib/supabase-server";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const options = parseStartSeasonResetArgs(process.argv.slice(2));
  const store = createSupabaseSeasonResetStore(createServiceSupabaseClient());
  const result = await runStartSeasonReset(store, options);
  console.log(formatStartSeasonResetAudit(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "Usage: npx tsx scripts/admin-start-season.ts --family-id <uuid> --name <season name> --starts-at <iso|now> (--reset-user <uuid>... | --all-users) [--theme <text>] [--description <text>] [--dry-run] [--apply --confirm-start-season-reset]",
  );
  process.exit(1);
});
