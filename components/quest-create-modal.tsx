"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  QuestDifficulty,
  QuestCategory,
  QuestTemplate,
  Tables,
} from "@/lib/types/database";
import type { TemplateFormData } from "@/lib/types/quest-templates";
import { questTemplateService } from "@/lib/quest-template-service";
import { motion, AnimatePresence } from "framer-motion";

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

  const defaultRecurringForm: TemplateFormData = {
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

  const [familyMembers, setFamilyMembers] = useState<Tables<"user_profiles">[]>([]);
  const [familyCharacters, setFamilyCharacters] = useState<Tables<"characters">[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurringForm, setRecurringForm] = useState<TemplateFormData>(defaultRecurringForm);

  const loadFamilyMembers = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('family_id', profile.family_id);

      if (membersError) {
        throw membersError;
      }

      const members = membersData ?? [];
      setFamilyMembers(members);

      const memberIds = members.map((member) => member.id);
      if (memberIds.length > 0) {
        const { data: charactersData, error: charactersError } = await supabase
          .from("characters")
          .select("*")
          .in("user_id", memberIds);

        if (charactersError) {
          throw charactersError;
        }

        setFamilyCharacters(charactersData || []);
      } else {
        setFamilyCharacters([]);
      }
    } catch {
      setError("Failed to load family members");
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers();
    }
  }, [isOpen, loadFamilyMembers]);

  const resetForm = () => {
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
    setRecurringForm(defaultRecurringForm);
  };

  const validateDueDate = (dueDate: string): boolean => {
    if (!dueDate) return true; // Optional field

    const selectedDate = new Date(dueDate);
    const now = new Date();

    return selectedDate > now;
  };

  const updateRecurringForm = (updates: Partial<TemplateFormData>) => {
    setRecurringForm((prev) => {
      const next = { ...prev, ...updates } as TemplateFormData;
      if (updates.recurrence_pattern) {
        next.category = updates.recurrence_pattern === "WEEKLY" ? "WEEKLY" : "DAILY";
      }
      return next;
    });
  };

  const handleRecurringInputChange = (
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
  };

  const toggleRecurringCharacter = (characterId: string) => {
    setRecurringForm((prev) => {
      const assigned = prev.assigned_character_ids ?? [];
      if (assigned.includes(characterId)) {
        return { ...prev, assigned_character_ids: assigned.filter((id) => id !== characterId) };
      }
      return { ...prev, assigned_character_ids: [...assigned, characterId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        if (dueDate && !validateDueDate(dueDate)) {
          setError("Due date must be in the future");
          return;
        }

        if (!selectedTemplateId) {
          setError("Please select a quest template");
          return;
        }

        await questTemplateService.createQuestFromTemplate(
          selectedTemplateId,
          user.id,
          {
            assignedToId: assignedToId || undefined,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          },
        );
      } else if (mode === "recurring") {
        if (!profile.family_id) {
          throw new Error("Family context not found");
        }

        if (!recurringForm.title.trim() || !recurringForm.description.trim()) {
          setError("Please fill in all required fields");
          return;
        }

        if (
          recurringForm.quest_type === "INDIVIDUAL" &&
          recurringForm.assigned_character_ids.length === 0
        ) {
          setError("Select at least one hero for individual recurring quests");
          return;
        }

        const payload = {
          ...recurringForm,
          title: recurringForm.title.trim(),
          description: recurringForm.description.trim(),
          category:
            recurringForm.recurrence_pattern === "WEEKLY" ? "WEEKLY" : "DAILY",
          family_id: profile.family_id,
          is_active: true,
          is_paused: false,
        };

        const { error: templateError } = await supabase
          .from("quest_templates")
          .insert(payload);

        if (templateError) {
          throw templateError;
        }
      } else {
        if (dueDate && !validateDueDate(dueDate)) {
          setError("Due date must be in the future");
          return;
        }

        if (!title.trim() || !description.trim()) {
          setError("Please fill in all required fields");
          return;
        }

        const questData = {
          title: title.trim(),
          description: description.trim(),
          xp_reward: xpReward,
          gold_reward: goldReward,
          difficulty,
          category,
          status: "PENDING",
          family_id: profile.family_id,
          created_by_id: user.id,
          assigned_to_id: assignedToId || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        };

        const { error: insertError } = await supabase
          .from("quest_instances")
          .insert(questData);

        if (insertError) {
          throw insertError;
        }
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
        // If the modal was closed externally while we were processing,
        // ensure form state is reset.
        resetForm();
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

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
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Mode Selection */}
            <div className="flex mb-6">
              <button
                data-testid="existing-mode-button"
                onClick={() => setMode("existing")}
                className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                  mode === "existing"
                    ? "bg-gold-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                From Template
              </button>
              <button
                data-testid="adhoc-mode-button"
                onClick={() => setMode("adhoc")}
                className={`flex-1 py-2 px-4 font-medium transition-colors ${
                  profile?.role !== "GUILD_MASTER" ? "rounded-r-lg " : ""
                }${
                  mode === "adhoc"
                    ? "bg-gold-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                One-Time Quest
              </button>
              {profile?.role === "GUILD_MASTER" && (
                <button
                  data-testid="recurring-mode-button"
                  onClick={() => setMode("recurring")}
                  className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                    mode === "recurring"
                      ? "bg-gold-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Recurring Template
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "existing" ? (
                <>
                  {/* Template Selection */}
                  <div>
                    <label htmlFor="template-select" className="block text-sm font-medium text-gray-200 mb-2">
                      Select Template
                    </label>
                    <select
                      id="template-select"
                      data-testid="template-select"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      required
                    >
                      <option value="">Choose a quest template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.title} - {template.difficulty} (
                          {template.xp_reward} XP, {template.gold_reward} Gold)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template Preview */}
                  {selectedTemplate && (
                    <div data-testid="template-preview" className="bg-dark-800 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-100 mb-2">
                        {selectedTemplate.title}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {selectedTemplate.description}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-yellow-400">
                          {selectedTemplate.difficulty}
                        </span>
                        <span className="text-blue-400">
                          {selectedTemplate.category}
                        </span>
                        <span className="text-gold-400">
                          💰 {selectedTemplate.gold_reward}
                        </span>
                        <span className="xp-text">
                          ⚡ {selectedTemplate.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : mode === "recurring" ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Template Title</label>
                      <input
                        type="text"
                        name="title"
                        value={recurringForm.title}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                        placeholder="e.g., Make Bed"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Recurrence</label>
                      <select
                        name="recurrence_pattern"
                        value={recurringForm.recurrence_pattern}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Custom intervals coming soon. Choose daily or weekly for now.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={recurringForm.description}
                      onChange={handleRecurringInputChange}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      rows={3}
                      placeholder="Describe what heroes should do each time this repeats"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Quest Type</label>
                      <select
                        name="quest_type"
                        value={recurringForm.quest_type}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="FAMILY">Family (claimable by any hero)</option>
                        <option value="INDIVIDUAL">Individual (auto-assigned)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Difficulty</label>
                      <select
                        name="difficulty"
                        value={recurringForm.difficulty}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">XP Reward</label>
                      <input
                        type="number"
                        name="xp_reward"
                        min={0}
                        value={recurringForm.xp_reward}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Gold Reward</label>
                      <input
                        type="number"
                        name="gold_reward"
                        min={0}
                        value={recurringForm.gold_reward}
                        onChange={handleRecurringInputChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-3 text-sm text-gray-300">
                      <p>Volunteer heroes receive a +20% bonus automatically when they claim family quests.</p>
                    </div>
                  </div>

                  {recurringForm.quest_type === "INDIVIDUAL" && (
                    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-200 mb-3">
                        Assign to Heroes
                      </h4>
                      {familyCharacters.length === 0 ? (
                        <p className="text-sm text-gray-400">No hero characters available yet. Have heroes create their characters first.</p>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-3">
                          {familyCharacters.map((familyCharacter) => {
                            const owner = familyMembers.find((member) => member.id === familyCharacter.user_id);
                            return (
                              <label key={familyCharacter.id} className="flex items-center gap-2 text-sm text-gray-200">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-gold-500"
                                  checked={recurringForm.assigned_character_ids.includes(familyCharacter.id)}
                                  onChange={() => toggleRecurringCharacter(familyCharacter.id)}
                                />
                                <span>
                                  {familyCharacter.name}
                                  {owner ? ` (${owner.name || owner.email})` : ""}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Individual recurring quests generate one task per selected hero each cycle.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Custom Quest Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Quest Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                        placeholder="Enter quest title..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as QuestCategory)
                        }
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="BOSS_BATTLE">Boss Battle</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      rows={3}
                      placeholder="Describe the quest..."
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Difficulty
                      </label>
                      <select
                        data-testid="quest-difficulty-select"
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(e.target.value as QuestDifficulty)
                        }
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        XP Reward
                      </label>
                      <input
                        type="number"
                        value={xpReward}
                        onChange={(e) =>
                          setXpReward(parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Gold Reward
                      </label>
                      <input
                        type="number"
                        value={goldReward}
                        onChange={(e) =>
                          setGoldReward(parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields */}
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
                            {familyMembers.map((member) => {
                              const roleLabel = member.role ? member.role.replace("_", " ") : "Member";
                              const displayName = member.name || member.email;
                              return (
                                <option key={member.id} value={member.id}>
                                  {displayName} ({roleLabel})
                                </option>
                              );
                            })}
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

              {error && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 text-red-200">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  data-testid="cancel-quest-button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-600 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-quest-button"
                  disabled={loading}
                  className="px-6 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "⚡ Create Quest"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
