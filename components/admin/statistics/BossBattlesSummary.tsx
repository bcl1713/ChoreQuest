"use client";

import { Award, Crown, Swords } from "lucide-react";
import { motion } from "framer-motion";
import type { FamilyStatistics } from "@/lib/statistics-service";
import { getTopParticipant } from "./statistics-utils";

type BossBattlesSummaryProps = {
  summary: FamilyStatistics["bossBattleSummary"];
};

export function BossBattlesSummary({ summary }: BossBattlesSummaryProps) {
  const { participant, label } = getTopParticipant(summary);

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Swords size={24} />
        Boss Battles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BattleStatCard
          label="Battles This Week"
          value={summary.battlesThisWeek}
          gradient="from-indigo-900/50 to-indigo-800/30"
          icon={<Swords size={16} />}
        />

        <BattleStatCard
          label="Battles This Month"
          value={summary.battlesThisMonth}
          gradient="from-rose-900/50 to-rose-800/30"
          icon={<Crown size={16} />}
          delay={0.1}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-500/30 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Award size={24} className="text-amber-400" />
            <div>
              <p className="text-xs text-amber-200/80 uppercase tracking-wide">
                Top Participant ({label})
              </p>
              <p className="text-lg font-semibold text-white">
                {participant ? participant.displayName : "No battles yet"}
              </p>
              {participant && (
                <p className="text-sm text-gray-300">
                  {participant.characterName}
                </p>
              )}
            </div>
          </div>
          {participant ? (
            <div className="text-sm text-gray-200 space-y-1">
              <p>
                Participation Score:{" "}
                <span className="text-amber-300 font-semibold">
                  {participant.participationScore.toFixed(2)}
                </span>
              </p>
              <p className="text-gray-400">
                XP: <span className="text-white">{participant.totalXp.toLocaleString()}</span>{" "}
                · Gold: <span className="text-white">{participant.totalGold.toLocaleString()}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Defeat a boss to see participation leaders.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

type BattleStatCardProps = {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
  delay?: number;
};

function BattleStatCard({ label, value, gradient, icon, delay = 0 }: BattleStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${gradient} border border-white/10 rounded-lg p-6`}
    >
      <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className="text-3xl font-bold text-white">
        {value}
      </p>
    </motion.div>
  );
}
