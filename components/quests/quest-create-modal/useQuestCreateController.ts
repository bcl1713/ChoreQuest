"use client";

import { useCallback, useState } from "react";
import { createAdhocQuest, createQuestFromTemplate, createRecurringTemplate, validateDueDate } from "./quest-modal-helpers";
import type { TemplateFormData } from "@/lib/types/quest-templates";
import type { QuestCategory, QuestDifficulty } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/database";

const initialRecurringForm: TemplateFormData = {
  title: "",
  description: "",
  category: "DAILY",
  quest_type: "FAMILY",
  recurrence_pattern: "DAILY",
  difficulty: "MEDIUM",
  xp_reward: 50,
  gold_reward: 25,
  assigned_character_ids: [],
  class_bonuses: null,
};

type UseQuestCreateControllerArgs = {
  user: User | null;
  profile: UserProfile | null;
  onQuestCreated: () => void;
  onClose: () => void;
};

export function useQuestCreateController({
  user,
  profile,
  onQuestCreated,
  onClose,
}: UseQuestCreateControllerArgs) {
  const [mode, setMode] = useState<"adhoc" | "existing" | "recurring">("adhoc");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(50);
  const [goldReward, setGoldReward] = useState(10);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("EASY");
  const [category, setCategory] = useState<QuestCategory>("DAILY");
  const [recurringForm, setRecurringForm] = useState<TemplateFormData>(initialRecurringForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setMode("adhoc");
    setSelectedTemplateId("");
    setAssignedToId("");
    setDueDate("");
    setTitle("");
    setDescription("");
    setXpReward(50);
    setGoldReward(10);
    setDifficulty("EASY");
    setCategory("DAILY");
    setError(null);
    setRecurringForm(initialRecurringForm);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const updateRecurringForm = useCallback((updates: Partial<TemplateFormData>) => {
    setRecurringForm((prev) => {
      const next = { ...prev, ...updates } as TemplateFormData;
      if (updates.recurrence_pattern) {
        next.category = updates.recurrence_pattern === "WEEKLY" ? "WEEKLY" : "DAILY";
      }
      return next;
    });
  }, []);

  const handleRecurringInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      switch (name) {
        case "title":
        case "description":
        case "quest_type":
        case "recurrence_pattern":
        case "difficulty":
          updateRecurringForm({ [name]: value } as Partial<TemplateFormData>);
          if (name === "quest_type" && value === "FAMILY") {
            updateRecurringForm({ assigned_character_ids: [] });
          }
          break;
        case "xp_reward":
        case "gold_reward":
          updateRecurringForm({
            [name]: Number(value),
          } as Partial<TemplateFormData>);
          break;
        default:
          break;
      }
    },
    [updateRecurringForm]
  );

  const toggleRecurringCharacter = useCallback((characterId: string) => {
    setRecurringForm((prev) => {
      const assigned = prev.assigned_character_ids ?? [];
      if (assigned.includes(characterId)) {
        return {
          ...prev,
          assigned_character_ids: assigned.filter((id) => id !== characterId),
        };
      }
      return { ...prev, assigned_character_ids: [...assigned, characterId] };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user || !profile) {
        setError("User not authenticated");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (mode === "existing") {
          const validation = validateDueDate(dueDate);
          if (!validation.isValid) {
            setError(validation.error);
            return;
          }

          await createQuestFromTemplate({
            selectedTemplateId,
            userId: user.id,
            assignedToId,
            dueDate,
          });
        } else if (mode === "recurring") {
          await createRecurringTemplate({
            formData: recurringForm,
            familyId: profile.family_id ?? "",
          });
        } else {
          const validation = validateDueDate(dueDate);
          if (!validation.isValid) {
            setError(validation.error);
            return;
          }

          await createAdhocQuest({
            title,
            description,
            xpReward,
            goldReward,
            difficulty,
            category,
            familyId: profile.family_id,
            userId: user.id,
            assignedToId,
            dueDate,
          });
        }

        handleClose();
        void Promise.resolve(onQuestCreated()).catch((callbackError) => {
          console.error("QuestCreateModal: failed to refresh quest data after creation", callbackError);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create quest");
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      profile,
      mode,
      dueDate,
      selectedTemplateId,
      assignedToId,
      recurringForm,
      title,
      description,
      xpReward,
      goldReward,
      difficulty,
      category,
      onQuestCreated,
      handleClose,
    ]
  );

  return {
    mode,
    setMode,
    selectedTemplateId,
    setSelectedTemplateId,
    assignedToId,
    setAssignedToId,
    dueDate,
    setDueDate,
    title,
    setTitle,
    description,
    setDescription,
    xpReward,
    setXpReward,
    goldReward,
    setGoldReward,
    difficulty,
    setDifficulty,
    category,
    setCategory,
    recurringForm,
    handleRecurringInputChange,
    toggleRecurringCharacter,
    updateRecurringForm,
    loading,
    error,
    handleSubmit,
    handleClose,
  };
}
