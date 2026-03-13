"use client";
import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCharacter } from "@/hooks/useCharacter";
import { useQuests } from "@/hooks/useQuests";
import { useBossQuests } from "@/hooks/useBossQuests";
import * as QuestHelpers from "./quest-helpers";
import type { QuestInstance } from "@/lib/types/database";

interface UseQuestDashboardDataProps {
  onError: (error: string) => void;
  onLoadQuestsRef?: (reload: () => Promise<void>) => void;
}

export function useQuestDashboardData({
  onError,
  onLoadQuestsRef,
}: UseQuestDashboardDataProps) {
  const { user, profile } = useAuth();

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

  const loading =
    familyLoading || characterLoading || questsLoading || bossLoading;
  const error = familyError || characterError || questsError || bossError;

  const loadData = useCallback(async () => {
    await Promise.all([
      reloadFamily(),
      reloadCharacter(),
      reloadQuests(),
      reloadBossQuests(),
    ]);
  }, [reloadFamily, reloadCharacter, reloadQuests, reloadBossQuests]);

  useEffect(() => {
    if (!onLoadQuestsRef) return;
    onLoadQuestsRef(loadData);
  }, [loadData, onLoadQuestsRef]);

  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  const isGuildMaster = profile?.role === "GUILD_MASTER";

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

  return {
    loading,
    error,
    loadData,
    isGuildMaster,
    character,
    familyMembers,
    myActiveQuests,
    myHistoricalQuests,
    bossQuests,
    bossHistoryQuests,
    claimableFamilyQuests,
    pendingApprovalQuests,
    assignableCharacters,
    getAssignedHeroName,
  };
}
