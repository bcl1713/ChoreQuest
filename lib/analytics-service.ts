import { supabase } from '@/lib/supabase';

export interface CompletionRateRecord {
  template_id: string | null;
  completion_rate: number | null;
}

export interface MissedQuestRecord {
  template_id: string | null;
  missed_count: number | null;
}

export interface VolunteerPatternRecord {
  character_id: string | null;
  volunteer_count: number | null;
}

class AnalyticsService {
  async getCompletionRateByTemplate(familyId: string): Promise<CompletionRateRecord[]> {
    const { data, error } = await supabase.rpc('get_completion_rate_by_template', {
      p_family_id: familyId,
    });

    if (error) {
      console.error('Error fetching completion rate by template:', error);
      return [];
    }

    return (data as CompletionRateRecord[] | null) ?? [];
  }

  async getMostMissedQuests(familyId: string): Promise<MissedQuestRecord[]> {
    const { data, error } = await supabase.rpc('get_most_missed_quests', {
      p_family_id: familyId,
    });

    if (error) {
      console.error('Error fetching most missed quests:', error);
      return [];
    }

    return (data as MissedQuestRecord[] | null) ?? [];
  }

  async getVolunteerPatterns(familyId: string): Promise<VolunteerPatternRecord[]> {
    const { data, error } = await supabase.rpc('get_volunteer_patterns', {
      p_family_id: familyId,
    });

    if (error) {
      console.error('Error fetching volunteer patterns:', error);
      return [];
    }

    return (data as VolunteerPatternRecord[] | null) ?? [];
  }
}

export const analyticsService = new AnalyticsService();
