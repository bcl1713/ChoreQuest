"use client";

import React from "react";
import {
  ProgressBar,
  LevelUpModal,
  QuestCompleteOverlay,
  type QuestReward,
} from "@/components/animations";
import { Button } from "@/components/ui";
import QuestDashboard from "@/components/quests/quest-dashboard";
import QuestCreateModal from "@/components/quests/quest-create-modal";
import RewardStore from "@/components/rewards/reward-store";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Award,
  Coins,
  Gem,
  Store,
  Sword,
  Zap,
} from "lucide-react";
import type {
  Character,
  Family,
  UserProfile,
  QuestTemplate,
} from "@/lib/types/database";
import { StatCard } from "./stat-card";
import { DashboardHeader } from "./dashboard-header";

type DashboardLayoutProps = {
  character: Character;
  family: Family | null;
  profile: UserProfile | null;
  levelProgress: { current: number; required: number };
  currentTime: Date;
  activeTab: "quests" | "rewards";
  authError: string | null;
  error: string | null;
  setActiveTab: (tab: "quests" | "rewards") => void;
  onCreateQuest: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  onLogout: () => void;
  onError: (message: string) => void;
  onQuestCreated: () => Promise<void>;
  onRegisterQuestLoader: (cb: () => Promise<void>) => void;
  questTemplates: QuestTemplate[];
  showCreateQuest: boolean;
  setShowCreateQuest: (open: boolean) => void;
  levelUpEvent: {
    oldLevel: number;
    newLevel: number;
    characterName: string;
    characterClass: string;
  } | null;
  clearLevelUpEvent: () => void;
  questCompleteData: {
    show: boolean;
    questTitle: string;
    rewards: QuestReward;
    streakBonus?: number;
    volunteerBonus?: number;
  };
  onQuestCompleteDismiss: () => void;
};

export function DashboardLayout({
  character,
  family,
  profile,
  levelProgress,
  currentTime,
  activeTab,
  authError,
  error,
  setActiveTab,
  onCreateQuest,
  onProfile,
  onAdmin,
  onLogout,
  onError,
  onQuestCreated,
  onRegisterQuestLoader,
  questTemplates,
  showCreateQuest,
  setShowCreateQuest,
  levelUpEvent,
  clearLevelUpEvent,
  questCompleteData,
  onQuestCompleteDismiss,
}: DashboardLayoutProps) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <DashboardHeader
          character={character}
          family={family}
          profile={profile}
          currentTime={currentTime}
          onCreateQuest={onCreateQuest}
          onProfile={onProfile}
          onAdmin={onAdmin}
          onLogout={onLogout}
        />

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          {authError && (
            <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200 flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p className="font-medium">{authError}</p>
            </div>
          )}

          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="text-2xl sm:4xl font-fantasy text-gray-100 mb-4"
              data-testid="welcome-message"
            >
              Welcome back, {character.name}!
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Your heroic dashboard awaits. Ready for new quests?
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
            <StatCard
              icon={<Coins size={24} />}
              label="Gold"
              value={character.gold}
              testId="character-gold"
            />
            <StatCard
              icon={<Zap size={24} />}
              label="Experience"
              value={character.xp}
              testId="character-xp"
            />
            <StatCard
              icon={<Gem size={24} />}
              label="Gems"
              value={character.gems}
              testId="character-gems"
            />
            <StatCard
              icon={<Award size={24} />}
              label="Honor Points"
              value={character.honor_points}
              testId="character-honor-points"
            />
          </div>

          <div className="mb-8 sm:mb-12">
            <ProgressBar
              current={levelProgress.current}
              max={levelProgress.required}
              label="Experience Progress"
              showValues
              showPercentage
              variant="gold"
            />
            <p className="mt-2 text-sm text-gray-400">
              Total XP:{" "}
              <span className="text-gray-200">
                {(character.xp || 0).toLocaleString()}
              </span>
            </p>
          </div>

          <div className="flex space-x-1 mb-6 sm:mb-8 bg-dark-800 p-1 rounded-lg">
            <Button
              onClick={() => setActiveTab("quests")}
              data-testid="tab-quests"
              variant={activeTab === "quests" ? "gold" : "ghost"}
              size="lg"
              startIcon={<Sword aria-hidden="true" className="h-full w-full" />}
              className={cn(
                "flex-1 touch-target",
                activeTab !== "quests" && "text-gray-300 hover:text-gray-100",
              )}
            >
              <span className="hidden sm:inline">Quests & Adventures</span>
              <span className="sm:hidden">Quests</span>
            </Button>
            <Button
              onClick={() => setActiveTab("rewards")}
              data-testid="tab-rewards"
              variant={activeTab === "rewards" ? "gold" : "ghost"}
              size="lg"
              startIcon={<Store aria-hidden="true" className="h-full w-full" />}
              className={cn(
                "flex-1 touch-target",
                activeTab !== "rewards" && "text-gray-300 hover:text-gray-100",
              )}
            >
              <span className="hidden sm:inline">Reward Store</span>
              <span className="sm:hidden">Rewards</span>
            </Button>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="flex-shrink-0 mt-0.5 text-red-400"
              />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {activeTab === "quests" ? (
            <QuestDashboard
              onError={onError}
              onLoadQuestsRef={(loadQuests: () => Promise<void>) => {
                onRegisterQuestLoader(loadQuests);
              }}
            />
          ) : (
            <RewardStore onError={onError} />
          )}

          <QuestCreateModal
            isOpen={showCreateQuest}
            onClose={() => setShowCreateQuest(false)}
            onQuestCreated={onQuestCreated}
            templates={questTemplates}
          />

          {levelUpEvent && !questCompleteData.show && (
            <LevelUpModal
              show
              oldLevel={levelUpEvent.oldLevel}
              newLevel={levelUpEvent.newLevel}
              characterName={levelUpEvent.characterName}
              characterClass={levelUpEvent.characterClass}
              onDismiss={clearLevelUpEvent}
            />
          )}

          <QuestCompleteOverlay
            show={questCompleteData.show}
            questTitle={questCompleteData.questTitle}
            rewards={questCompleteData.rewards}
            streakBonus={questCompleteData.streakBonus}
            volunteerBonus={questCompleteData.volunteerBonus}
            onDismiss={onQuestCompleteDismiss}
          />
        </main>
      </div>
    </>
  );
}
