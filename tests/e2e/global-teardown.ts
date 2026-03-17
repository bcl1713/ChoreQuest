import { createClient } from "@supabase/supabase-js";
import { readFileSync, unlinkSync, existsSync } from "fs";
import { TEST_USER_FILE } from "./fixtures/test-credentials";

export default async function globalTeardown() {
  if (!existsSync(TEST_USER_FILE)) return;

  const { userId, familyId } = JSON.parse(
    readFileSync(TEST_USER_FILE, "utf-8"),
  );
  unlinkSync(TEST_USER_FILE);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete auth user first (cascades to user_profiles and characters)
  const { error: userError } = await admin.auth.admin.deleteUser(userId);
  if (userError) {
    console.warn(
      `E2E teardown: failed to delete auth user ${userId}: ${userError.message}`,
    );
  }

  // Delete family
  const { error: familyError } = await admin
    .from("families")
    .delete()
    .eq("id", familyId);
  if (familyError) {
    console.warn(
      `E2E teardown: failed to delete family ${familyId}: ${familyError.message}`,
    );
  }
}
