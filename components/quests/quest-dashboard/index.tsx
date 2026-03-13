"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, Button } from "@/components/ui";
import { BossQuestPanel } from "@/components/boss/boss-quest-panel";
import PendingApprovalsSection from "@/components/quests/pending-approvals-section";
import { useQuestHandlers } from "./useQuestHandlers";
import { useRealtimeHighlight } from "@/hooks/useRealtimeHighlight";
import { useRealtime } from "@/lib/realtime-context";
import { useQuestDashboardData } from "./useQuestDashboardData";
import { MyQuestsSection } from "./my-quests-section";
import { FamilyQuestSection } from "./family-quest-section";
import { QuestHistorySection } from "./quest-history-section";

type QuestDashboardProps = {
  onError: (error: string) => void;
  onLoadQuestsRef?: (reload: () => Promise<void>) => void;
};

export default function QuestDashboard({
  onError,
  onLoadQuestsRef,
}: QuestDashboardProps) {
  const data = useQuestDashboardData({ onError, onLoadQuestsRef });

  const { highlight: highlightQuest, isHighlighted: isQuestHighlighted } =
    useRealtimeHighlight();
  const { onQuestUpdate } = useRealtime();
  useEffect(() => {
    const unsubscribe = onQuestUpdate((event) => {
      const id =
        (event.record as { id?: string } | undefined)?.id ??
        (event.old_record as { id?: string } | undefined)?.id;
      if (id) highlightQuest(id);
    });
    return unsubscribe;
  }, [highlightQuest, onQuestUpdate]);

  const [selectedAssignees, setSelectedAssignees] = useState<
    Record<string, string>
  >({});

  const {
    handleStatusUpdate,
    handleClaimQuest,
    handleReleaseQuest,
    handleAssignQuest,
    handleApproveQuest,
    handleDenyQuest,
    handleCancelQuest,
    handleGmReleaseQuest,
  } = useQuestHandlers({
    onError,
    loadData: data.loadData,
    characterId: data.character?.id,
    setSelectedAssignees,
  });

  if (data.loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="fantasy-card p-6 text-center text-red-400">
        <p>{data.error}</p>
        <Button
          type="button"
          variant="success"
          size="sm"
          className="mt-4 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600"
          onClick={() => void data.loadData()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-gray-100">
            Quest Dashboard
          </h2>
          <p className="text-gray-400 text-sm">
            Manage active quests, approvals, and family challenges.
          </p>
        </div>
      </div>

      <BossQuestPanel />

      {data.isGuildMaster && data.pendingApprovalQuests.length > 0 && (
        <PendingApprovalsSection
          quests={data.pendingApprovalQuests}
          assignmentOptions={data.assignableCharacters}
          selectedAssignees={selectedAssignees}
          onAssigneeChange={(questId, assigneeId) =>
            setSelectedAssignees((prev) => ({ ...prev, [questId]: assigneeId }))
          }
          onAssign={handleAssignQuest}
          onApprove={handleApproveQuest}
          onDeny={handleDenyQuest}
          onCancel={handleCancelQuest}
          onRelease={handleGmReleaseQuest}
          getAssignedHeroName={data.getAssignedHeroName}
        />
      )}

      <MyQuestsSection
        activeQuests={data.myActiveQuests}
        historicalQuestCount={data.myHistoricalQuests.length}
        bossHistoryCount={data.bossHistoryQuests.length}
        onStartQuest={(id) => handleStatusUpdate(id, "IN_PROGRESS")}
        onCompleteQuest={(id) => handleStatusUpdate(id, "COMPLETED")}
        onReleaseQuest={handleReleaseQuest}
        familyMembers={data.familyMembers}
        isHighlighted={isQuestHighlighted}
      />

      <FamilyQuestSection
        quests={data.claimableFamilyQuests}
        character={data.character}
        onClaimQuest={handleClaimQuest}
      />

      <QuestHistorySection
        historicalQuests={data.myHistoricalQuests}
        bossHistoryQuests={data.bossHistoryQuests}
        familyMembers={data.familyMembers}
      />
    </div>
  );
}
