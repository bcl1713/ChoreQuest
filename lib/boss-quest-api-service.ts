import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/database-generated";

export type BossQuest = Database["public"]["Tables"]["boss_battles"]["Row"];

export class BossQuestApiService {
  private async getAuthToken(): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Authentication required");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      throw new Error("Authentication required");
    }

    return token;
  }

  async createBossQuest(input: {
    name: string;
    description: string;
    reward_gold: number;
    reward_xp: number;
    join_window_minutes?: number;
  }): Promise<BossQuest> {
    const token = await this.getAuthToken();

    const response = await fetch("/api/boss-quests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || "Failed to create boss quest";
      throw new Error(message);
    }

    const payload = (await response.json()) as { bossQuest: BossQuest };
    return payload.bossQuest;
  }

  async joinBossQuest(bossQuestId: string): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`/api/boss-quests/${bossQuestId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || "Failed to join boss quest";
      throw new Error(message);
    }
  }

  async completeBossQuest(bossQuestId: string): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`/api/boss-quests/${bossQuestId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decisions: [] }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || "Failed to complete boss quest";
      throw new Error(message);
    }
  }

  async completeBossQuestWithDecisions(
    bossQuestId: string,
    decisions: Array<{
      userId: string;
      status: "APPROVED" | "PARTIAL" | "DENIED";
      gold?: number;
      xp?: number;
      honor?: number;
    }>
  ): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`/api/boss-quests/${bossQuestId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decisions }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || "Failed to complete boss quest";
      throw new Error(message);
    }
  }

  async reopenJoinWindow(bossQuestId: string, minutes: number): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch(`/api/boss-quests/${bossQuestId}/reopen`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ minutes }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || "Failed to reopen join window";
      throw new Error(message);
    }
  }
}

export const bossQuestApiService = new BossQuestApiService();
