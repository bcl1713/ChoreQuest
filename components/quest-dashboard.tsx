"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { supabase } from "@/lib/supabase";
import {
  QuestInstance,
  QuestDifficulty,
  QuestStatus,
  UserProfile,
  Tables,
} from "@/lib/types/database";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import FamilyQuestClaiming from "./family-quest-claiming";
import { questInstanceApiService } from "@/lib/quest-instance-api-service";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";

type QuestDashboardProps = {
  onError: (error: string) => void;
  onLoadQuestsRef?: (reload: () => Promise<void>) => void;
};

type LoadDataOptions = {
  useSpinner?: boolean;
};

const deduplicateQuests = (quests: QuestInstance[]): QuestInstance[] => {
  const seen = new Set<string>();
  return quests.filter((quest) => {
    if (seen.has(quest.id)) {
      return false;
    }
    seen.add(quest.id);
    return true;
  });
};

const getDifficultyColor = (difficulty: QuestDifficulty) => {
  switch (difficulty) {
    case "EASY":
      return "text-green-400";
    case "MEDIUM":
      return "text-yellow-400";
    case "HARD":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getStatusColor = (status: QuestStatus | null | undefined) => {
  switch (status) {
    case "PENDING":
      return "bg-gray-600 text-gray-200";
    case "IN_PROGRESS":
      return "bg-blue-600 text-blue-100";
    case "COMPLETED":
      return "bg-yellow-600 text-yellow-100";
    case "APPROVED":
      return "bg-green-600 text-green-100";
    case "EXPIRED":
    case "MISSED":
      return "bg-red-600 text-red-100";
    case "AVAILABLE":
      return "bg-emerald-700 text-emerald-100";
    case "CLAIMED":
      return "bg-purple-700 text-purple-100";
    default:
      return "bg-gray-600 text-gray-200";
  }
};

const formatDueDate = (dueDate: string | null) => {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays < 0) {
    return `🚨 Overdue (${formattedDate})`;
  }
  if (diffDays === 0) {
    return `⏰ Due Today ${formattedTime}`;
  }
  if (diffDays === 1) {
    return `📅 Due Tomorrow ${formattedTime}`;
  }
  return `📅 Due ${formattedDate} ${formattedTime}`;
};

const formatPercent = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  const normalized = value <= 1 ? value * 100 : value;
  if (normalized <= 0) return null;
  return `${Math.round(normalized)}%`;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getQuestTimestamp = (quest: QuestInstance) => {
  const toTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return 0;
    const value = new Date(timestamp).getTime();
    return Number.isFinite(value) ? value : 0;
  };

  return (
    toTime(quest.completed_at) ||
    toTime(quest.updated_at) ||
    toTime(quest.created_at)
  );
};

