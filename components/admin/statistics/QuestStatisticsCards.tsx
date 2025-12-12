"use client";

import { BarChart3, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { FamilyStatistics } from "@/lib/statistics-service";

type QuestStatisticsCardsProps = {
  statistics: FamilyStatistics;
  weekChange: number;
  monthChange: number;
};

export function QuestStatisticsCards({ statistics, weekChange, monthChange }: QuestStatisticsCardsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={24} />
        Family Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <ChangePill value={weekChange} />
          </div>
        </motion.div>

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
            <ChangePill value={monthChange} delay={0.05} />
          </div>
        </motion.div>

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
  );
}

type ChangePillProps = {
  value: number;
  delay?: number;
};

function ChangePill({ value, delay = 0 }: ChangePillProps) {
  return (
    <motion.div
      transition={{ delay }}
      className={`text-sm font-semibold px-2 py-1 rounded ${
        value > 0
          ? "bg-green-500/20 text-green-400"
          : value < 0
          ? "bg-red-500/20 text-red-400"
          : "bg-gray-500/20 text-gray-400"
      }`}
    >
      {value > 0 ? "+" : ""}
      {value}%
    </motion.div>
  );
}
