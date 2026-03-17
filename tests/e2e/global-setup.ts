import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { TEST_USER_FILE } from "./fixtures/test-credentials";

export default async function globalSetup() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ts = Date.now();
  const email = `e2e-${ts}@example.com`;
  const password = "E2eSmoke!123";

  // 1. Create auth user
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (authError || !authData.user) {
    throw new Error(
      `E2E setup: failed to create auth user: ${authError?.message}`,
    );
  }
  const userId = authData.user.id;

  // 2. Create family
  const { data: family, error: familyError } = await admin
    .from("families")
    .insert({ name: `E2E Family ${ts}`, code: `E2E${ts}` })
    .select()
    .single();
  if (familyError) {
    throw new Error(
      `E2E setup: failed to create family: ${familyError.message}`,
    );
  }

  // 3. Create user profile
  const { error: profileError } = await admin.from("user_profiles").insert({
    id: userId,
    email,
    name: "E2E Hero",
    family_id: family.id,
    role: "HERO",
  });
  if (profileError) {
    throw new Error(
      `E2E setup: failed to create user profile: ${profileError.message}`,
    );
  }

  // 4. Create character (required to reach dashboard)
  const { error: characterError } = await admin.from("characters").insert({
    user_id: userId,
    name: "E2E Knight",
    class: "KNIGHT",
    level: 1,
    xp: 0,
    gold: 0,
    active_family_quest_id: null,
  });
  if (characterError) {
    throw new Error(
      `E2E setup: failed to create character: ${characterError.message}`,
    );
  }

  writeFileSync(
    TEST_USER_FILE,
    JSON.stringify({ email, password, userId, familyId: family.id }),
  );
}
