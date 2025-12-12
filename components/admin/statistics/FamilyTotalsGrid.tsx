"use client";

import { Coins, Gift, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { FamilyStatistics } from "@/lib/statistics-service";

type FamilyTotalsGridProps = {
  statistics: FamilyStatistics;
};

export function FamilyTotalsGrid({ statistics }: FamilyTotalsGridProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Coins size={24} />
        Family Totals
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Coins size={16} />}
          label="Total Gold"
          value={statistics.totalGoldEarned.toLocaleString()}
          gradient="from-yellow-900/50 to-yellow-800/30"
          border="border-yellow-500/30"
          delay={0.3}
          valueClass="text-yellow-400"
        />

        <StatCard
          icon={<Star size={16} />}
          label="Total XP"
          value={statistics.totalXpEarned.toLocaleString()}
          gradient="from-cyan-900/50 to-cyan-800/30"
          border="border-cyan-500/30"
          delay={0.4}
          valueClass="text-cyan-400"
        />

        <StatCard
          icon={<Gift size={16} />}
          label="Redemptions (Week)"
          value={statistics.rewardRedemptionsThisWeek}
          gradient="from-pink-900/50 to-pink-800/30"
          border="border-pink-500/30"
          delay={0.5}
          valueClass="text-pink-400"
        />

        <StatCard
          icon={<Gift size={16} />}
          label="Redemptions (Month)"
          value={statistics.rewardRedemptionsThisMonth}
          gradient="from-green-900/50 to-green-800/30"
          border="border-green-500/30"
          delay={0.6}
          valueClass="text-green-400"
        />
      </div>
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  border: string;
  delay: number;
  valueClass?: string;
};

function StatCard({ icon, label, value, gradient, border, delay, valueClass }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${gradient} border ${border} rounded-lg p-6`}
    >
      <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className={`text-3xl font-bold ${valueClass ?? "text-white"}`}>{value}</p>
    </motion.div>
  );
}
