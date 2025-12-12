"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { QuestInstance } from "@/lib/types/database";
import { LoadingSpinner, Button } from "@/components/ui";
import FamilyQuestClaiming from "@/components/family/family-quest-claiming";
import { BossQuestPanel } from "@/components/boss/boss-quest-panel";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCharacter } from "@/hooks/useCharacter";
import { useQuests } from "@/hooks/useQuests";
import { useBossQuests } from "@/hooks/useBossQuests";
import QuestList from "./quest-list";
import * as QuestHelpers from "./quest-helpers";
import PendingApprovalsSection from "@/components/quests/pending-approvals-section";
import { BossQuestHistoryList } from "@/components/boss/boss-quest-history-list";
import { useQuestHandlers } from "./useQuestHandlers";

type QuestDashboardProps = {
  onError: (error: string) => void;
  onLoadQuestsRef?: (reload: () => Promise<void>) => void;
};

export default function QuestDashboard({
  onError,
  onLoadQuestsRef,
}: QuestDashboardProps) {
  const { user, profile } = useAuth();

  // Custom hooks for data fetching
  const {
    familyMembers,
    familyCharacters,
    loading: familyLoading,
    error: familyError,
    reload: reloadFamily,
  } = useFamilyMembers();
  const {
    character,
    loading: characterLoading,
    error: characterError,
    reload: reloadCharacter,
  } = useCharacter();
  const {
    quests: questInstances,
    loading: questsLoading,
    error: questsError,
    reload: reloadQuests,
  } = useQuests();
  const {
    bossQuests,
    loading: bossLoading,
    error: bossError,
    reload: reloadBossQuests,
  } = useBossQuests();

  // Local state
  const [showQuestHistory, setShowQuestHistory] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<
    Record<string, string>
  >({});

  const isGuildMaster = profile?.role === "GUILD_MASTER";

  // Combine loading and error states
  const loading =
    familyLoading || characterLoading || questsLoading || bossLoading;
  const error = familyError || characterError || questsError || bossError;

  // Combined reload function
  const loadData = useCallback(async () => {
    await Promise.all([
      reloadFamily(),
      reloadCharacter(),
      reloadQuests(),
      reloadBossQuests(),
    ]);
  }, [reloadFamily, reloadCharacter, reloadQuests, reloadBossQuests]);

  // Expose reload function to parent component
  useEffect(() => {
    if (!onLoadQuestsRef) return;
    onLoadQuestsRef(loadData);
  }, [loadData, onLoadQuestsRef]);

  // Show errors via the onError callback
  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  // Quest action handlers - extracted to separate hook for code organization
  // These handlers rely on realtime subscriptions to update the UI
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
    loadData,
    characterId: character?.id,
    setSelectedAssignees,
  });

  const handleAssigneeChange = useCallback(
    (questId: string, assigneeId: string) => {
      setSelectedAssignees((prev) => ({ ...prev, [questId]: assigneeId }));
    },
    [],
  );

  // Quest filtering using helpers (memoized for performance)
  const myQuests = useMemo(
    () => QuestHelpers.filterQuestsByUser(questInstances, user?.id),
    [questInstances, user?.id],
  );

  const myActiveQuests = useMemo(
    () => QuestHelpers.filterActiveQuests(myQuests),
    [myQuests],
  );

  const myHistoricalQuests = useMemo(
    () => QuestHelpers.filterHistoricalQuests(myQuests),
    [myQuests],
  );

  const bossHistoryQuests = useMemo(
    () => bossQuests.filter((boss) => boss.status === "DEFEATED"),
    [bossQuests],
  );

  const claimableFamilyQuests = useMemo(
    () => QuestHelpers.filterClaimableFamilyQuests(questInstances),
    [questInstances],
  );

  const pendingApprovalQuests = useMemo(
    () => QuestHelpers.filterPendingApprovalQuests(questInstances),
    [questInstances],
  );

  const assignableCharacters = useMemo(
    () => QuestHelpers.mapFamilyCharactersToAssignmentDisplay(familyCharacters),
    [familyCharacters],
  );

  const getAssignedHeroName = useCallback(
    (quest: QuestInstance) =>
      QuestHelpers.getAssignedHeroName(quest, familyCharacters),
    [familyCharacters],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fantasy-card p-6 text-center text-red-400">
        <p>{error}</p>
        <Button
          type="button"
          variant="success"
          size="sm"
          className="mt-4 px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600"
          onClick={() => void loadData()}
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

      {isGuildMaster && pendingApprovalQuests.length > 0 && (
        <PendingApprovalsSection
          quests={pendingApprovalQuests}
          assignmentOptions={assignableCharacters}
          selectedAssignees={selectedAssignees}
          onAssigneeChange={handleAssigneeChange}
          onAssign={handleAssignQuest}
          onApprove={handleApproveQuest}
          onDeny={handleDenyQuest}
          onCancel={handleCancelQuest}
          onRelease={handleGmReleaseQuest}
          getAssignedHeroName={getAssignedHeroName}
        />
      )}

      {/* My Quests Section */}
      <section>
        <div className="mb-4">
          <h3 className="text-xl font-fantasy text-gray-200">🗡️ My Quests</h3>
          {myHistoricalQuests.length + bossHistoryQuests.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Completed adventures live in Quest History near the bottom of the
              page.
            </p>
          )}
        </div>
        <QuestList
          quests={myActiveQuests}
          emptyMessage="You have no active quests right now."
          emptyHint={
            myHistoricalQuests.length + bossHistoryQuests.length > 0
              ? "Check Quest History to revisit your completed quests."
              : undefined
          }
          onStartQuest={(id) => handleStatusUpdate(id, "IN_PROGRESS")}
          onCompleteQuest={(id) => handleStatusUpdate(id, "COMPLETED")}
          onReleaseQuest={handleReleaseQuest}
          familyMembers={familyMembers}
        />
      </section>

      {/* Family Quest Claiming (for characters) */}
      {character && claimableFamilyQuests.length > 0 && (
        <section>
          <FamilyQuestClaiming
            quests={claimableFamilyQuests}
            character={character}
            onClaimQuest={handleClaimQuest}
          />
        </section>
      )}

      {/* Quest History */}
      {myHistoricalQuests.length + bossHistoryQuests.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-xl font-fantasy text-gray-200">
              📜 Quest History
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-md border border-gray-700 text-sm text-gray-300 hover:bg-gray-800"
              onClick={() => setShowQuestHistory((prev) => !prev)}
            >
              {showQuestHistory
                ? "Hide History"
                : `Show History (${myHistoricalQuests.length + bossHistoryQuests.length})`}
            </Button>
          </div>
          {showQuestHistory && (
            <div className="space-y-3">
              <QuestList
                quests={myHistoricalQuests}
                familyMembers={familyMembers}
              />
              <BossQuestHistoryList bossQuests={bossHistoryQuests} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
