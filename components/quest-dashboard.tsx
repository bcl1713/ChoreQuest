'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { questService } from '@/lib/quest-service';
import { QuestInstance, QuestDifficulty } from '@/lib/generated/prisma';
import { motion } from 'framer-motion';

interface QuestDashboardProps {
  onError?: (error: string) => void;
  onLoadQuestsRef?: (loadQuests: () => Promise<void>) => void;
}

export default function QuestDashboard({ onError, onLoadQuestsRef }: QuestDashboardProps) {
  const { user, token } = useAuth();
  const [questInstances, setQuestInstances] = useState<QuestInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load quests when user and token are available
    if (user && token) {
      loadQuests();
    } else if (!user) {
      // If no user, set error state
      setError('User not authenticated');
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
      const errorMsg = err instanceof Error ? err.message : 'Failed to load quests';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (questId: string, status: string) => {
    try {
      await questService.updateQuestStatus(questId, { status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'EXPIRED' });
      await loadQuests(); // Refresh the list
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update quest';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const getDifficultyColor = (difficulty: QuestDifficulty) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HARD': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-600 text-gray-300';
      case 'IN_PROGRESS': return 'bg-blue-600 text-blue-100';
      case 'COMPLETED': return 'bg-yellow-600 text-yellow-100';
      case 'APPROVED': return 'bg-green-600 text-green-100';
      case 'EXPIRED': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-300';
    }
  };

  cont formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format the date
    const month = date.getMonth + 1;
    const day = getDate();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    if ((newStatus === 'IN_PROGRESS' || newStatus === 'COMPLETED') && quest.assignedToId === user.id) {
      return true;
    }

    // Guild masters can approve quests
    if (newStatus === 'APPROVED' && user.role === 'GUILD_MASTER') {
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

  const myQuests = questInstances.filter(q => q.assignedToId === user?.id);
  const unassignedQuests = questInstances.filter(q => !q.assignedToId);
  const otherQuests = questInstances.filter(q => q.assignedToId && q.assignedToId !== user?.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-fantasy text-gray-100">Quest Dashboard</h2>
      </div>

      {/* My Active Quests */}
      <section>
        <h3 className="text-xl font-fantasy text-gray-200 mb-4">🗡️ My Quests</h3>
        <div className="grid gap-4">
          {myQuests.length === 0 ? (
            <div className="fantasy-card p-6 text-center">
              <p className="text-gray-400">No active quests. Ready for adventure?</p>
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
                    <h4 className="text-lg font-medium text-gray-100">{quest.title}</h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}>
                    {quest.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm">
                    <span className={getDifficultyColor(quest.difficulty)}>
                      {quest.difficulty}
                    </span>
                    <span className="text-gold-400">💰 {quest.goldReward}</span>
                    <span className="xp-text">⚡ {quest.xpReward} XP</span>
                  </div>

                  <div className="flex gap-2">
                    {quest.status === 'PENDING' && canUpdateStatus(quest, 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleStatusUpdate(quest.id, 'IN_PROGRESS')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Start Quest
                      </button>
                    )}
                    {quest.status === 'IN_PROGRESS' && canUpdateStatus(quest, 'COMPLETED') && (
                      <button
                        onClick={() => handleStatusUpdate(quest.id, 'COMPLETED')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {quest.status === 'COMPLETED' && canUpdateStatus(quest, 'APPROVED') && (
                      <button
                        onClick={() => handleStatusUpdate(quest.id, 'APPROVED')}
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
      {(user?.role === 'GUILD_MASTER' || unassignedQuests.length > 0) && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">📋 Available Quests</h3>
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
                    <h4 className="text-lg font-medium text-gray-100">{quest.title}</h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                    <div className="flex gap-4 text-sm mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </span>
                      <span className="text-gold-400">💰 {quest.goldReward}</span>
                      <span className="xp-text">⚡ {quest.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Other Family Quests (visible to guild masters) */}
      {user?.role === 'GUILD_MASTER' && otherQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">👥 Family Quests</h3>
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
                    <h4 className="text-lg font-medium text-gray-100">{quest.title}</h4>
                    <p className="text-gray-400 text-sm">{quest.description}</p>
                    <div className="flex gap-4 text-sm mt-2">
                      <span className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </span>
                      <span className="text-gold-400">💰 {quest.goldReward}</span>
                      <span className="xp-text">⚡ {quest.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quest.status)}`}>
                      {quest.status.replace('_', ' ')}
                    </span>
                    {quest.status === 'COMPLETED' && canUpdateStatus(quest, 'APPROVED') && (
                      <button
                        onClick={() => handleStatusUpdate(quest.id, 'APPROVED')}
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
