import { supabase } from '@/lib/supabase';
import type { TemplateFormData } from '@/lib/types/quest-templates';
import type { QuestTemplate } from '@/lib/types/database';

class QuestConversionApiService {
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  async convertQuestToTemplate(
    questId: string,
    templateData: TemplateFormData,
    deleteOriginal: boolean
  ): Promise<{ success: boolean; template: QuestTemplate }> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quests/${questId}/convert-to-template`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateData, deleteOriginal }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to convert quest');
    }
    return response.json() as Promise<{ success: boolean; template: QuestTemplate }>;
  }
}

export const questConversionApiService = new QuestConversionApiService();
