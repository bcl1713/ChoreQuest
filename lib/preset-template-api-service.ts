import { supabase } from '@/lib/supabase';
import type { PresetTemplateCollection } from '@/lib/preset-templates';
import type { QuestTemplate } from '@/lib/types/database';

class PresetTemplateApiService {
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  async getPresetTemplates(): Promise<PresetTemplateCollection> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/quest-templates/presets', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preset templates');
    }
    return response.json() as Promise<PresetTemplateCollection>;
  }

  async enablePreset(presetId: string): Promise<{ success: boolean; template: QuestTemplate }> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/quest-templates/presets/${presetId}/enable`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enable preset');
    }
    return response.json() as Promise<{ success: boolean; template: QuestTemplate }>;
  }
}

export const presetTemplateApiService = new PresetTemplateApiService();
