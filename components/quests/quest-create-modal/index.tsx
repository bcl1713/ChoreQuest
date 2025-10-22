"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  QuestDifficulty,
  QuestCategory,
  QuestTemplate,
} from "@/lib/types/database";
import type { TemplateFormData } from "@/lib/types/quest-templates";
import { motion, AnimatePresence } from "framer-motion";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import AdhocQuestForm from "./adhoc-quest-form";
import RecurringQuestForm from "./recurring-quest-form";
import TemplateQuestForm from "./template-quest-form";
import {
  createQuestFromTemplate,
  createRecurringTemplate,
  createAdhocQuest,
  validateDueDate,
} from "./quest-modal-helpers";

interface QuestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestCreated: () => void;
  templates: QuestTemplate[];
}

export default function QuestCreateModal({
  isOpen,
  onClose,
  onQuestCreated,
  templates,
}: QuestCreateModalProps) {
  const { user, profile } = useAuth();

  // Use custom hook for family members
  const { familyMembers, familyCharacters } = useFamilyMembers();

  const [mode, setMode] = useState<"adhoc" | "existing" | "recurring">("adhoc");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Ad-hoc quest fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(50);
  const [goldReward, setGoldReward] = useState(10);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("EASY");
  const [category, setCategory] = useState<QuestCategory>("DAILY");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurringForm, setRecurringForm] = useState<TemplateFormData>({
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
  });

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
    setRecurringForm({
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
    });
  }, []);

  const updateRecurringForm = useCallback((updates: Partial<TemplateFormData>) => {
    setRecurringForm((prev) => {
      const next = { ...prev, ...updates } as TemplateFormData;
      if (updates.recurrence_pattern) {
        next.category = updates.recurrence_pattern === "WEEKLY" ? "WEEKLY" : "DAILY";
      }
      return next;
    });
  }, []);

  const handleRecurringInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
        updateRecurringForm({ [name]: Number(value) } as Partial<TemplateFormData>);
        break;
      default:
        break;
    }
  }, [updateRecurringForm]);

  const toggleRecurringCharacter = useCallback((characterId: string) => {
    setRecurringForm((prev) => {
      const assigned = prev.assigned_character_ids ?? [];
      if (assigned.includes(characterId)) {
        return { ...prev, assigned_character_ids: assigned.filter((id) => id !== characterId) };
      }
      return { ...prev, assigned_character_ids: [...assigned, characterId] };
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    let questCreated = false;

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

      questCreated = true;
      handleClose();

      void Promise.resolve(onQuestCreated()).catch((callbackError) => {
        console.error(
          "QuestCreateModal: failed to refresh quest data after creation",
          callbackError,
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quest");
    } finally {
      setLoading(false);
      if (!questCreated && !isOpen) {
        resetForm();
      }
    }
  }, [user, profile, mode, dueDate, selectedTemplateId, assignedToId, recurringForm, title, description, xpReward, goldReward, difficulty, category, handleClose, onQuestCreated, isOpen, resetForm]);

  // Memoize assignee options to prevent re-processing on every render
  const assigneeOptions = useMemo(() => {
    return familyMembers.map((member) => {
      const roleLabel = member.role ? member.role.replace("_", " ") : "Member";
      const displayName = member.name || member.email;
      return {
        id: member.id,
        label: `${displayName} (${roleLabel})`,
      };
    });
  }, [familyMembers]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
          data-testid="create-quest-modal"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fantasy-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-fantasy text-gray-100">
                ⚡ Create New Quest
              </h2>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-200 text-xl h-auto w-auto"
                aria-label="Close"
              >
                ×
              </Button>
            </div>

            {/* Mode Selection */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-0 mb-6">
              <Button
                type="button"
                data-testid="existing-mode-button"
                onClick={() => setMode("existing")}
                variant={mode === "existing" ? "gold" : "ghost"}
                size="sm"
                className="w-full sm:flex-1 rounded-lg sm:rounded-l-lg"
              >
                From Template
              </Button>
              <Button
                type="button"
                data-testid="adhoc-mode-button"
                onClick={() => setMode("adhoc")}
                variant={mode === "adhoc" ? "gold" : "ghost"}
                size="sm"
                className={cn(
                  "w-full sm:flex-1 rounded-lg sm:rounded-none",
                  profile?.role !== "GUILD_MASTER" && "sm:rounded-r-lg",
                )}
              >
                One-Time Quest
              </Button>
              {profile?.role === "GUILD_MASTER" && (
                <Button
                  type="button"
                  data-testid="recurring-mode-button"
                  onClick={() => setMode("recurring")}
                  variant={mode === "recurring" ? "gold" : "ghost"}
                  size="sm"
                  className="w-full sm:flex-1 rounded-lg sm:rounded-r-lg"
                >
                  Recurring Template
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "existing" ? (
                <TemplateQuestForm
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onTemplateSelect={setSelectedTemplateId}
                />
              ) : mode === "recurring" ? (
                <RecurringQuestForm
                  formData={recurringForm}
                  familyMembers={familyMembers}
                  familyCharacters={familyCharacters}
                  onInputChange={handleRecurringInputChange}
                  onToggleCharacter={toggleRecurringCharacter}
                />
              ) : (
                <AdhocQuestForm
                  title={title}
                  description={description}
                  xpReward={xpReward}
                  goldReward={goldReward}
                  difficulty={difficulty}
                  category={category}
                  onTitleChange={setTitle}
                  onDescriptionChange={setDescription}
                  onXpRewardChange={setXpReward}
                  onGoldRewardChange={setGoldReward}
                  onDifficultyChange={setDifficulty}
                  onCategoryChange={setCategory}
                />
              )}

              {/* Common Fields */}
              {mode !== "recurring" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="assign-to" className="block text-sm font-medium text-gray-200 mb-2">
                      Assign To (Optional)
                    </label>
                    <select
                      id="assign-to"
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="">Leave unassigned</option>
                      {assigneeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="due-date" className="block text-sm font-medium text-gray-200 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      id="due-date"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 text-red-200">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  data-testid="cancel-quest-button"
                  onClick={handleClose}
                  variant="outline"
                  className="px-6 py-2 border border-gray-600 text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="submit-quest-button"
                  disabled={loading}
                  variant="gold-solid"
                  className="px-6 py-2 text-white font-medium"
                >
                  {loading ? "Creating..." : "⚡ Create Quest"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
