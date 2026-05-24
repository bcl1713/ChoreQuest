import { config } from "dotenv";
import { resolve } from "path";

import { formatStartSeasonResetAudit, runStartSeasonReset } from "../lib/admin/start-season-reset";
import {
  formatStartSeasonDiscoveryAudit,
  parseStartSeasonResetArgs,
  runStartSeasonDiscovery,
} from "../lib/admin/start-season-reset-cli";
import { createSupabaseSeasonResetStore } from "../lib/admin/start-season-reset-store";
import { createServiceSupabaseClient } from "../lib/supabase-server";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const options = parseStartSeasonResetArgs(process.argv.slice(2));
  const store = createSupabaseSeasonResetStore(createServiceSupabaseClient());

  if (options.discovery) {
    const result = await runStartSeasonDiscovery(store, options);
    console.log(formatStartSeasonDiscoveryAudit(result));
    return;
  }

  const result = await runStartSeasonReset(store, options);
  console.log(formatStartSeasonResetAudit(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "Usage: npx tsx scripts/admin-start-season.ts [--list-families | --family-id <uuid> --list-family-users | --family-id <uuid> --name <season name> --starts-at <iso|now> (--reset-user <uuid>... | --all-users) [--theme <text>] [--description <text>] [--dry-run] [--apply --confirm-start-season-reset]]",
  );
  process.exit(1);
});
