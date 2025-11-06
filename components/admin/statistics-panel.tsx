"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Clock, Coins, Star, Trophy, Gift, Award } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { StatisticsService, FamilyStatistics } from "@/lib/statistics-service";
import { motion } from "framer-motion";

const statisticsService = new StatisticsService();

export default function StatisticsPanel() {
  const { profile } = useAuth();
  const { onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate } = useRealtime();
  const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);
      const stats = await statisticsService.getFamilyStatistics(profile.family_id);
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load family statistics");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  // Initial load
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Subscribe to realtime updates to refresh statistics
  useEffect(() => {
    const unsubscribeQuest = onQuestUpdate(() => {
      loadStatistics();
    });

    const unsubscribeRedemption = onRewardRedemptionUpdate(() => {
      loadStatistics();
    });

    const unsubscribeCharacter = onCharacterUpdate(() => {
      loadStatistics();
    });

    return () => {
      unsubscribeQuest();
      unsubscribeRedemption();
      unsubscribeCharacter();
    };
  }, [onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate, loadStatistics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="statistics-panel">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200" data-testid="statistics-panel">
        {error || "Failed to load statistics"}
      </div>
    );
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const weekChange = calculateChange(
    statistics.questsCompletedThisWeek,
    statistics.questsCompletedLastWeek
  );

  const monthChange = calculateChange(
    statistics.questsCompletedThisMonth,
    statistics.questsCompletedLastMonth
  );

  return (
    <div className="space-y-6" data-testid="statistics-panel">
      {/* Quest Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={24} />
          Family Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quests This Week */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Quests This Week</p>
                <p className="text-3xl font-bold text-white">
                  {statistics.questsCompletedThisWeek}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last week: {statistics.questsCompletedLastWeek}
                </p>
              </div>
              <div
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  weekChange > 0
                    ? "bg-green-500/20 text-green-400"
                    : weekChange < 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {weekChange > 0 ? "+" : ""}
                {weekChange}%
              </div>
            </div>
          </motion.div>

          {/* Quests This Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Quests This Month</p>
                <p className="text-3xl font-bold text-white">
                  {statistics.questsCompletedThisMonth}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last month: {statistics.questsCompletedLastMonth}
                </p>
              </div>
              <div
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  monthChange > 0
                    ? "bg-green-500/20 text-green-400"
                    : monthChange < 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {monthChange > 0 ? "+" : ""}
                {monthChange}%
              </div>
            </div>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-500/30 rounded-lg p-6"
          >
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Clock size={16} />
              Pending Approvals
            </p>
            <p className="text-3xl font-bold text-white">
              {statistics.pendingQuestApprovals + statistics.pendingRewardRedemptions}
            </p>
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <p>{statistics.pendingQuestApprovals} quests</p>
              <p>{statistics.pendingRewardRedemptions} redemptions</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Family Totals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Coins size={24} />
          Family Totals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 rounded-lg p-6"
          >
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Coins size={16} />
              Total Gold
            </p>
            <p className="text-3xl font-bold text-yellow-400">
              {statistics.totalGoldEarned.toLocaleString()}
            </p>
          </motion.div>

          {/* Total XP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 border border-cyan-500/30 rounded-lg p-6"
          >
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Star size={16} />
              Total XP
            </p>
            <p className="text-3xl font-bold text-cyan-400">
              {statistics.totalXpEarned.toLocaleString()}
            </p>
          </motion.div>

          {/* Redemptions This Week */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-500/30 rounded-lg p-6"
          >
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Gift size={16} /> Redemptions (Week)</p>
            <p className="text-3xl font-bold text-pink-400">
              {statistics.rewardRedemptionsThisWeek}
            </p>
          </motion.div>

          {/* Redemptions This Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-6"
          >
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Gift size={16} /> Redemptions (Month)</p>
            <p className="text-3xl font-bold text-green-400">
              {statistics.rewardRedemptionsThisMonth}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Character Progress */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy size={24} />
          Character Progress
        </h3>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Character</th>
                  <th className="px-6 py-3">Level</th>
                  <th className="px-6 py-3">XP</th>
                  <th className="px-6 py-3">Gold</th>
                  <th className="px-6 py-3">Quests Completed</th>
                  <th className="px-6 py-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {statistics.characterProgress.map((char, index) => (
                  <motion.tr
                    key={char.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{char.characterName}</p>
                        <p className="text-xs text-gray-400">{char.displayName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm">
                        {char.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-cyan-400 font-medium">
                      {char.xp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-yellow-400 font-medium">
                      {char.gold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {char.questsCompleted}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              char.completionRate >= 80
                                ? "bg-green-500"
                                : char.completionRate >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${char.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-300 w-12 text-right">
                          {char.completionRate}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {statistics.characterProgress.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No family members yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Member */}
        {statistics.mostActiveMember && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-500/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-4">
              <Award size={40} className="text-amber-500" />
              <div>
                <p className="text-sm text-gray-400 mb-1">Most Active Member</p>
                <p className="text-xl font-bold text-white">
                  {statistics.mostActiveMember.characterName}
                </p>
                <p className="text-sm text-gray-400">
                  {statistics.mostActiveMember.questsCompleted} quests completed
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
