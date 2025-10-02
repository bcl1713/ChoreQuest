// Quest management service
import {
  QuestTemplate,
  QuestInstance,
  QuestDifficulty,
  QuestCategory,
  QuestStatus,
} from "@/lib/types/database";

export interface CreateQuestTemplateRequest {
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  classBonuses?: Record<string, number>;
}

export interface CreateQuestInstanceFromTemplateRequest {
  templateId: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface CreateQuestInstanceAdHocRequest {
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateQuestStatusRequest {
  status: QuestStatus;
}

export class QuestService {
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

  private async request(endpoint: string, options?: RequestInit) {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use absolute URL for testing environment
    const baseUrl =
      typeof window !== "undefined" ? "" : "http://localhost:3000";
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Quest Templates
  async getQuestTemplates(): Promise<{ templates: QuestTemplate[] }> {
    return this.request("/api/quest-templates");
  }

  async createQuestTemplate(
    data: CreateQuestTemplateRequest,
  ): Promise<{ template: QuestTemplate }> {
    return this.request("/api/quest-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Quest Instances
  async getQuestInstances(): Promise<{ instances: QuestInstance[] }> {
    return this.request("/api/quest-instances");
  }

  async createQuestInstanceFromTemplate(
    data: CreateQuestInstanceFromTemplateRequest,
  ): Promise<{ instance: QuestInstance }> {
    return this.request("/api/quest-instances", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createQuestInstanceAdHoc(
    data: CreateQuestInstanceAdHocRequest,
  ): Promise<{ instance: QuestInstance }> {
    return this.request("/api/quest-instances", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateQuestStatus(
    questId: string,
    data: UpdateQuestStatusRequest,
  ): Promise<{ instance: QuestInstance }> {
    return this.request(`/api/quest-instances/${questId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Quest Rewards & Approval
  async approveQuest(
    questId: string,
    approverId: string,
  ): Promise<QuestApprovalResponse> {
    return this.request(`/api/quest-instances/${questId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approverId }),
    });
  }

  async getCharacterStats(
    characterId: string,
  ): Promise<CharacterStatsResponse> {
    return this.request(`/api/characters/${characterId}/stats`);
  }

  async getTransactionHistory(
    characterId: string,
  ): Promise<TransactionResponse[]> {
    return this.request(`/api/characters/${characterId}/transactions`);
  }

  async assignQuest(
    questId: string,
    assigneeId: string,
  ): Promise<{ success: boolean }> {
    const response = await fetch(`/api/quest-instances/${questId}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ assigneeId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to assign quest: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  }

  async cancelQuest(questId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/quest-instances/${questId}/cancel`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel quest");
    }

    return await response.json();
  }
}

// Types for quest rewards API
export interface QuestApprovalResponse {
  success: boolean;
  message: string;
  rewards?: {
    gold: number;
    xp: number;
    gems: number;
    honorPoints: number;
  };
  characterUpdates?: {
    newLevel?: number;
    leveledUp?: boolean;
  };
  transaction?: {
    id: string;
    type: "QUEST_REWARD";
    description: string;
    createdAt: string;
  };
}

export interface CharacterStatsResponse {
  character: {
    id: string;
    name: string;
    class: string;
    level: number;
    xp: number;
    gold: number;
    gems: number;
    honorPoints: number;
  };
}

export interface TransactionResponse {
  id: string;
  type: string;
  description: string;
  questId?: string;
  goldChange?: number;
  xpChange?: number;
  gemsChange?: number;
  honorPointsChange?: number;
  metadata?: {
    levelUp?: {
      previousLevel: number;
      newLevel: number;
    };
  };
  createdAt: string;
}

export const questService = new QuestService();
