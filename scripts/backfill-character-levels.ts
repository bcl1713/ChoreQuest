import { config } from "dotenv";
import { resolve } from "path";
import { createServiceSupabaseClient } from "../lib/supabase-server";
import { RewardCalculator } from "../lib/reward-calculator";

// Loads local environment for service-role key access
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const supabase = createServiceSupabaseClient();

async function backfillLevels() {
  console.log("\n=== Character Level Backfill ===");

  const { data: characters, error } = await supabase
    .from("characters")
    .select("id, name, user_id, xp, level");

  if (error) {
    console.error("Failed to fetch characters:", error.message);
    process.exit(1);
  }

  if (!characters || characters.length === 0) {
    console.log("No characters found. Exiting.");
    return;
  }

  let updated = 0;

  for (const character of characters) {
    const xp = Number.isFinite(character.xp) ? Math.max(0, Math.floor(character.xp as number)) : 0;
    const storedLevel =
      Number.isFinite(character.level) && (character.level as number) > 0
        ? Math.floor(character.level as number)
        : 1;
    const derivedLevel = RewardCalculator.calculateLevelFromTotalXP(xp);
    const nextLevel = Math.max(storedLevel, derivedLevel);

    if (nextLevel === storedLevel) continue;

    const { error: updateError } = await supabase
      .from("characters")
      .update({ level: nextLevel })
      .eq("id", character.id);

    if (updateError) {
      console.error(`Failed to update level for character ${character.id}:`, updateError.message);
      continue;
    }

    updated += 1;
    console.log(
      `- Updated ${character.name ?? character.id}: level ${storedLevel} -> ${nextLevel} (XP: ${xp})`
    );
  }

  console.log(`\n✅ Backfill complete. Updated ${updated} character(s).`);
  console.log("Run command: npx tsx scripts/backfill-character-levels.ts");
}

backfillLevels().catch((err) => {
  console.error("Unexpected error during level backfill:", err);
  process.exit(1);
});