export default function QuestDashboard({ onError, onLoadQuestsRef }: QuestDashboardProps) {
  const { user, session, profile } = useAuth();
  const { onQuestUpdate } = useRealtime();
  const [questInstances, setQuestInstances] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [familyCharacters, setFamilyCharacters] = useState<Tables<"characters">[]>([]);
  const [character, setCharacter] = useState<Tables<"characters"> | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});
  const [selectedFamilyAssignments, setSelectedFamilyAssignments] = useState<Record<string, string>>({});
  const [showQuestHistory, setShowQuestHistory] = useState(false);
  const hasInitialized = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadQuests = useCallback(
    async (familyId: string) => {
      const { data, error: fetchError } = await supabase
        .from("quest_instances")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch quest instances: ${fetchError.message}`);
      }

      setQuestInstances(deduplicateQuests((data as QuestInstance[]) ?? []));
    },
    []
  );

  const loadData = useCallback(async (options: LoadDataOptions = {}) => {
    const shouldUseSpinner = options.useSpinner ?? !hasLoadedOnceRef.current;

    if (!user || !session || !profile) {
      setError("User not authenticated");
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (shouldUseSpinner) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);
    let loadSucceeded = false;

    try {
      // Load hero character (if any)
      const { data: characterData, error: characterError } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!characterError) {
        setCharacter(characterData);
      } else if (characterError.code !== "PGRST116") {
        throw new Error(`Failed to fetch character: ${characterError.message}`);
      } else {
        setCharacter(null);
      }

      // Load family members for assignment
      const { data: familyMembersData, error: familyMembersError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("family_id", profile.family_id);

      if (familyMembersError) {
        throw new Error(`Failed to fetch family members: ${familyMembersError.message}`);
      }

      setFamilyMembers(familyMembersData || []);

      const memberIds = (familyMembersData || []).map((member) => member.id);
      if (memberIds.length > 0) {
        const { data: charactersData, error: charactersError } = await supabase
          .from("characters")
          .select("*")
          .in("user_id", memberIds);

        if (charactersError) {
          throw new Error(`Failed to fetch family characters: ${charactersError.message}`);
        }

        setFamilyCharacters(charactersData || []);
        setSelectedFamilyAssignments({});
      } else {
        setFamilyCharacters([]);
        setSelectedFamilyAssignments({});
      }

      if (profile.family_id) {
        await loadQuests(profile.family_id);
      } else {
        setQuestInstances([]);
      }
      loadSucceeded = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      onError(message);
    } finally {
      if (shouldUseSpinner) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }

      if (loadSucceeded) {
        hasLoadedOnceRef.current = true;
      }
    }
  }, [loadQuests, onError, profile, session, user]);

  useEffect(() => {
    if (!onLoadQuestsRef) return;
    onLoadQuestsRef(() => loadData({ useSpinner: false }));
  }, [loadData, onLoadQuestsRef]);

  useEffect(() => {
    const isFirstRun = !hasInitialized.current;
    hasInitialized.current = true;
    void loadData({ useSpinner: isFirstRun });
  }, [loadData]);

  useEffect(() => {
    if (!profile?.family_id) return;

    const unsubscribe = onQuestUpdate((event) => {
      setQuestInstances((current) => {
        if (!event?.action) return current;
        const record = (event.record ?? {}) as Partial<QuestInstance>;
        const oldRecord = (event.old_record ?? {}) as Partial<QuestInstance>;

        if (event.action === "INSERT" && record.id) {
          return deduplicateQuests([record as QuestInstance, ...current]);
        }

        if (event.action === "UPDATE" && record.id) {
          return deduplicateQuests(
            current.map((quest) =>
              quest.id === record.id
                ? { ...quest, ...record }
                : quest
            )
          );
        }

        if (event.action === "DELETE" && oldRecord.id) {
          return current.filter((quest) => quest.id !== oldRecord.id);
        }

        return current;
      });
    });

    return unsubscribe;
  }, [onQuestUpdate, profile?.family_id]);

  const handleStatusUpdate = async (questId: string, status: QuestStatus) => {
    try {
      if (status === "APPROVED") {
        await questInstanceApiService.approveQuest(questId);
        await loadData({ useSpinner: false });
        return;
      }

      const updateData: Partial<QuestInstance> = {
        status,
      };

      if (status === "COMPLETED") {
        updateData.completed_at = new Date().toISOString();
      }

      setQuestInstances((current) =>
        current.map((quest) =>
          quest.id === questId ? { ...quest, ...updateData } : quest
        )
      );

      const { error: updateError } = await supabase
        .from("quest_instances")
        .update(updateData)
        .eq("id", questId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update quest";
      setError(message);
      onError(message);
      await loadData({ useSpinner: false });
    }
  };

  const handlePickupQuest = async (quest: QuestInstance) => {
    if (!user) {
      const message = "You must be signed in to pick up quests.";
      setError(message);
      onError(message);
      return;
    }

    if (quest.quest_type === "FAMILY") {
      await handleClaimQuest(quest.id);
      return;
    }

    try {
      setQuestInstances((current) =>
        current.map((existing) =>
          existing.id === quest.id
            ? { ...existing, assigned_to_id: user.id, status: "PENDING" }
            : existing
        )
      );

      const { error: updateError } = await supabase
        .from("quest_instances")
        .update({
          assigned_to_id: user.id,
          status: "PENDING",
        })
        .eq("id", quest.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to pick up quest";
      setError(message);
      onError(message);
      await loadData({ useSpinner: false });
    }
  };

  const handleAssignQuest = async (questId: string, assigneeId: string | undefined) => {
    if (!assigneeId) return;

    try {
      setQuestInstances((current) =>
        current.map((quest) =>
          quest.id === questId
            ? { ...quest, assigned_to_id: assigneeId, status: "PENDING" }
            : quest
        )
      );

      const { error: updateError } = await supabase
        .from("quest_instances")
        .update({
          assigned_to_id: assigneeId,
          status: "PENDING",
        })
        .eq("id", questId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSelectedAssignee((prev) => ({
        ...prev,
        [questId]: "",
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign quest";
      setError(message);
      onError(message);
      await loadData({ useSpinner: false });
    }
  };

  const handleAssignFamilyQuest = async (questId: string) => {
    const characterId = selectedFamilyAssignments[questId];
    if (!characterId) return;

    try {
      await questInstanceApiService.assignFamilyQuest(questId, characterId);
      setSelectedFamilyAssignments((prev) => {
        const updated = { ...prev };
        delete updated[questId];
        return updated;
      });
      await loadData({ useSpinner: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign family quest";
      setError(message);
      onError(message);
      await loadData({ useSpinner: false });
    }
  };

  const handleCancelQuest = async (questId: string) => {
    const confirmed = typeof window === "undefined" ? true : window.confirm("Are you sure you want to cancel this quest?");
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from("quest_instances")
        .delete()
        .eq("id", questId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel quest";
      setError(message);
      onError(message);
      await loadData({ useSpinner: false });
    }
  };

  const handleClaimQuest = async (questId: string) => {
    try {
      await questInstanceApiService.claimQuest(questId);
      await loadData({ useSpinner: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim quest";
      setError(message);
      onError(message);
    }
  };

  const handleReleaseQuest = async (questId: string) => {
    try {
      await questInstanceApiService.releaseQuest(questId);
      await loadData({ useSpinner: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to release quest";
      setError(message);
      onError(message);
    }
  };

  const handleApproveQuest = async (questId: string) => {
    try {
      await questInstanceApiService.approveQuest(questId);
      await loadData({ useSpinner: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve quest";
      setError(message);
      onError(message);
    }
  };

  const myQuests = questInstances.filter((quest) => quest.assigned_to_id === user?.id);
  const activeQuestStatuses: QuestStatus[] = ["PENDING", "IN_PROGRESS", "CLAIMED"];
  const historicalQuestStatuses: QuestStatus[] = ["COMPLETED", "APPROVED", "EXPIRED", "MISSED"];
  const activeStatusSet = new Set<QuestStatus>(activeQuestStatuses);
  const historyStatusSet = new Set<QuestStatus>(historicalQuestStatuses);

  const myActiveQuests = myQuests.filter((quest) => {
    if (!quest.status) return true;
    return activeStatusSet.has(quest.status);
  });

  const myHistoricalQuests = myQuests
    .filter((quest) => quest.status && historyStatusSet.has(quest.status))
    .sort((a, b) => getQuestTimestamp(b) - getQuestTimestamp(a));

  const unassignedIndividualQuests = questInstances.filter(
    (quest) => !quest.assigned_to_id && quest.quest_type !== "FAMILY"
  );
  const unassignedFamilyQuests = questInstances.filter(
    (quest) =>
      quest.quest_type === "FAMILY" &&
      !quest.assigned_to_id &&
      quest.status !== "MISSED" &&
      quest.status !== "EXPIRED"
  );
  const questsAwaitingApproval = questInstances.filter((quest) => quest.status === "COMPLETED");
  const otherQuests = profile?.role === "GUILD_MASTER"
    ? questInstances.filter(
        (quest) => quest.assigned_to_id && quest.assigned_to_id !== user?.id
      )
    : [];
  const claimableFamilyQuests = questInstances.filter(
    (quest) => quest.quest_type === "FAMILY" && quest.status === "AVAILABLE"
  );

  const formatRecurrence = (value: QuestInstance["recurrence_pattern"]) => {
    if (!value) return null;
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const canUpdateStatus = (quest: QuestInstance, newStatus: QuestStatus) => {
    if (!user) return false;
    if (newStatus === "APPROVED") {
      return profile?.role === "GUILD_MASTER";
    }

    if (quest.assigned_to_id === user.id) {
      if (newStatus === "IN_PROGRESS" && (quest.status === "PENDING" || quest.status === "CLAIMED" || !quest.status)) {
        return true;
      }
      if (newStatus === "COMPLETED" && quest.status === "IN_PROGRESS") {
        return true;
      }
    }

    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fantasy-card p-6 text-center text-red-400">
        <p>{error}</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
          onClick={() => {
            setError(null);
            void loadData({ useSpinner: true });
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-gray-100">Quest Dashboard</h2>
          <p className="text-gray-400 text-sm">Manage active quests, approvals, and family challenges.</p>
        </div>
        {isRefreshing && (
          <span className="inline-flex items-center gap-2 text-sm text-gray-400">
            <LoadingSpinner size="sm" aria-label="Refreshing quest data" />
            Refreshing...
          </span>
        )}
      </div>

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-fantasy text-gray-200">🗡️ My Quests</h3>
          {myHistoricalQuests.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Completed adventures live in Quest History near the bottom of the page.
            </p>
          )}
        </div>
        {myActiveQuests.length === 0 ? (
          <div className="fantasy-card p-6 text-center text-gray-300">
            You have no active quests right now.
            {myHistoricalQuests.length > 0 ? (
              <p className="text-xs text-gray-500 mt-2">
                Check Quest History to revisit your completed quests.
              </p>
            ) : null}
          </div>
        ) : (
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {myActiveQuests.map((quest) => {
              const statusLabel = (quest.status ?? "PENDING").replace("_", " ");
              const volunteerBonusPercent = formatPercent(quest.volunteer_bonus);
              const streakBonusPercent = formatPercent(quest.streak_bonus);
              const recurrenceLabel = formatRecurrence(quest.recurrence_pattern);

              return (
                <motion.div key={quest.id} variants={staggerItem} className="fantasy-card p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                      <p className="text-gray-300 text-sm">{quest.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
                        <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
                        <span>⚡ {quest.xp_reward} XP</span>
                        <span>💰 {quest.gold_reward} Gold</span>
                        {recurrenceLabel && <span>{recurrenceLabel}</span>}
                        {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
                        {volunteerBonusPercent && (
                          <span className="text-emerald-300">+{volunteerBonusPercent} Volunteer Bonus</span>
                        )}
                        {streakBonusPercent && quest.streak_count ? (
                          <span className="text-amber-300">
                            🔥 {quest.streak_count}-day streak (+{streakBonusPercent})
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canUpdateStatus(quest, "IN_PROGRESS") && (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
                        onClick={() => handleStatusUpdate(quest.id, "IN_PROGRESS")}
                        data-testid="start-quest-button"
                      >
                        Start Quest
                      </button>
                    )}

                    {canUpdateStatus(quest, "COMPLETED") && (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-500 transition"
                        onClick={() => handleStatusUpdate(quest.id, "COMPLETED")}
                        data-testid="complete-quest-button"
                      >
                        Complete Quest
                      </button>
                    )}

                    {quest.quest_type === "FAMILY" && quest.status === "CLAIMED" && (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-500 transition"
                        onClick={() => handleReleaseQuest(quest.id)}
                      >
                        Release Quest
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {profile?.role === "GUILD_MASTER" && questsAwaitingApproval.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">🛡️ Quests Awaiting Approval</h3>
          <div className="space-y-4">
            {questsAwaitingApproval.map((quest) => {
              const assignedHero = familyMembers.find((member) => member.id === quest.assigned_to_id);
              const volunteerBonusPercent = formatPercent(quest.volunteer_bonus);
              const streakBonusPercent = formatPercent(quest.streak_bonus);
              const recurrenceLabel = formatRecurrence(quest.recurrence_pattern);

              return (
                <div key={quest.id} className="fantasy-card p-6 border border-emerald-800/40 bg-dark-800/70 backdrop-blur-sm">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                        <p className="text-gray-300 text-sm">{quest.description}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/70 text-emerald-200">
                        {quest.quest_type === "FAMILY" ? "Family Quest" : "Individual Quest"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                      <span>XP: {quest.xp_reward}</span>
                      <span>Gold: {quest.gold_reward}</span>
                      {recurrenceLabel && <span>{recurrenceLabel}</span>}
                      {assignedHero && <span>Hero: {assignedHero.name}</span>}
                      {volunteerBonusPercent && (
                        <span className="text-emerald-300">+{volunteerBonusPercent} Volunteer Bonus</span>
                      )}
                      {streakBonusPercent && quest.streak_count ? (
                        <span className="text-amber-300">
                          🔥 {quest.streak_count}-day streak (+{streakBonusPercent})
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
                        onClick={() => handleApproveQuest(quest.id)}
                        data-testid="approve-quest-button"
                      >
                        Approve Quest
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {character && claimableFamilyQuests.length > 0 && (
        <section>
          <FamilyQuestClaiming
            quests={claimableFamilyQuests}
            character={character}
            onClaimQuest={handleClaimQuest}
          />
        </section>
      )}

      {profile?.role === "GUILD_MASTER" && claimableFamilyQuests.length > 0 && (
        <section className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-fantasy text-gray-100">👑 Manual Family Quest Assignment</h3>
            <p className="text-sm text-gray-400">Assign a family quest directly to a hero when no one has claimed it.</p>
          </div>

          {familyCharacters.length === 0 ? (
            <p className="text-sm text-gray-400">
              No hero characters found. Ask heroes to create their characters before assigning quests.
            </p>
          ) : (
            <div className="space-y-4">
              {claimableFamilyQuests.map((quest) => {
                const currentlyAssignedCharacterId = selectedFamilyAssignments[quest.id] ?? "";

                return (
                  <div
                    key={quest.id}
                    className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                      <p className="text-sm text-gray-400">{quest.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                        <span className={getDifficultyColor(quest.difficulty)}>Difficulty: {quest.difficulty}</span>
                        <span>⚡ {quest.xp_reward} XP</span>
                        <span>💰 {quest.gold_reward} Gold</span>
                        {quest.recurrence_pattern && <span>{formatRecurrence(quest.recurrence_pattern)}</span>}
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 w-full md:w-80">
                      <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Assign to Character
                      </label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                          value={currentlyAssignedCharacterId}
                          onChange={(event) =>
                            setSelectedFamilyAssignments((prev) => ({
                              ...prev,
                              [quest.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Choose hero...</option>
                          {familyCharacters.map((familyCharacter) => {
                            const owner = familyMembers.find((member) => member.id === familyCharacter.user_id);
                            const disabled =
                              Boolean(
                                familyCharacter.active_family_quest_id &&
                                  familyCharacter.active_family_quest_id !== quest.id
                              );

                            return (
                              <option key={familyCharacter.id} value={familyCharacter.id} disabled={disabled}>
                                {familyCharacter.name}
                                {owner ? ` (${owner.name})` : ""}
                                {disabled ? " — already on a family quest" : ""}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition disabled:bg-gray-600 disabled:text-gray-300"
                          disabled={!selectedFamilyAssignments[quest.id]}
                          onClick={() => handleAssignFamilyQuest(quest.id)}
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {unassignedIndividualQuests.length > 0 && (
        <section>
          <h3 data-testid="available-quests-heading" className="text-xl font-fantasy text-gray-200 mb-4">
            📋 Available Quests
          </h3>
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {unassignedIndividualQuests.map((quest) => (
              <motion.div key={quest.id} variants={staggerItem} className="fantasy-card p-6 border-l-4 border-gold-500">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                    <p className="text-gray-300 text-sm">{quest.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
                      <span>⚡ {quest.xp_reward} XP</span>
                      <span>💰 {quest.gold_reward} Gold</span>
                      {quest.recurrence_pattern && <span>{formatRecurrence(quest.recurrence_pattern)}</span>}
                      {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
                      onClick={() => handlePickupQuest(quest)}
                      data-testid="pick-up-quest-button"
                    >
                      Pick Up Quest
                    </button>

                    {profile?.role === "GUILD_MASTER" && (
                      <div className="space-y-2">
                        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                          <label className="block text-xs font-medium text-gray-300 mb-2">
                            👑 Assign to Hero
                          </label>
                          <div className="flex gap-2">
                            <select
                              data-testid="assign-quest-dropdown"
                              value={selectedAssignee[quest.id] ?? ""}
                              onChange={(event) =>
                                setSelectedAssignee((prev) => ({
                                  ...prev,
                                  [quest.id]: event.target.value,
                                }))
                              }
                              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                            >
                              <option value="">Choose hero...</option>
                              {familyMembers
                                .filter((member) => member.role !== "GUILD_MASTER")
                                .map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              className="px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition disabled:bg-gray-600 disabled:text-gray-300"
                              disabled={!selectedAssignee[quest.id]}
                              onClick={() => handleAssignQuest(quest.id, selectedAssignee[quest.id])}
                            >
                              Assign
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 px-3 py-2 rounded-md bg-rose-700 text-white hover:bg-rose-600 transition"
                            onClick={() => handleCancelQuest(quest.id)}
                          >
                            Cancel Quest
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {profile?.role === "GUILD_MASTER" && unassignedFamilyQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">🏰 Family Quests (GM View)</h3>
          <div className="space-y-4">
            {unassignedFamilyQuests.map((quest) => (
              <div key={quest.id} className="fantasy-card p-6 border border-purple-800/40 bg-dark-800/70 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                    <p className="text-gray-300 text-sm">{quest.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
                      <span>⚡ {quest.xp_reward} XP</span>
                      <span>💰 {quest.gold_reward} Gold</span>
                      {quest.recurrence_pattern && <span>{formatRecurrence(quest.recurrence_pattern)}</span>}
                      {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-[140px] w-full sm:w-auto">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-rose-700 text-white hover:bg-rose-600 transition min-h-[44px]"
                      onClick={() => handleCancelQuest(quest.id)}
                    >
                      Cancel Quest
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile?.role === "GUILD_MASTER" && otherQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">👥 Family Quests</h3>
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {otherQuests.map((quest) => {
              const statusLabel = (quest.status ?? "PENDING").replace("_", " ");
              return (
                <motion.div key={quest.id} variants={staggerItem} className="fantasy-card p-6 opacity-80">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                      <p className="text-gray-300 text-sm">{quest.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
                        <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
                        <span>⚡ {quest.xp_reward} XP</span>
                        <span>💰 {quest.gold_reward} Gold</span>
                        {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
                        {statusLabel}
                      </span>
                      {quest.status === "COMPLETED" && (
                        <button
                          type="button"
                          className="mt-3 px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
                          onClick={() => handleApproveQuest(quest.id)}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {myHistoricalQuests.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-xl font-fantasy text-gray-200">📜 Quest History</h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-md border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition"
              onClick={() => setShowQuestHistory((prev) => !prev)}
            >
              {showQuestHistory ? "Hide History" : `Show History (${myHistoricalQuests.length})`}
            </button>
          </div>

          {showQuestHistory && (
            <motion.div
              className="grid gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {myHistoricalQuests.map((quest) => {
                const statusLabel = (quest.status ?? "PENDING").replace("_", " ");
                const completionTimestamp = formatDateTime(
                  quest.completed_at ?? quest.updated_at ?? quest.created_at
                );
                const historyAction = (() => {
                  switch (quest.status) {
                    case "APPROVED":
                      return "Approved";
                    case "COMPLETED":
                      return "Completed";
                    case "EXPIRED":
                      return "Expired";
                    case "MISSED":
                      return "Marked missed";
                    default:
                      return "Updated";
                  }
                })();

                return (
                  <motion.div
                    key={quest.id}
                    variants={staggerItem}
                    className="fantasy-card p-6 bg-dark-800/80 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
                        <p className="text-gray-400 text-sm">{quest.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                          <span className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</span>
                          <span>⚡ {quest.xp_reward} XP</span>
                          <span>💰 {quest.gold_reward} Gold</span>
                          {quest.recurrence_pattern && <span>{formatRecurrence(quest.recurrence_pattern)}</span>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {completionTimestamp && (
                      <p className="text-sm text-gray-400">
                        {historyAction} on {completionTimestamp}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      )}

    </div>
  );
}
