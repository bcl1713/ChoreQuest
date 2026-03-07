"use client";

import { useCallback, useEffect, useState } from "react";
import { QuestTemplate } from "@/lib/types/database";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/realtime-context";

type UseQuestTemplatesOptions = {
  familyId?: string | null;
  enabled: boolean;
};

export function useQuestTemplates({
  familyId,
  enabled,
}: UseQuestTemplatesOptions) {
  const { onQuestTemplateUpdate } = useRealtime();
  const [questTemplates, setQuestTemplates] = useState<QuestTemplate[]>([]);

  const loadQuestTemplates = useCallback(async () => {
    if (!enabled || !familyId) return;

    const { data: templates, error } = await supabase
      .from("quest_templates")
      .select("*")
      .eq("family_id", familyId)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to load quest templates:", error);
      return;
    }

    setQuestTemplates(templates || []);
  }, [enabled, familyId]);

  useEffect(() => {
    if (!enabled || !familyId) return;
    loadQuestTemplates().catch((err) =>
      console.error("Failed to load quest templates:", err),
    );
  }, [enabled, familyId, loadQuestTemplates]);

  useEffect(() => {
    if (!enabled || !familyId) return;

    const unsubscribe = onQuestTemplateUpdate((event) => {
      setQuestTemplates((currentTemplates) => {
        if (event.action === "INSERT") {
          const newTemplate = event.record as QuestTemplate;
          if (newTemplate.is_active) {
            return [...currentTemplates, newTemplate];
          }
          return currentTemplates;
        }

        if (event.action === "UPDATE") {
          const partial = event.record as Partial<QuestTemplate>;
          const existsInList = currentTemplates.some(
            (t) => t.id === partial.id,
          );

          if (existsInList) {
            return currentTemplates
              .map((template) =>
                template.id === partial.id
                  ? { ...template, ...partial }
                  : template,
              )
              .filter((t) => t.is_active);
          }

          if (partial.is_active !== false) {
            return [...currentTemplates, partial as QuestTemplate];
          }

          return currentTemplates;
        }

        if (event.action === "DELETE") {
          return currentTemplates.filter(
            (template) => template.id !== event.old_record?.id,
          );
        }

        return currentTemplates;
      });
    });

    return unsubscribe;
  }, [enabled, familyId, onQuestTemplateUpdate]);

  return { questTemplates, reloadQuestTemplates: loadQuestTemplates };
}
