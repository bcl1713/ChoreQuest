"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { supabase } from "@/lib/supabase";
import { QuestInstance, QuestDifficulty, UserProfile } from "@/lib/types/database";
import { RewardCalculator } from "@/lib/reward-calculator";
import { motion } from "framer-motion";
import { QuestCompleteOverlay, QuestReward } from "@/components/animations/QuestCompleteOverlay";
import { staggerContainer, staggerItem } from "@/lib/animations/variants";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface QuestDashboardProps {
  onError?: (error: string) => void;
  onLoadQuestsRef?: (loadQuests: () => Promise<void>) => void;
}

export default function QuestDashboard({
  onError,
  onLoadQuestsRef,
}: QuestDashboardProps) {
  const { user, session, profile } = useAuth();
  const { onQuestUpdate } = useRealtime();
  const [questInstances, setQuestInstances] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<{
    [questId: string]: string;
  }>({});
  const [questCompleteData, setQuestCompleteData] = useState<{
    show: boolean;
    questTitle: string;
    rewards: QuestReward;
  }>({
    show: false,
    questTitle: '',
    rewards: {},
  });
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!user || !session || !profile) {
      if (!user) {
        // If no user, set error state
        setError("User not authenticated");
        setLoading(false);
      }
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    const loadData = async () => {
      setLoading(true);

      try {
        // Load quest instances for the family
        const { data: questData, error: questError } = await supabase
          .from('quest_instances')
          .select('*')
          .eq('family_id', profile.family_id)
          .order('created_at', { ascending: false });

        if (questError) {
          throw questError;
        }

        setQuestInstances(deduplicateQuests(questData || []));

        // Load family members for assignment dropdown
        try {
          const { data: membersData, error: membersError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('family_id', profile.family_id);

          if (!membersError && membersData) {
            // Use UserProfile data directly (no transformation needed)
            setFamilyMembers(membersData);
          }
        } catch (err) {
          console.error("Failed to load family members:", err);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load quests";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, session, profile, onError]);

  const loadQuests = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { data: questData, error: questError } = await supabase
        .from('quest_instances')
        .select('*')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (questError) {
        throw questError;
      }

      setQuestInstances(deduplicateQuests(questData || []));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load quests";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [profile, onError]);

  // Helper function to deduplicate quests by ID
  const deduplicateQuests = (quests: QuestInstance[]): QuestInstance[] => {
    const seen = new Set<string>();
    return quests.filter(quest => {
      if (seen.has(quest.id)) {
        return false;
      }
      seen.add(quest.id);
      return true;
    });
  };

  useEffect(() => {
    // Pass the loadQuests function to parent
    if (onLoadQuestsRef) {
      onLoadQuestsRef(loadQuests);
    }
  }, [onLoadQuestsRef, loadQuests]);

  // Set up realtime quest update listener
  useEffect(() => {
    if (!user || !profile) return;

    const unsubscribe = onQuestUpdate((event) => {

      setQuestInstances(currentQuests => {
        if (event.action === 'INSERT') {
          // Check if quest already exists before adding
          const questExists = currentQuests.some(quest => quest.id === event.record.id);
          if (questExists) {
            return currentQuests;
          }
          // Add new quest to the list
          return deduplicateQuests([event.record as QuestInstance, ...currentQuests]);
        } else if (event.action === 'UPDATE') {
          // Update existing quest
          const updatedQuests = currentQuests.map(quest =>
            quest.id === event.record.id ? { ...quest, ...event.record } as QuestInstance : quest
          );
          return deduplicateQuests(updatedQuests);
        } else if (event.action === 'DELETE') {
          // Remove quest from the list
          return currentQuests.filter(quest => quest.id !== event.old_record?.id);
        }
        return deduplicateQuests(currentQuests);
      });
    });

    return unsubscribe;
  }, [user, profile, onQuestUpdate]);

  const handleStatusUpdate = async (questId: string, status: string) => {
    try {
      if (status === "APPROVED" && profile?.role === "GUILD_MASTER") {
        // Handle quest approval with reward processing
        // First get quest details
        const { data: questData, error: questError } = await supabase
          .from('quest_instances')
          .select('*')
          .eq('id', questId)
          .single();

        if (questError) {
          throw questError;
        }

        // Update quest status
        const { error: updateError } = await supabase
          .from('quest_instances')
          .update({
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
          })
          .eq('id', questId);

        if (updateError) {
          throw updateError;
        }

        // Calculate rewards for events (before character update)
        let finalRewards = {
          xp: questData.xp_reward,
          gold: questData.gold_reward,
        };

        // Update character stats if quest is assigned
        if (questData.assigned_to_id) {
          // First get current character stats and class
          const { data: characterData, error: characterFetchError } = await supabase
            .from('characters')
            .select('xp, gold, level, class')
            .eq('user_id', questData.assigned_to_id)
            .single();

          if (characterFetchError) {
            console.error('Failed to fetch character stats:', characterFetchError);
          } else {
            // Calculate rewards using RewardCalculator with class bonuses
            const baseRewards = {
              xpReward: questData.xp_reward,
              goldReward: questData.gold_reward,
              gemsReward: questData.gems_reward || 0,
              honorPointsReward: questData.honor_points_reward || 0,
            };

            const calculatedRewards = RewardCalculator.calculateQuestRewards(
              baseRewards,
              questData.difficulty,
              characterData.class,
              characterData.level
            );

            // Update final rewards with calculated values
            finalRewards = {
              xp: calculatedRewards.xp,
              gold: calculatedRewards.gold,
            };

            // Calculate new stats with proper rewards
            const newXp = characterData.xp + calculatedRewards.xp;
            const newGold = characterData.gold + calculatedRewards.gold;

            // Calculate level up using RewardCalculator
            const levelUpResult = RewardCalculator.calculateLevelUp(
              characterData.xp,
              calculatedRewards.xp,
              characterData.level
            );
            const newLevel = levelUpResult ? levelUpResult.newLevel : characterData.level;

            const { error: characterError } = await supabase
              .from('characters')
              .update({
                xp: newXp,
                gold: newGold,
                level: newLevel,
              })
              .eq('user_id', questData.assigned_to_id);

            if (characterError) {
              // Throw error to prevent quest from being marked as approved if character update fails
              throw new Error(`Failed to award rewards: ${characterError.message}`);
            }
          }
        }

        // Show quest complete overlay with rewards
        setQuestCompleteData({
          show: true,
          questTitle: questData.title || 'Quest Complete!',
          rewards: {
            gold: finalRewards.gold,
            xp: finalRewards.xp,
          },
        });

        // Character stats updates will be handled by realtime subscriptions
        // Emit a custom event that the dashboard can listen to for character stats updates
        window.dispatchEvent(new CustomEvent('characterStatsUpdated', {
          detail: {
            questId,
            rewards: finalRewards,
            characterUpdates: {
              assigned_to_id: questData.assigned_to_id,
            }
          }
        }));

      } else {
        // Handle other status updates normally
        const updateData: {
          status: string;
          completed_at?: string;
        } = {
          status: status as
            | "PENDING"
            | "IN_PROGRESS"
            | "COMPLETED"
            | "APPROVED"
            | "EXPIRED",
        };

        if (status === "COMPLETED") {
          updateData.completed_at = new Date().toISOString();
        }

        // Optimistically update local state immediately for instant UI feedback
        setQuestInstances(currentQuests =>
          currentQuests.map(quest =>
            quest.id === questId
              ? { ...quest, ...updateData } as QuestInstance
              : quest
          )
        );

        const { error } = await supabase
          .from('quest_instances')
          .update(updateData)
          .eq('id', questId);

        if (error) {
          // Revert optimistic update on error
          await loadQuests();
          throw error;
        }

        // Quest updates will also be handled by realtime subscriptions (for other users)
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update quest";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // TODO: Implement quest pickup functionality
  const handlePickupQuest = async (questId: string) => {
    if (!user) return;

    // Optimistically update local state immediately for instant UI feedback
    setQuestInstances(currentQuests =>
      currentQuests.map(quest =>
        quest.id === questId
          ? { ...quest, assigned_to_id: user.id, status: 'PENDING' as const }
          : quest
      )
    );

    try {
      const { error } = await supabase
        .from('quest_instances')
        .update({
          assigned_to_id: user.id,
          status: 'PENDING',
        })
        .eq('id', questId)
        .select();

      if (error) {
        // Revert optimistic update on error
        await loadQuests();
        throw error;
      }

      // Quest updates will also be handled by realtime subscriptions (for other users)
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to pick up quest";
      console.error('Quest pickup failed:', err);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // TODO: Implement quest assignment functionality
  const handleAssignQuest = async (questId: string, assigneeId: string) => {
    if (!assigneeId) return;

    // Optimistically update local state immediately for instant UI feedback
    setQuestInstances(currentQuests =>
      currentQuests.map(quest =>
        quest.id === questId
          ? { ...quest, assigned_to_id: assigneeId, status: 'PENDING' as const }
          : quest
      )
    );

    // Clear the dropdown selection immediately
    setSelectedAssignee((prev) => ({
      ...prev,
      [questId]: "",
    }));

    try {
      const { error } = await supabase
        .from('quest_instances')
        .update({
          assigned_to_id: assigneeId,
          status: 'PENDING',
        })
        .eq('id', questId);

      if (error) {
        // Revert optimistic update on error
        await loadQuests();
        throw error;
      }

      // Quest updates will also be handled by realtime subscriptions (for other users)
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to assign quest";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleCancelQuest = async (questId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this quest?",
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('quest_instances')
        .delete()
        .eq('id', questId);

      if (error) {
        throw error;
      }

      // Quest updates will be handled automatically by realtime subscriptions
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to cancel quest";
      setError(errorMsg);
      onError?.(errorMsg);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-600 text-gray-300";
      case "IN_PROGRESS":
        return "bg-blue-600 text-blue-100";
      case "COMPLETED":
        return "bg-yellow-600 text-yellow-100";
      case "APPROVED":
        return "bg-green-600 text-green-100";
      case "EXPIRED":
        return "bg-red-600 text-red-100";
      default:
        return "bg-gray-600 text-gray-300";
    }
  };

  const formatDueDate = (dueDate: string | Date | null) => {
    if (!dueDate) return null;

    const date = typeof dueDate == "string" ? new Date(dueDate) : dueDate;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format the date
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffDays < 0) {
      return `🚨 Overdue (${month}/${day})`;
    } else if (diffDays === 0) {
      return `⏰ Due Today ${time}`;
    } else if (diffDays === 1) {
      return `📅 Due Tomorrow ${time}`;
    } else {
      return `📅 Due ${month}/${day} ${time}`;
    }
  };

  const canUpdateStatus = (quest: QuestInstance, newStatus: string) => {
    if (!user) return false;

    // Heroes can mark their own quests as IN_PROGRESS or COMPLETED
    if (
      (newStatus === "IN_PROGRESS" || newStatus === "COMPLETED") &&
      quest.assigned_to_id === user.id
    ) {
      return true;
    }

    // Guild masters can approve quests
    if (newStatus === "APPROVED" && profile?.role === "GUILD_MASTER") {
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" className="mb-4" aria-label="Loading quests" />
        <p className="text-gray-400">Loading quests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fantasy-card p-6 text-center">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button
          onClick={loadQuests}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const myQuests = questInstances.filter((q) => q.assigned_to_id === user?.id);
  const unassignedQuests = questInstances.filter((q) => !q.assigned_to_id);
  const otherQuests = questInstances.filter(
    (q) => q.assigned_to_id && q.assigned_to_id !== user?.id,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-fantasy text-gray-100">Quest Dashboard</h2>
      </div>

      {/* My Active Quests */}
      <section>
        <h3 className="text-xl font-fantasy text-gray-200 mb-4">
          🗡️ My Quests
        </h3>
        {myQuests.length === 0 ? (
          <div className="fantasy-card p-6 text-center">
            <p className="text-gray-400">
              No active quests. Ready for adventure?
            </p>
          </div>
        ) : (
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {myQuests.map((quest) => (
              <motion.div
                key={quest.id}
                variants={staggerItem}
                className="fantasy-card p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-100">
                      {quest.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status || 'PENDING')}`}
                  >
                    {(quest.status || 'PENDING').replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm">
                    <span className={getDifficultyColor(quest.difficulty)}>
                      {quest.difficulty}
                    </span>
                    <span className="text-gold-400">💰 {quest.gold_reward}</span>
                    <span className="xp-text">⚡ {quest.xp_reward} XP</span>
                    {formatDueDate(quest.due_date) && (
                      <span className="text-blue-400">
                        {formatDueDate(quest.due_date)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {quest.status === "PENDING" &&
                      canUpdateStatus(quest, "IN_PROGRESS") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "IN_PROGRESS")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          data-testid="start-quest-button"
                        >
                          Start Quest
                        </button>
                      )}
                    {quest.status === "IN_PROGRESS" &&
                      canUpdateStatus(quest, "COMPLETED") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "COMPLETED")
                          }
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          data-testid="complete-quest-button"
                        >
                          Complete
                        </button>
                      )}
                    {quest.status === "COMPLETED" &&
                      canUpdateStatus(quest, "APPROVED") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "APPROVED")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          data-testid="approve-quest-button"
                        >
                          Approve
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Available Quests (for guild masters and unassigned quests) */}
      {(profile?.role === "GUILD_MASTER" || unassignedQuests.length > 0) && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">
            📋 Available Quests
          </h3>
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {unassignedQuests.map((quest) => (
              <motion.div
                key={quest.id}
                variants={staggerItem}
                className="fantasy-card p-6 border-l-4 border-gold-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-100">
                      {quest.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                    <div className="flex gap-4 text-sm mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </span>
                      <span className="text-gold-400">
                        💰 {quest.gold_reward}
                      </span>
                      <span className="xp-text">⚡ {quest.xp_reward} XP</span>
                      {formatDueDate(quest.due_date) && (
                        <span className="text-blue-400">
                          {formatDueDate(quest.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quest Action Buttons */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {/* Hero Pickup Button */}
                    {profile?.role !== "GUILD_MASTER" && (
                      <button
                        onClick={() => handlePickupQuest(quest.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        data-testid="pick-up-quest-button"
                      >
                        <span>⚔️</span>
                        Pick Up Quest
                      </button>
                    )}

                    {/* Guild Master Controls */}
                    {profile?.role === "GUILD_MASTER" && (
                      <div className="space-y-2">
                        {/* GM can also pick up quests */}
                        <button
                          onClick={() => handlePickupQuest(quest.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full"
                          data-testid="pick-up-quest-button"
                        >
                          <span>⚔️</span>
                          Pick Up Quest
                        </button>

                        {/* Assignment Section */}
                        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                          <label className="block text-xs font-medium text-gray-300 mb-2">
                            👑 Assign to Hero:
                          </label>
                          <div className="flex gap-2">
                            <select
                              data-testid="assign-quest-dropdown"
                              value={selectedAssignee[quest.id] || ""}
                              onChange={(e) =>
                                setSelectedAssignee({
                                  ...selectedAssignee,
                                  [quest.id]: e.target.value,
                                })
                              }
                              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                            >
                              <option value="">Choose hero...</option>
                              {familyMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                handleAssignQuest(
                                  quest.id,
                                  selectedAssignee[quest.id],
                                )
                              }
                              disabled={!selectedAssignee[quest.id]}
                              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                              Assign
                            </button>
                          </div>
                        </div>

                        {/* Danger Zone - Cancel Quest */}
                        <div className="bg-red-900/20 rounded-lg p-3 border border-red-800">
                          <button
                            onClick={() => handleCancelQuest(quest.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full"
                          >
                            <span>❌</span>
                            Cancel Quest
                          </button>
                          <p className="text-xs text-red-400 mt-1 text-center">
                            This action cannot be undone
                          </p>
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

      {/* Other Family Quests (visible to guild masters) */}
      {profile?.role === "GUILD_MASTER" && otherQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">
            👥 Family Quests
          </h3>
          <motion.div
            className="grid gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {otherQuests.map((quest) => (
              <motion.div
                key={quest.id}
                variants={staggerItem}
                className="fantasy-card p-6 opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-100">
                      {quest.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                    <div className="flex gap-4 text-sm mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </span>
                      <span className="text-gold-400">
                        💰 {quest.gold_reward}
                      </span>
                      <span className="xp-text">⚡ {quest.xp_reward} XP</span>
                      {formatDueDate(quest.due_date) && (
                        <span className="text-blue-400">
                          {formatDueDate(quest.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status || 'PENDING')}`}
                    >
                      {(quest.status || 'PENDING').replace("_", " ")}
                    </span>
                    {quest.status === "COMPLETED" &&
                      canUpdateStatus(quest, "APPROVED") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "APPROVED")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors mt-2 block"
                          data-testid="approve-quest-button"
                        >
                          Approve
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Quest Complete Overlay */}
      <QuestCompleteOverlay
        show={questCompleteData.show}
        questTitle={questCompleteData.questTitle}
        rewards={questCompleteData.rewards}
        onDismiss={() => setQuestCompleteData({ show: false, questTitle: '', rewards: {} })}
      />
    </div>
  );
}
