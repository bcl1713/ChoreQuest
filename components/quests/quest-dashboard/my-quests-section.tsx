"use client";
import React from "react";
import QuestList from "./quest-list";
import type { QuestInstance, UserProfile } from "@/lib/types/database";

interface MyQuestsSectionProps {
  activeQuests: QuestInstance[];
  historicalQuestCount: number;
  bossHistoryCount: number;
  onStartQuest: (id: string) => void;
  onCompleteQuest: (id: string) => void;
  onReleaseQuest: (id: string) => void;
  familyMembers: UserProfile[];
  isHighlighted: (id: string) => boolean;
}

export function MyQuestsSection({
  activeQuests,
  historicalQuestCount,
  bossHistoryCount,
  onStartQuest,
  onCompleteQuest,
  onReleaseQuest,
  familyMembers,
  isHighlighted,
}: MyQuestsSectionProps) {
  const hasHistory = historicalQuestCount + bossHistoryCount > 0;

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-xl font-fantasy text-gray-200">🗡️ My Quests</h3>
        {hasHistory && (
          <p className="text-xs text-gray-500 mt-1">
            Completed adventures live in Quest History near the bottom of the
            page.
          </p>
        )}
      </div>
      <QuestList
        quests={activeQuests}
        emptyMessage="You have no active quests right now."
        emptyHint={
          hasHistory
            ? "Check Quest History to revisit your completed quests."
            : undefined
        }
        onStartQuest={onStartQuest}
        onCompleteQuest={onCompleteQuest}
        onReleaseQuest={onReleaseQuest}
        familyMembers={familyMembers}
        isHighlighted={isHighlighted}
      />
    </section>
  );
}
