"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { questService } from "@/lib/quest-service";
import { userService } from "@/lib/user-service";
import { QuestInstance, QuestDifficulty, QuestStatus } from "@/lib/generated/prisma";
import { User } from "@/types";
import { motion } from "framer-motion";
import { useRealTime } from "@/lib/realtime-context";

interface QuestDashboardProps {
  onError?: (error: string) => void;
  onLoadQuestsRef?: (loadQuests: () => Promise<void>) => void;
}

export default function QuestDashboard({
  onError,
  onLoadQuestsRef,
}: QuestDashboardProps) {
  const { user, token } = useAuth();
  const { events, isConnected } = useRealTime();
  const [questInstances, setQuestInstances] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<{
    [questId: string]: string;
  }>({});
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!user || !token) {
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
        // Load quests
        const instancesResult = await questService.getQuestInstances();
        setQuestInstances(instancesResult.instances);

        // Load family members for assignment dropdown
        try {
          const members = await userService.getFamilyMembers();
          setFamilyMembers(members);
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
  }, [user, token, onError]);

  const loadQuests = useCallback(async () => {
    try {
      setLoading(true);
      const instancesResult = await questService.getQuestInstances();
      setQuestInstances(instancesResult.instances);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load quests";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    // Pass the loadQuests function to parent
    if (onLoadQuestsRef) {
      onLoadQuestsRef(loadQuests);
    }
  }, [onLoadQuestsRef, loadQuests]);

  // Listen for real-time quest updates
  useEffect(() => {
    if (!events || events.length === 0) return;

    const latestEvent = events[events.length - 1];

    // Handle quest status changes
    if (latestEvent.type === 'quest_status_change') {
      const { questId, newStatus } = latestEvent.data as { questId: string; oldStatus: QuestStatus; newStatus: QuestStatus };

      setQuestInstances(currentQuests =>
        currentQuests.map(quest =>
          quest.id === questId
            ? { ...quest, status: newStatus }
            : quest
        )
      );
    }

    // Handle quest assignments
    if (latestEvent.type === 'quest_assignment') {
      const { questId, assignedToId } = latestEvent.data as { questId: string; assignedToId: string };

      setQuestInstances(currentQuests =>
        currentQuests.map(quest =>
          quest.id === questId
            ? { ...quest, assignedToId }
            : quest
        )
      );
    }

    // Handle new quests created
    if (latestEvent.type === 'quest_created') {
      // Reload quests to get the new one with full data
      loadQuests();
    }

  }, [events, loadQuests]);

  const handleStatusUpdate = async (questId: string, status: string) => {
    try {
      if (status === "APPROVED" && user?.role === "GUILD_MASTER") {
        // Handle quest approval with reward processing
        const approvalResponse = await questService.approveQuest(questId, user.id);
        await loadQuests(); // Refresh quest list
        
        // Emit a custom event that the dashboard can listen to
        window.dispatchEvent(new CustomEvent('characterStatsUpdated', {
          detail: {
            questId,
            rewards: approvalResponse.rewards,
            characterUpdates: approvalResponse.characterUpdates
          }
        }));
        
      } else {
        // Handle other status updates normally
        await questService.updateQuestStatus(questId, {
          status: status as
            | "PENDING"
            | "IN_PROGRESS"
            | "COMPLETED"
            | "APPROVED"
            | "EXPIRED",
        });
        await loadQuests(); // Refresh the list
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

    try {
      await questService.assignQuest(questId, user.id);

      //Refresh quest list to show updated assignments
      await loadQuests();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to pick up quest";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // TODO: Implement quest assignment functionality
  const handleAssignQuest = async (questId: string, assigneeId: string) => {
    if (!assigneeId) return;

    try {
      await questService.assignQuest(questId, assigneeId);

      // Clear the dropdown selection
      setSelectedAssignee((prev) => ({
        ...prev,
        [questId]: "",
      }));
      await loadQuests();
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
      await questService.cancelQuest(questId);
      await loadQuests();
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
      quest.assignedToId === user.id
    ) {
      return true;
    }

    // Guild masters can approve quests
    if (newStatus === "APPROVED" && user.role === "GUILD_MASTER") {
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <div className="text-center py-8" data-testid="quest-dashboard-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading quests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fantasy-card p-6 text-center" data-testid="quest-dashboard-error">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button
          onClick={loadQuests}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          data-testid="quest-dashboard-retry-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  const myQuests = questInstances.filter((q) => q.assignedToId === user?.id);
  const unassignedQuests = questInstances.filter((q) => !q.assignedToId);
  const otherQuests = questInstances.filter(
    (q) => q.assignedToId && q.assignedToId !== user?.id,
  );

  return (
    <div className="space-y-8" data-testid="quest-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-fantasy text-gray-100" data-testid="quest-dashboard-title">Quest Dashboard</h2>
        {/* Real-time connection status */}
        <div className="flex items-center space-x-2" data-testid="realtime-status">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Live Updates' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* My Active Quests */}
      <section data-testid="my-quests-section">
        <h3 className="text-xl font-fantasy text-gray-200 mb-4" data-testid="my-quests-title">
          🗡️ My Quests
        </h3>
        <div className="grid gap-4" data-testid="my-quests-list">
          {myQuests.length === 0 ? (
            <div className="fantasy-card p-6 text-center" data-testid="my-quests-empty">
              <p className="text-gray-400">
                No active quests. Ready for adventure?
              </p>
            </div>
          ) : (
            myQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fantasy-card p-6"
                data-testid={`my-quest-${quest.id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-100" data-testid={`quest-title-${quest.id}`}>
                      {quest.title}
                    </h4>
                    <p className="text-gray-400 text-sm" data-testid={`quest-description-${quest.id}`}>{quest.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}
                    data-testid={`quest-status-${quest.id}`}
                  >
                    {quest.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm" data-testid={`quest-details-${quest.id}`}>
                    <span className={getDifficultyColor(quest.difficulty)} data-testid={`quest-difficulty-${quest.id}`}>
                      {quest.difficulty}
                    </span>
                    <span className="text-gold-400" data-testid={`quest-gold-reward-${quest.id}`}>💰 {quest.goldReward}</span>
                    <span className="xp-text" data-testid={`quest-xp-reward-${quest.id}`}>⚡ {quest.xpReward} XP</span>
                    {formatDueDate(quest.dueDate) && (
                      <span className="text-blue-400" data-testid={`quest-due-date-${quest.id}`}>
                        {formatDueDate(quest.dueDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2" data-testid={`quest-actions-${quest.id}`}>
                    {quest.status === "PENDING" &&
                      canUpdateStatus(quest, "IN_PROGRESS") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "IN_PROGRESS")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          data-testid={`start-quest-btn-${quest.id}`}
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
                          data-testid={`complete-quest-btn-${quest.id}`}
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
                          data-testid={`approve-quest-btn-${quest.id}`}
                        >
                          Approve
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Available Quests (for guild masters and unassigned quests) */}
      {(user?.role === "GUILD_MASTER" || unassignedQuests.length > 0) && (
        <section data-testid="available-quests-section">
          <h3 className="text-xl font-fantasy text-gray-200 mb-4" data-testid="available-quests-title">
            📋 Available Quests
          </h3>
          <div className="grid gap-4" data-testid="available-quests-list">
            {unassignedQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fantasy-card p-6 border-l-4 border-gold-500"
                data-testid={`available-quest-${quest.id}`}
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
                        💰 {quest.goldReward}
                      </span>
                      <span className="xp-text">⚡ {quest.xpReward} XP</span>
                      {formatDueDate(quest.dueDate) && (
                        <span className="text-blue-400">
                          {formatDueDate(quest.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quest Action Buttons */}
                  <div className="flex flex-col gap-3 min-w-[200px]" data-testid={`available-quest-actions-${quest.id}`}>
                    {/* Hero Pickup Button */}
                    {user?.role !== "GUILD_MASTER" && (
                      <button
                        onClick={() => handlePickupQuest(quest.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        data-testid={`pickup-quest-btn-${quest.id}`}
                      >
                        <span>⚔️</span>
                        Pick Up Quest
                      </button>
                    )}

                    {/* Guild Master Controls */}
                    {user?.role === "GUILD_MASTER" && (
                      <div className="space-y-2" data-testid={`guild-master-controls-${quest.id}`}>
                        {/* GM can also pick up quests */}
                        <button
                          onClick={() => handlePickupQuest(quest.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full"
                          data-testid={`gm-pickup-quest-btn-${quest.id}`}
                        >
                          <span>⚔️</span>
                          Pick Up Quest
                        </button>

                        {/* Assignment Section */}
                        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700" data-testid={`quest-assignment-section-${quest.id}`}>
                          <label className="block text-xs font-medium text-gray-300 mb-2">
                            👑 Assign to Hero:
                          </label>
                          <div className="flex gap-2">
                            <select
                              data-testid={`assign-quest-dropdown-${quest.id}`}
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
                              data-testid={`assign-quest-btn-${quest.id}`}
                            >
                              Assign
                            </button>
                          </div>
                        </div>

                        {/* Danger Zone - Cancel Quest */}
                        <div className="bg-red-900/20 rounded-lg p-3 border border-red-800" data-testid={`cancel-quest-section-${quest.id}`}>
                          <button
                            onClick={() => handleCancelQuest(quest.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full"
                            data-testid={`cancel-quest-btn-${quest.id}`}
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
          </div>
        </section>
      )}

      {/* Other Family Quests (visible to guild masters) */}
      {user?.role === "GUILD_MASTER" && otherQuests.length > 0 && (
        <section data-testid="family-quests-section">
          <h3 className="text-xl font-fantasy text-gray-200 mb-4" data-testid="family-quests-title">
            👥 Family Quests
          </h3>
          <div className="grid gap-4" data-testid="family-quests-list">
            {otherQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fantasy-card p-6 opacity-75"
                data-testid={`family-quest-${quest.id}`}
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
                        💰 {quest.goldReward}
                      </span>
                      <span className="xp-text">⚡ {quest.xpReward} XP</span>
                      {formatDueDate(quest.dueDate) && (
                        <span className="text-blue-400">
                          {formatDueDate(quest.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right" data-testid={`family-quest-status-section-${quest.id}`}>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}
                      data-testid={`family-quest-status-${quest.id}`}
                    >
                      {quest.status.replace("_", " ")}
                    </span>
                    {quest.status === "COMPLETED" &&
                      canUpdateStatus(quest, "APPROVED") && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(quest.id, "APPROVED")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors mt-2 block"
                          data-testid={`family-quest-approve-btn-${quest.id}`}
                        >
                          Approve
                        </button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
