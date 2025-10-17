/**
 * Family Service
 * Handles family-related operations including info retrieval and invite code management
 */

import { supabase } from "@/lib/supabase";

export interface FamilyMember {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  characterName: string | null;
  joinedAt: string;
}

export interface FamilyInfo {
  id: string;
  name: string;
  code: string;
  timezone: string;
  createdAt: string;
  members: FamilyMember[];
}

export class FamilyService {
  /**
   * Get comprehensive family information including members
   * @param familyId - The family ID to fetch information for
   * @returns Complete family information with member list
   */
  async getFamilyInfo(familyId: string): Promise<FamilyInfo> {
    // Fetch family basic info
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, code, timezone, created_at")
      .eq("id", familyId)
      .single();

    if (familyError) {
      throw new Error(`Failed to fetch family info: ${familyError.message}`);
    }

    if (!family) {
      throw new Error("Family not found");
    }

    // Fetch all family members with their character data
    const { data: members, error: membersError } = await supabase
      .from("user_profiles")
      .select(`
        id,
        email,
        name,
        role,
        created_at,
        characters (
          name
        )
      `)
      .eq("family_id", familyId)
      .order("created_at", { ascending: true });

    if (membersError) {
      throw new Error(`Failed to fetch family members: ${membersError.message}`);
    }

    // Transform members data
    const familyMembers: FamilyMember[] = (members || []).map(member => {
      const character = Array.isArray(member.characters)
        ? member.characters[0]
        : member.characters;

      return {
        userId: member.id,
        email: member.email,
        displayName: member.name,
        role: member.role,
        characterName: character?.name || null,
        joinedAt: member.created_at,
      };
    });

    return {
      id: family.id,
      name: family.name,
      code: family.code,
      timezone: family.timezone,
      createdAt: family.created_at,
      members: familyMembers,
    };
  }

  /**
   * Update the family timezone
   * @param familyId - The family ID to update
   * @param timezone - The IANA timezone string (e.g., 'America/Chicago')
   * @returns The updated timezone
   */
  async updateTimezone(familyId: string, timezone: string): Promise<string> {
    const { data, error } = await supabase
      .from("families")
      .update({ timezone })
      .eq("id", familyId)
      .select("timezone")
      .single();

    if (error) {
      throw new Error(`Failed to update timezone: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to retrieve updated timezone");
    }

    return data.timezone;
  }

  /**
   * Regenerate the family invite code
   * @param familyId - The family ID to regenerate the code for
   * @returns The new invite code
   */
  async regenerateInviteCode(familyId: string): Promise<string> {
    // Generate a new random 8-character code
    const newCode = this.generateInviteCode();

    // Update the family with the new code
    const { data, error } = await supabase
      .from("families")
      .update({ code: newCode })
      .eq("id", familyId)
      .select("code")
      .single();

    if (error) {
      throw new Error(`Failed to regenerate invite code: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to retrieve new invite code");
    }

    return data.code;
  }

  /**
   * Generate a random 8-character alphanumeric invite code
   * @returns A random invite code
   */
  private generateInviteCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
