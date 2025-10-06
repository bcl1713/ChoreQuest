import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface TestUser {
  id: string;
  email: string;
  password: string;
  userName: string;
  characterId: string;
  characterName: string;
}

export async function createEphemeralUser(
  supabase: SupabaseClient,
): Promise<TestUser> {
  const email = faker.internet.email();
  const password = faker.internet.password();
  const userName = faker.person.firstName();

  // ✅ Proper destructuring for v2 API
  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !user) throw error ?? new Error("Failed to create user");

  // Create an initial character entry for this user
  const { data: character, error: charError } = await supabase
    .from("characters")
    .insert({
      user_id: user.id,
      name: faker.person.firstName(),
      class: "KNIGHT",
    })
    .select()
    .single();

  if (charError || !character)
    throw charError ?? new Error("Character creation failed");

  return {
    id: user.id,
    email,
    password,
    userName,
    characterId: character.id,
    characterName: character.name,
  };
}
