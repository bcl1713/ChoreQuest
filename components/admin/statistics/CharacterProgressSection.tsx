"use client";

import { motion } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import type { FamilyStatistics } from "@/lib/statistics-service";

type CharacterProgressSectionProps = {
  statistics: FamilyStatistics;
};

export function CharacterProgressSection({ statistics }: CharacterProgressSectionProps) {
  return (
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
                <th className="px-6 py-3">Gems</th>
                <th className="px-6 py-3">Honor</th>
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
                  <td className="px-6 py-4 text-purple-300 font-medium">
                    {char.gems.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-amber-200 font-medium">
                    {char.honor.toLocaleString()}
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
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No family members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
  );
}
