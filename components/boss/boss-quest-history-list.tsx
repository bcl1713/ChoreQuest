"use client";

import { Trophy, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import type { BossQuest } from "@/hooks/useBossQuests";

type Props = {
  bossQuests: (BossQuest & { boss_battle_participants?: { user_id: string | null }[] })[];
};

export function BossQuestHistoryList({ bossQuests }: Props) {
  if (!bossQuests.length) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {bossQuests.map((boss) => (
        <div
          key={boss.id}
          className="fantasy-card border border-dark-600 bg-dark-800/60 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-100">
                {boss.name}
              </h4>
              <p className="text-sm text-gray-400">{boss.description}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full border border-emerald-500/40 text-emerald-200">
              Boss Defeated
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Trophy size={16} className="text-gold-400" />
              {boss.reward_xp ?? 0} XP • {boss.reward_gold ?? 0} Gold • +{boss.honor_reward ?? 1} Honor
            </span>
            <span className="flex items-center gap-1">
              <Users size={16} className="text-emerald-400" />
              {(boss.boss_battle_participants?.length ?? 0)} participants
            </span>
            {boss.defeated_at && (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock size={16} />
                {format(new Date(boss.defeated_at), "MMM d, yyyy h:mm a")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
