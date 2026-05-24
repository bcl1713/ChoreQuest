import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database-generated";
import type { FamilyMemberPair } from "./types";

type ReadClient = SupabaseClient<Database>;

export type FamilyCharacterContext = {
  userIds: string[];
  characterIds: string[];
  allUserIds: string[];
  totalMemberCount: number;
  membersWithCharCount: number;
  memberPairs: FamilyMemberPair[];
};

export async function resolveFamilyCharacters(
  readClient: ReadClient,
  familyId: string,
): Promise<FamilyCharacterContext> {
  const { data, error } = await readClient
    .from("user_profiles")
    .select("id, characters(id)")
    .eq("family_id", familyId);

  if (error) {
    throw new Error(`Failed to resolve family characters: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No members found for family: ${familyId}`);
  }

  const userIds: string[] = [];
  const characterIds: string[] = [];
  const allUserIds: string[] = [];
  const usersWithChars = new Set<string>();
  const memberPairs: FamilyMemberPair[] = [];

  for (const profile of data) {
    allUserIds.push(profile.id);
    const chars = Array.isArray(profile.characters)
      ? profile.characters
      : profile.characters
        ? [profile.characters]
        : [];
    const charIds: string[] = [];
    for (const char of chars) {
      const charId = (char as { id: string }).id;
      userIds.push(profile.id);
      characterIds.push(charId);
      usersWithChars.add(profile.id);
      charIds.push(charId);
    }
    memberPairs.push({ userId: profile.id, characterIds: charIds });
  }

  return {
    userIds,
    characterIds,
    allUserIds,
    totalMemberCount: data.length,
    membersWithCharCount: usersWithChars.size,
    memberPairs,
  };
}
