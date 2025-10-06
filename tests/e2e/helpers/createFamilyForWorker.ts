import { faker } from "@faker-js/faker";
import { createEphemeralUser } from "./createEphemeralUser";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createFamilyForWorker(supabase: SupabaseClient) {
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "Service key starts with:",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
  );
  const familyName = faker.company.name();
  const familyCode = faker.string.alphanumeric(6).toUpperCase();

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({
      name: familyName,
      code: familyCode,
    })
    .select()
    .single();

  if (familyError || !family)
    throw familyError ?? new Error("Family creation failed");

  // ✅ Create a few users tied to the same family
  const gm = await createEphemeralUser(supabase);
  const hero1 = await createEphemeralUser(supabase);
  const hero2 = await createEphemeralUser(supabase);

  const profiles = [
    {
      id: gm.id,
      family_id: family.id,
      role: "GUILD_MASTER",
      email: gm.email,
      name: gm.userName,
    },
    {
      id: hero1.id,
      family_id: family.id,
      role: "YOUNG_HERO",
      email: hero1.email,
      name: hero1.userName,
    },
    {
      id: hero2.id,
      family_id: family.id,
      role: "YOUNG_HERO",
      email: hero2.email,
      name: hero2.userName,
    },
  ];

  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert(profiles);
  if (profileError) throw profileError;

  return {
    family,
    gm,
    heroes: [hero1, hero2],
  };
}
