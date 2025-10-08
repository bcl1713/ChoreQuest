"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  QuestDifficulty,
  QuestCategory,
  QuestTemplate,
} from "@/lib/types/database";
import { questTemplateService } from "@/lib/quest-template-service";
import { motion, AnimatePresence } from "framer-motion";

interface QuestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestCreated: () => void;
  templates: QuestTemplate[];
}

interface User {
  id: string;
  username: string;
  role: string;
}


export default function QuestCreateModal({
  isOpen,
  onClose,
  onQuestCreated,
  templates,
}: QuestCreateModalProps) {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<"template" | "adhoc">("adhoc");
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

  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (membersData) {
        // Transform to match User interface
        const transformedMembers = membersData.map(member => ({
          id: member.id,
          username: member.name,
          role: member.role,
        }));
        setFamilyMembers(transformedMembers);
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
  };

  const validateDueDate = (dueDate: string): boolean => {
    if (!dueDate) return true; // Optional field

    const selectedDate = new Date(dueDate);
    const now = new Date();

    return selectedDate > now;
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
      if (dueDate && !validateDueDate(dueDate)) {
        setError("Due date must be in the future");
        return;
      }

      if (mode === "template") {
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
      } else {
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
                data-testid="template-mode-button"
                onClick={() => setMode("template")}
                className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                  mode === "template"
                    ? "bg-gold-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                From Template
              </button>
              <button
                data-testid="adhoc-mode-button"
                onClick={() => setMode("adhoc")}
                className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                  mode === "adhoc"
                    ? "bg-gold-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                Custom Quest
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "template" ? (
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
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username} ({member.role.replace("_", " ")})
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
