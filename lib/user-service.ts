import { User } from "@/types";
import { supabase } from "@/lib/supabase";

class UserService {
  private async getAuthToken(): Promise<string | null> {
    // Get token from Supabase session
    if (typeof window === "undefined") return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all family members with their roles, sorted by role
   * Guild Masters first, then Heroes, then Young Heroes
   */
  async getFamilyMembers(familyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("family_id", familyId)
      .order("role", { ascending: true }); // GUILD_MASTER < HERO < YOUNG_HERO alphabetically

    if (error) {
      throw new Error(`Failed to load family members: ${error.message}`);
    }

    // Map database fields to User interface (camelCase)
    return (data || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      familyId: profile.family_id,
      role: profile.role,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    }));
  }

  /**
   * Promote a user to Guild Master role
   * @param userId - The ID of the user to promote
   * @returns The updated user object
   */
  async promoteToGuildMaster(userId: string): Promise<User> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`/api/users/${userId}/promote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to promote user");
    }

    const data = await response.json();

    // Map database fields to User interface
    const profile = data.user;
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      familyId: profile.family_id,
      role: profile.role,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    };
  }

  /**
   * Demote a Guild Master to Hero role
   * @param userId - The ID of the user to demote
   * @returns The updated user object
   */
  async demoteToHero(userId: string): Promise<User> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`/api/users/${userId}/demote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to demote user");
    }

    const data = await response.json();

    // Map database fields to User interface
    const profile = data.user;
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      familyId: profile.family_id,
      role: profile.role,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    };
  }

  /**
   * Count the number of Guild Masters in a family
   * @param familyId - The family ID to count Guild Masters for
   * @returns The count of Guild Masters
   */
  async countGuildMasters(familyId: string): Promise<number> {
    const { count, error } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId)
      .eq("role", "GUILD_MASTER");

    if (error) {
      throw new Error(`Failed to count Guild Masters: ${error.message}`);
    }

    return count || 0;
  }
}

export const userService = new UserService();
