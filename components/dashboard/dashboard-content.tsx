"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCharacter } from "@/lib/character-context";
import { useRealtime } from "@/lib/realtime-context";
import { RewardCalculator } from "@/lib/reward-calculator";
import { DashboardLayout } from "./dashboard-layout";
import { useQuestTemplates } from "./useQuestTemplates";
import { AuthErrorHandler } from "./auth-error-handler";
import { DashboardLoading } from "./dashboard-loading";
import type { QuestReward } from "@/components/animations";

export function DashboardContent() {
  const router = useRouter();
  const { user, profile, family, logout, isLoading } = useAuth();
  const {
    character,
    isLoading: characterLoading,
    error: characterError,
    hasLoaded: characterHasLoaded,
    levelUpEvent,
    clearLevelUpEvent,
  } = useCharacter();
  const { onQuestUpdate } = useRealtime();

  const [activeTab, setActiveTab] = useState<"quests" | "rewards">("quests");
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const dashboardLoadQuestsRef = useRef<(() => Promise<void>) | null>(null);
  const [questCompleteData, setQuestCompleteData] = useState<{
    show: boolean;
    questTitle: string;
    rewards: QuestReward;
    streakBonus?: number;
    volunteerBonus?: number;
  }>({
    show: false,
    questTitle: "",
    rewards: {},
  });

  const { questTemplates, reloadQuestTemplates } = useQuestTemplates({
    familyId: profile?.family_id,
    enabled: Boolean(user && profile && character),
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      characterHasLoaded &&
      character === null &&
      !characterError
    ) {
      window.location.href = "/character/create";
    }
  }, [user, character, isLoading, characterHasLoaded, characterError, router]);

  useEffect(() => {
    if (!user || !character) return;

    const unsubscribe = onQuestUpdate((event) => {
      if (event.action !== "UPDATE") return;
      const updatedQuest = event.record as {
        id: string;
        assigned_to_id?: string;
        status?: string;
        title?: string;
        xp_reward?: number;
        gold_reward?: number;
        difficulty?: string;
        streak_bonus?: number;
        volunteer_bonus?: number;
      };

      const wasJustApproved = updatedQuest.status === "APPROVED";
      const isAssignedToMe = updatedQuest.assigned_to_id === user.id;

      if (wasJustApproved && isAssignedToMe && character) {
        const baseRewards = {
          xpReward: updatedQuest.xp_reward || 0,
          goldReward: updatedQuest.gold_reward || 0,
          gemsReward: 0,
          honorPointsReward: 0,
        };

        const calculatedRewards = RewardCalculator.calculateQuestRewards(
          baseRewards,
          (updatedQuest.difficulty as "EASY" | "MEDIUM" | "HARD") || "MEDIUM",
          character.class as "KNIGHT" | "MAGE" | "RANGER" | "ROGUE" | "HEALER",
        );

        setQuestCompleteData({
          show: true,
          questTitle: updatedQuest.title || "Quest Complete!",
          rewards: {
            xp: calculatedRewards.xp,
            gold: calculatedRewards.gold,
          },
          streakBonus: updatedQuest.streak_bonus,
          volunteerBonus: updatedQuest.volunteer_bonus,
        });
      }
    });

    return unsubscribe;
  }, [user, character, onQuestUpdate]);

  const handleQuestCreated = useCallback(async () => {
    await reloadQuestTemplates();
    if (dashboardLoadQuestsRef.current) {
      await dashboardLoadQuestsRef.current();
    }
  }, [reloadQuestTemplates]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleQuestCompleteDismiss = useCallback(() => {
    setQuestCompleteData({ show: false, questTitle: "", rewards: {} });
  }, []);

  const levelProgress = useMemo(
    () =>
      RewardCalculator.getLevelProgress(
        character?.level || 1,
        character?.xp || 0,
      ),
    [character?.level, character?.xp],
  );

  if (isLoading || characterLoading) {
    return <DashboardLoading />;
  }

  if (!user || !character) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorHandler onAuthError={setAuthError} />
      </Suspense>
      <DashboardLayout
        character={character}
        family={family}
        profile={profile}
        levelProgress={levelProgress}
        activeTab={activeTab}
        authError={authError}
        error={error}
        setActiveTab={setActiveTab}
        onCreateQuest={() => setShowCreateQuest(true)}
        onProfile={() => router.push("/profile")}
        onAdmin={() => router.push("/admin")}
        onLogout={logout}
        onError={handleError}
        onQuestCreated={handleQuestCreated}
        onRegisterQuestLoader={(cb: () => Promise<void>) => {
          dashboardLoadQuestsRef.current = cb;
        }}
        questTemplates={questTemplates}
        showCreateQuest={showCreateQuest}
        setShowCreateQuest={setShowCreateQuest}
        levelUpEvent={levelUpEvent}
        clearLevelUpEvent={clearLevelUpEvent}
        questCompleteData={questCompleteData}
        onQuestCompleteDismiss={handleQuestCompleteDismiss}
      />
    </>
  );
}
