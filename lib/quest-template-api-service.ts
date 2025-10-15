import { supabase } from "@/lib/supabase";
import type { TemplateFormData } from "@/lib/types/quest-templates";
import type { QuestTemplate } from "@/lib/types/database";

class QuestTemplateApiService {
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

  private async getFamilyId(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("family_id")
      .eq("id", userId)
      .single();

    if (error || !data?.family_id) {
      throw new Error("Unable to determine family for current user");
    }

    return data.family_id;
  }

  async createTemplate(formData: TemplateFormData): Promise<QuestTemplate> {
    const token = await this.getAuthToken();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      throw new Error("Authentication failed");
    }

    const familyId = await this.getFamilyId(user.id);

    const response = await fetch("/api/quest-templates", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        family_id: familyId,
      }),
    });

    if (!response.ok) {
      let message = "Failed to create quest template";
      try {
        const errorPayload = await response.json();
        if (errorPayload?.error) {
          message = errorPayload.error;
        }
      } catch {
        // ignore JSON parse issues
      }
      throw new Error(message);
    }

    const payload = (await response.json()) as {
      template?: QuestTemplate;
    };

    if (!payload.template) {
      throw new Error("Quest template response missing payload");
    }

    return payload.template;
  }
}

export const questTemplateApiService = new QuestTemplateApiService();
