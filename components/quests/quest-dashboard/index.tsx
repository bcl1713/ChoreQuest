"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { QuestInstance, QuestStatus } from "@/lib/types/database";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import FamilyQuestClaiming from "@/components/family-quest-claiming";
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
  const { user, profile } = useAuth();

  // Custom hooks for data fetching
  const { familyMembers, familyCharacters, loading: familyLoading, error: familyError, reload: reloadFamily } = useFamilyMembers();
  const { character, loading: characterLoading, error: characterError, reload: reloadCharacter } = useCharacter();
  const { quests: questInstances, loading: questsLoading, error: questsError, reload: reloadQuests } = useQuests();

  // Local state
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});
  const [selectedFamilyAssignments, setSelectedFamilyAssignments] = useState<Record<string, string>>({});
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

  // Quest action handlers
  const handleStatusUpdate = async (questId: string, status: QuestStatus) => {
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
  };

  const handlePickupQuest = async (quest: QuestInstance) => {
    if (!user) {
      onError("You must be signed in to pick up quests.");
      return;
    }

    if (quest.quest_type === "FAMILY") {
      await handleClaimQuest(quest.id);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("quest_instances")
        .update({ assigned_to_id: user.id, status: "PENDING" })
        .eq("id", quest.id);
      if (updateError) throw new Error(updateError.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to pick up quest");
      await loadData();
    }
  };

  const handleAssignQuest = async (questId: string, assigneeId: string) => {
    if (!assigneeId) return;
    try {
      const { error: updateError } = await supabase
        .from("quest_instances")
        .update({ assigned_to_id: assigneeId, status: "PENDING" })
        .eq("id", questId);
      if (updateError) throw new Error(updateError.message);
      setSelectedAssignee((prev) => ({ ...prev, [questId]: "" }));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to assign quest");
      await loadData();
    }
  };

  const handleAssignFamilyQuest = async (questId: string, characterId: string) => {
    if (!characterId) return;
    try {
      await questInstanceApiService.assignFamilyQuest(questId, characterId);
      setSelectedFamilyAssignments((prev) => {
        const updated = { ...prev };
        delete updated[questId];
        return updated;
      });
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to assign family quest");
      await loadData();
    }
  };

  const handleCancelQuest = async (questId: string) => {
    const confirmed = typeof window === "undefined" ? true : window.confirm("Are you sure you want to cancel this quest?");
    if (!confirmed) return;
    try {
      const { error: deleteError } = await supabase.from("quest_instances").delete().eq("id", questId);
      if (deleteError) throw new Error(deleteError.message);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to cancel quest");
      await loadData();
    }
  };

  const handleClaimQuest = async (questId: string) => {
    try {
      await questInstanceApiService.claimQuest(questId);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to claim quest");
    }
  };

  const handleReleaseQuest = async (questId: string) => {
    try {
      await questInstanceApiService.releaseQuest(questId);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to release quest");
    }
  };

  const handleApproveQuest = async (questId: string) => {
    try {
      await questInstanceApiService.approveQuest(questId);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to approve quest");
    }
  };

  // Quest filtering using helpers
  const myQuests = QuestHelpers.filterQuestsByUser(questInstances, user?.id);
  const myActiveQuests = QuestHelpers.filterActiveQuests(myQuests);
  const myHistoricalQuests = QuestHelpers.filterHistoricalQuests(myQuests);
  const unassignedIndividualQuests = QuestHelpers.filterUnassignedIndividualQuests(questInstances);
  const unassignedFamilyQuests = QuestHelpers.filterUnassignedFamilyQuests(questInstances);
  const questsAwaitingApproval = QuestHelpers.filterQuestsAwaitingApproval(questInstances);
  // Filter out quests that are already in the awaiting approval section
  const otherQuests = profile?.role === "GUILD_MASTER"
    ? QuestHelpers.filterOtherQuests(questInstances, user?.id).filter(q => q.status !== "COMPLETED")
    : [];
  const claimableFamilyQuests = QuestHelpers.filterClaimableFamilyQuests(questInstances);

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
          canStart={(quest) => QuestHelpers.canUpdateStatus(quest, "IN_PROGRESS", user?.id, profile?.role)}
          canComplete={(quest) => QuestHelpers.canUpdateStatus(quest, "COMPLETED", user?.id, profile?.role)}
          canRelease={(quest) => quest.quest_type === "FAMILY" && quest.status === "CLAIMED"}
        />
      </section>

      {/* Quests Awaiting Approval (Guild Master only) */}
      {profile?.role === "GUILD_MASTER" && questsAwaitingApproval.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">🛡️ Quests Awaiting Approval</h3>
          <QuestList
            quests={questsAwaitingApproval}
            variant="awaiting-approval"
            onApproveQuest={handleApproveQuest}
            canApprove={() => true}
            getAssignedHeroName={(quest) => QuestHelpers.getAssignedHeroName(quest, familyMembers)}
          />
        </section>
      )}

      {/* Family Quest Claiming (for characters) */}
      {character && claimableFamilyQuests.length > 0 && (
        <section>
          <FamilyQuestClaiming quests={claimableFamilyQuests} character={character} onClaimQuest={handleClaimQuest} />
        </section>
      )}

      {/* Manual Family Quest Assignment (Guild Master only) */}
      {profile?.role === "GUILD_MASTER" && claimableFamilyQuests.length > 0 && (
        <section className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-fantasy text-gray-100">👑 Manual Family Quest Assignment</h3>
            <p className="text-sm text-gray-400">Assign a family quest directly to a hero when no one has claimed it.</p>
          </div>
          {familyCharacters.length === 0 ? (
            <p className="text-sm text-gray-400">No hero characters found. Ask heroes to create their characters before assigning quests.</p>
          ) : (
            <QuestList
              quests={claimableFamilyQuests}
              variant="family-gm"
              showAssignment={() => true}
              getAssignmentOptions={(quest) => QuestHelpers.getAssignmentOptions(quest, familyMembers, familyCharacters)}
              getSelectedAssignee={(questId) => selectedFamilyAssignments[questId] ?? ""}
              onAssigneeChange={(questId, assigneeId) => setSelectedFamilyAssignments((prev) => ({ ...prev, [questId]: assigneeId }))}
              onAssignQuest={handleAssignFamilyQuest}
            />
          )}
        </section>
      )}

      {/* Available Quests */}
      {unassignedIndividualQuests.length > 0 && (
        <section>
          <h3 data-testid="available-quests-heading" className="text-xl font-fantasy text-gray-200 mb-4">📋 Available Quests</h3>
          <QuestList
            quests={unassignedIndividualQuests}
            variant="available"
            onPickupQuest={handlePickupQuest}
            onCancelQuest={handleCancelQuest}
            onAssignQuest={handleAssignQuest}
            canPickup={() => true}
            canCancel={() => profile?.role === "GUILD_MASTER"}
            showAssignment={() => profile?.role === "GUILD_MASTER"}
            getAssignmentOptions={(quest) => QuestHelpers.getAssignmentOptions(quest, familyMembers, familyCharacters)}
            getSelectedAssignee={(questId) => selectedAssignee[questId] ?? ""}
            onAssigneeChange={(questId, assigneeId) => setSelectedAssignee((prev) => ({ ...prev, [questId]: assigneeId }))}
          />
        </section>
      )}

      {/* Family Quests (GM View) */}
      {profile?.role === "GUILD_MASTER" && unassignedFamilyQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">🏰 Family Quests (GM View)</h3>
          <QuestList quests={unassignedFamilyQuests} variant="family-gm" onCancelQuest={handleCancelQuest} canCancel={() => true} />
        </section>
      )}

      {/* Family Quests (Other Heroes) */}
      {profile?.role === "GUILD_MASTER" && otherQuests.length > 0 && (
        <section>
          <h3 className="text-xl font-fantasy text-gray-200 mb-4">👥 Family Quests</h3>
          <QuestList
            quests={otherQuests}
            onApproveQuest={handleApproveQuest}
            onCancelQuest={handleCancelQuest}
            canApprove={(quest) => quest.status === "COMPLETED"}
            canCancel={(quest) => quest.status !== "COMPLETED" && quest.status !== "APPROVED"}
          />
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
          {showQuestHistory && <QuestList quests={myHistoricalQuests} variant="historical" />}
        </section>
      )}
    </div>
  );
}
