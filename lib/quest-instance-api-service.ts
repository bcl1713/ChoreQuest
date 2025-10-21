/**
 * Client-side Quest Instance API Service
 * Handles all API calls for quest instances
 */

import { supabase } from '@/lib/supabase';

class QuestInstanceApiService {
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  async claimQuest(questId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quests/${questId}/claim`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to claim quest');
    }
  }

  async approveQuest(questId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-instances/${questId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to approve quest' }));
      throw new Error(errorData.error || 'Failed to approve quest');
    }
  }

  async assignFamilyQuest(questId: string, characterId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-instances/${questId}/assign`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to assign quest' }));
      throw new Error(errorData.error || 'Failed to assign quest');
    }
  }

  async cancelQuest(questId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-instances/${questId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to cancel quest' }));
      throw new Error(errorData.error || 'Failed to cancel quest');
    }
  }

  async releaseQuest(questId: string, characterId?: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-instances/${questId}/release`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to release quest' }));
      throw new Error(errorData.error || 'Failed to release quest');
    }
  }

  async denyQuest(questId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-instances/${questId}/deny`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to deny quest' }));
      throw new Error(errorData.error || 'Failed to deny quest');
    }
  }
}

export const questInstanceApiService = new QuestInstanceApiService();
