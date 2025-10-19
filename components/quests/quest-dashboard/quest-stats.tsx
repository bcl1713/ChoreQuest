import React, { useMemo } from 'react';
import { QuestInstance } from '@/lib/types/database';

export interface QuestStatsProps {
  quests: QuestInstance[] | null | undefined;
  showQuestTypes?: boolean;
}

const QuestStats: React.FC<QuestStatsProps> = ({ quests, showQuestTypes = false }) => {
  const stats = useMemo(() => {
    const validQuests = quests || [];

    const total = validQuests.length;
    const pending = validQuests.filter((q) => q.status === 'PENDING').length;
    const inProgress = validQuests.filter((q) => q.status === 'IN_PROGRESS' || q.status === 'CLAIMED').length;
    const completed = validQuests.filter((q) => q.status === 'COMPLETED' || q.status === 'APPROVED').length;

    const totalXP = validQuests.reduce((sum, q) => sum + (q.xp_reward || 0), 0);
    const totalGold = validQuests.reduce((sum, q) => sum + (q.gold_reward || 0), 0);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const individualQuests = validQuests.filter((q) => q.quest_type === 'INDIVIDUAL').length;
    const familyQuests = validQuests.filter((q) => q.quest_type === 'FAMILY').length;

    return {
      total,
      pending,
      inProgress,
      completed,
      totalXP,
      totalGold,
      completionRate,
      individualQuests,
      familyQuests,
    };
  }, [quests]);

  const statCards = [
    { label: 'Total', value: stats.total, icon: '📊' },
    { label: 'Pending', value: stats.pending, icon: '⏳' },
    { label: 'In Progress', value: stats.inProgress, icon: '🔄' },
    { label: 'Completed', value: stats.completed, icon: '✅' },
    { label: 'Total XP', value: stats.totalXP, icon: '⚡' },
    { label: 'Total Gold', value: stats.totalGold, icon: '💰' },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: '📈' },
  ];

  if (showQuestTypes) {
    statCards.push(
      { label: 'Individual', value: stats.individualQuests, icon: '👤' },
      { label: 'Family', value: stats.familyQuests, icon: '👨‍👩‍👧‍👦' }
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="fantasy-card p-4 text-center"
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-2xl font-bold text-gray-100">{stat.value}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default QuestStats;
