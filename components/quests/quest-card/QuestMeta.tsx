"use client";

import { Calendar, CalendarDays, Clock, Coins, Flame, User, Zap } from "lucide-react";
import { getDifficultyColor, getStatusColor } from "@/lib/utils/colors";
import { formatDueDate } from "@/lib/utils/formatting";
import type { QuestInstance } from "@/lib/types/database";
import type { RecurrenceLabelWithIcon } from "./quest-card-helpers";

type QuestMetaProps = {
  quest: QuestInstance;
  recurrenceLabel: RecurrenceLabelWithIcon | null;
  volunteerBonusPercent: string | null;
  streakBonusPercent: string | null;
  assignedHeroName?: string;
};

const recurrenceIcons: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Calendar,
  CalendarDays,
  Clock,
};

export function QuestMeta({
  quest,
  recurrenceLabel,
  volunteerBonusPercent,
  streakBonusPercent,
  assignedHeroName,
}: QuestMetaProps) {
  const statusLabel = (quest.status ?? "PENDING").replace(/_/g, " ");
  const RecurrenceIcon = recurrenceLabel ? recurrenceIcons[recurrenceLabel.icon] : null;

  return (
    <>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div>
            <h4 className="text-lg font-semibold text-gray-100">{quest.title}</h4>
            <p className="text-gray-300 text-sm">{quest.description}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-2">
            <span className={getDifficultyColor(quest.difficulty)}>
              {quest.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Zap size={16} className="inline" /> {quest.xp_reward} XP
            </span>
            <span className="flex items-center gap-1">
              <Coins size={16} className="inline" /> {quest.gold_reward} Gold
            </span>
            {RecurrenceIcon && recurrenceLabel && (
              <span className="flex items-center gap-1">
                <RecurrenceIcon size={16} className="inline" />
                {recurrenceLabel.label}
              </span>
            )}
            {quest.due_date && <span>{formatDueDate(quest.due_date)}</span>}
            {volunteerBonusPercent && (
              <span className="text-emerald-300">+{volunteerBonusPercent} Volunteer Bonus</span>
            )}
            {streakBonusPercent && quest.streak_count && (
              <span className="text-amber-300 flex items-center gap-1">
                <Flame size={16} className="inline" /> {quest.streak_count}-day streak (+{streakBonusPercent})
              </span>
            )}
            {assignedHeroName && (
              <span className="text-purple-300 flex items-center gap-1">
                <User size={16} className="inline" /> {assignedHeroName}
              </span>
            )}
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quest.status)}`}>
          {statusLabel}
        </span>
      </div>
    </>
  );
}
