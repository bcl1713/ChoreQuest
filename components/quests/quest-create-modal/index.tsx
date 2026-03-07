"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { QuestTemplate } from "@/lib/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import AdhocQuestForm from "./adhoc-quest-form";
import RecurringQuestForm from "./recurring-quest-form";
import TemplateQuestForm from "./template-quest-form";
import { useQuestCreateController } from "./useQuestCreateController";
import { X, Zap } from "lucide-react";

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
  const { familyMembers, familyCharacters } = useFamilyMembers();
  const {
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
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useQuestCreateController({
    user,
    profile,
    onQuestCreated,
    onClose,
  });

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
              <h2 className="text-2xl font-fantasy text-gray-100 flex items-center gap-2">
                <Zap size={28} className="text-yellow-400" />
                Create New Quest
              </h2>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon-sm"
                className="text-gray-400 hover:text-gray-20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
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
                    <label
                      htmlFor="assign-to"
                      className="block text-sm font-medium text-gray-200 mb-2"
                    >
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
                    <label
                      htmlFor="due-date"
                      className="block text-sm font-medium text-gray-200 mb-2"
                    >
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
                  className="px-6 py-2 text-white font-medium flex items-center gap-2"
                >
                  {!loading && <Zap size={18} />}
                  {loading ? "Creating..." : "Create Quest"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
