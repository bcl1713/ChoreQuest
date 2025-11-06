import React, { useMemo } from 'react';
import { BarChart3, Clock, RotateCw, CheckCircle, Zap, Coins, TrendingUp, User, Users } from 'lucide-react';
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

  // Create icon mapping for stat cards
  const STAT_ICONS = {
    BarChart3,
    Clock,
    RotateCw,
    CheckCircle,
    Zap,
    Coins,
    TrendingUp,
    User,
    Users,
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: 'BarChart3' },
    { label: 'Pending', value: stats.pending, icon: 'Clock' },
    { label: 'In Progress', value: stats.inProgress, icon: 'RotateCw' },
    { label: 'Completed', value: stats.completed, icon: 'CheckCircle' },
    { label: 'Total XP', value: stats.totalXP, icon: 'Zap' },
    { label: 'Total Gold', value: stats.totalGold, icon: 'Coins' },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: 'TrendingUp' },
  ];

  if (showQuestTypes) {
    statCards.push(
      { label: 'Individual', value: stats.individualQuests, icon: 'User' },
      { label: 'Family', value: stats.familyQuests, icon: 'Users' }
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const IconComponent = STAT_ICONS[stat.icon as keyof typeof STAT_ICONS];
        return (
          <div
            key={stat.label}
            className="fantasy-card p-4 text-center"
          >
            {IconComponent && <IconComponent size={32} className="mx-auto mb-1" />}
            <div className="text-2xl font-bold text-gray-100">{stat.value}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestStats;
