"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui";
import QuestList from "./quest-list";
import { BossQuestHistoryList } from "@/components/boss/boss-quest-history-list";
import type { QuestInstance, UserProfile } from "@/lib/types/database";
import type { BossQuest } from "@/hooks/useBossQuests";

type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants?: { user_id: string | null }[];
};

interface QuestHistorySectionProps {
  historicalQuests: QuestInstance[];
  bossHistoryQuests: BossQuestWithParticipants[];
  familyMembers: UserProfile[];
}

export function QuestHistorySection({
  historicalQuests,
  bossHistoryQuests,
  familyMembers,
}: QuestHistorySectionProps) {
  const [showQuestHistory, setShowQuestHistory] = useState(false);
  const totalCount = historicalQuests.length + bossHistoryQuests.length;

  if (totalCount === 0) return null;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-xl font-fantasy text-gray-200">📜 Quest History</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-md border border-gray-700 text-sm text-gray-300 hover:bg-gray-800"
          onClick={() => setShowQuestHistory((prev) => !prev)}
        >
          {showQuestHistory ? "Hide History" : `Show History (${totalCount})`}
        </Button>
      </div>
      {showQuestHistory && (
        <div className="space-y-3">
          <QuestList quests={historicalQuests} familyMembers={familyMembers} />
          <BossQuestHistoryList bossQuests={bossHistoryQuests} />
        </div>
      )}
    </section>
  );
}
