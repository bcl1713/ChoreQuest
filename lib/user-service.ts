import { User } from "@/types";

class UserService {
  private getAuthToken(): string | null {
    // Get token from localStorage (same as auth-context)
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("chorequest-auth");
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      return parsed.token;
    } catch {
      return null;
    }
  }

  async getFamilyMembers(): Promise<User[]> {
    const response = await fetch("/api/users/family-members", {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load family members");
    }

    const data = await response.json();
    return data.members;
  }
}

export const userService = new UserService();
