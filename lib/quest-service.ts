// Quest management service
import { QuestTemplate, QuestInstance, QuestDifficulty, QuestCategory, QuestStatus } from '@/lib/generated/prisma';

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
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('chorequest-auth');
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
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Quest Templates
  async getQuestTemplates(): Promise<{ templates: QuestTemplate[] }> {
    return this.request('/api/quest-templates');
  }

  async createQuestTemplate(data: CreateQuestTemplateRequest): Promise<{ template: QuestTemplate }> {
    return this.request('/api/quest-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quest Instances
  async getQuestInstances(): Promise<{ instances: QuestInstance[] }> {
    return this.request('/api/quest-instances');
  }

  async createQuestInstanceFromTemplate(data: CreateQuestInstanceFromTemplateRequest): Promise<{ instance: QuestInstance }> {
    return this.request('/api/quest-instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createQuestInstanceAdHoc(data: CreateQuestInstanceAdHocRequest): Promise<{ instance: QuestInstance }> {
    return this.request('/api/quest-instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestStatus(questId: string, data: UpdateQuestStatusRequest): Promise<{ instance: QuestInstance }> {
    return this.request(`/api/quest-instances/${questId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const questService = new QuestService();