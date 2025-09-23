"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { questService } from "@/lib/quest-service";
import { QuestInstance, QuestDifficulty, User } from "@/lib/generated/prisma";
import { motion } from "framer-motion";

interface QuestDashboardProps {
  onError?: (error: string) => void;
  onLoadQuestsRef?: (loadQuests: () => Promise<void>) => void;
}

export default function QuestDashboard({
  onError,
  onLoadQuestsRef,
}: QuestDashboardProps) {
  const { user, family, token } = useAuth();
  const [questInstances, setQuestInstances] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<{[questId: string]: string}>({});

  useEffect(() => {
    // Only load quests when user and token are available
    if (user && token) {
      loadQuests();
      loadFamilyMembers(); // Load family members for assignment dropdown
    } else if (!user) {
      // If no user, set error state
      setError("User not authenticated");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    // Pass the loadQuests function to parent
    if (onLoadQuestsRef) {
      onLoadQuestsRef(loadQuests);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoadQuestsRef]);

  const loadQuests = async () => {
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
  };

  const handleStatusUpdate = async (questId: string, status: string) => {
    try {
      await questService.updateQuestStatus(questId, {
        status: status as
          | "PENDING"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "APPROVED"
          | "EXPIRED",
      });
      await loadQuests(); // Refresh the list
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update quest";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // TODO: Implement quest pickup functionality
  const handlePickupQuest = async (questId: string) => {
    console.log('TODO: Implement quest pickup for quest:', questId);
    // Implementation needed: Call API to assign quest to current user
  };

  // TODO: Implement quest assignment functionality
  const handleAssignQuest = async (questId: string, assigneeId: string) => {
    console.log('TODO: Implement quest assignment:', questId, 'to user:', assigneeId);
    // Implementation needed: Call API to assign quest to specified user
  };

  // TODO: Implement quest cancellation functionality
  const handleCancelQuest = async (questId: string) => {
    console.log('TODO: Implement quest cancellation for quest:', questId);
    // Implementation needed: Show confirmation dialog and call API to cancel quest
  };

  // TODO: Implement family members loading
  const loadFamilyMembers = async () => {
    console.log('TODO: Implement family members loading');
    // Implementation needed: Fetch family members for assignment dropdown
    // For now, using placeholder data with proper User type structure
    setFamilyMembers([
      {
        id: 'placeholder-1',
        name: 'Family Member 1',
        email: 'placeholder1@example.com',
        password: '',
        role: 'HERO' as const,
        familyId: family?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User,
      {
        id: 'placeholder-2',
        name: 'Family Member 2',
        email: 'placeholder2@example.com',
        password: '',
        role: 'HERO' as const,
        familyId: family?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User,
    ]);
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4"></div>
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

  const myQuests = questInstances.filter((q) => q.assignedToId === user?.id);
  const unassignedQuests = questInstances.filter((q) => !q.assignedToId);
  const otherQuests = questInstances.filter(
    (q) => q.assignedToId && q.assignedToId !== user?.id,
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
        <div className="grid gap-4">
          {myQuests.length === 0 ? (
            <div className="fantasy-card p-6 text-center">
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
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-100">
                      {quest.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}
                  >
                    {quest.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm">
                    <span className={getDifficultyColor(quest.difficulty)}>
                      {quest.difficulty}
                    </span>
                    <span className="text-gold-400">💰 {quest.goldReward}</span>
                    <span className="xp-text">⚡ {quest.xpReward} XP</span>
                    {formatDueDate(quest.dueDate) && (
                      <span className="text-blue-400">
                        {formatDueDate(quest.dueDate)}
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
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">
            📋 Available Quests
          </h3>
          <div className="grid gap-4">
            {unassignedQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {/* Hero Pickup Button */}
                    {user?.role !== 'GUILD_MASTER' && (
                      <button
                        onClick={() => handlePickupQuest(quest.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <span>⚔️</span>
                        Pick Up Quest
                      </button>
                    )}

                    {/* Guild Master Controls */}
                    {user?.role === 'GUILD_MASTER' && (
                      <div className="space-y-2">
                        {/* GM can also pick up quests */}
                        <button
                          onClick={() => handlePickupQuest(quest.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full"
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
                              value={selectedAssignee[quest.id] || ''}
                              onChange={(e) => setSelectedAssignee({
                                ...selectedAssignee,
                                [quest.id]: e.target.value
                              })}
                              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                            >
                              <option value="">Choose hero...</option>
                              {familyMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignQuest(quest.id, selectedAssignee[quest.id])}
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
          </div>
        </section>
      )}

      {/* Other Family Quests (visible to guild masters) */}
      {user?.role === "GUILD_MASTER" && otherQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">
            👥 Family Quests
          </h3>
          <div className="grid gap-4">
            {otherQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}
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
