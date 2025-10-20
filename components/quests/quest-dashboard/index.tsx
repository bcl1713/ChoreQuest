"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { QuestInstance, QuestStatus } from "@/lib/types/database";
import { LoadingSpinner } from "@/components/ui";
import FamilyQuestClaiming from "@/components/family/family-quest-claiming";
import { questInstanceApiService } from "@/lib/quest-instance-api-service";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCharacter } from "@/hooks/useCharacter";
import { useQuests } from "@/hooks/useQuests";
import QuestList from "./quest-list";
import * as QuestHelpers from "./quest-helpers";

type QuestDashboardProps = {
  onError: (error: string) => void;
  onLoadQuestsRef?: (reload: () => Promise<void>) => void;
};

export default function QuestDashboard({ onError, onLoadQuestsRef }: QuestDashboardProps) {
  const { user } = useAuth();

  // Custom hooks for data fetching
  const { familyMembers, loading: familyLoading, error: familyError, reload: reloadFamily } = useFamilyMembers();
  const { character, loading: characterLoading, error: characterError, reload: reloadCharacter } = useCharacter();
  const { quests: questInstances, loading: questsLoading, error: questsError, reload: reloadQuests } = useQuests();

  // Local state
  const [showQuestHistory, setShowQuestHistory] = useState(false);

  // Combine loading and error states
  const loading = familyLoading || characterLoading || questsLoading;
  const error = familyError || characterError || questsError;

  // Combined reload function
  const loadData = useCallback(async () => {
    await Promise.all([reloadFamily(), reloadCharacter(), reloadQuests()]);
  }, [reloadFamily, reloadCharacter, reloadQuests]);

  // Expose reload function to parent component
  useEffect(() => {
    if (!onLoadQuestsRef) return;
    onLoadQuestsRef(loadData);
  }, [loadData, onLoadQuestsRef]);

  // Show errors via the onError callback
  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  // Quest action handlers (memoized with useCallback for stable references)
  const handleStatusUpdate = useCallback(async (questId: string, status: QuestStatus) => {
    try {
      if (status === "APPROVED") {
        await questInstanceApiService.approveQuest(questId);
        await loadData();
        return;
      }

      const updateData: Partial<QuestInstance> = { status };
      if (status === "COMPLETED") updateData.completed_at = new Date().toISOString();

      const { error: updateError } = await supabase.from("quest_instances").update(updateData).eq("id", questId);
      if (updateError) throw new Error(updateError.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update quest");
      await loadData();
    }
  }, [loadData, onError]);

  const handleClaimQuest = useCallback(async (questId: string) => {
    try {
      await questInstanceApiService.claimQuest(questId);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to claim quest");
    }
  }, [loadData, onError]);


  const handleReleaseQuest = useCallback(async (questId: string) => {
    if (!window.confirm("Release this quest back to available quests?")) {
      return;
    }
    try {
      // Pass character ID for family quests so the character's active_family_quest_id is cleared
      await questInstanceApiService.releaseQuest(questId, character?.id);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to release quest");
    }
  }, [loadData, onError, character?.id]);

  // Quest filtering using helpers (memoized for performance)
  const myQuests = useMemo(
    () => QuestHelpers.filterQuestsByUser(questInstances, user?.id),
    [questInstances, user?.id]
  );

  const myActiveQuests = useMemo(
    () => QuestHelpers.filterActiveQuests(myQuests),
    [myQuests]
  );

  const myHistoricalQuests = useMemo(
    () => QuestHelpers.filterHistoricalQuests(myQuests),
    [myQuests]
  );

  const claimableFamilyQuests = useMemo(
    () => QuestHelpers.filterClaimableFamilyQuests(questInstances),
    [questInstances]
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
        <button
          type="button"
          className="mt-4 px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition"
          onClick={() => void loadData()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-gray-100">Quest Dashboard</h2>
          <p className="text-gray-400 text-sm">Manage active quests, approvals, and family challenges.</p>
        </div>
      </div>

      {/* My Quests Section */}
      <section>
        <div className="mb-4">
          <h3 className="text-xl font-fantasy text-gray-200">🗡️ My Quests</h3>
          {myHistoricalQuests.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Completed adventures live in Quest History near the bottom of the page.</p>
          )}
        </div>
        <QuestList
          quests={myActiveQuests}
          emptyMessage="You have no active quests right now."
          emptyHint={myHistoricalQuests.length > 0 ? "Check Quest History to revisit your completed quests." : undefined}
          onStartQuest={(id) => handleStatusUpdate(id, "IN_PROGRESS")}
          onCompleteQuest={(id) => handleStatusUpdate(id, "COMPLETED")}
          onReleaseQuest={handleReleaseQuest}
          familyMembers={familyMembers}
        />
      </section>

      {/* Family Quest Claiming (for characters) */}
      {character && claimableFamilyQuests.length > 0 && (
        <section>
          <FamilyQuestClaiming quests={claimableFamilyQuests} character={character} onClaimQuest={handleClaimQuest} />
        </section>
      )}

      {/* Quest History */}
      {myHistoricalQuests.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-xl font-fantasy text-gray-200">📜 Quest History</h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-md border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition"
              onClick={() => setShowQuestHistory((prev) => !prev)}
            >
              {showQuestHistory ? "Hide History" : `Show History (${myHistoricalQuests.length})`}
            </button>
          </div>
          {showQuestHistory && <QuestList quests={myHistoricalQuests} familyMembers={familyMembers} />}
        </section>
      )}
    </div>
  );
}
