"use client";

import { useAuth } from "@/lib/auth-context";
import { useCharacter } from "@/lib/character-context";
import { LoadingSpinner, Button } from "@/components/ui";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ProfileErrorBoundary from "@/components/profile/ProfileErrorBoundary";
import { AchievementsSection } from "@/components/achievements/AchievementsSection";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { TabBar, type TabItem } from "@/components/ui/tab-bar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, Trophy } from "lucide-react";

type ProfileTab = "settings" | "achievements";

const PROFILE_TABS: TabItem<ProfileTab>[] = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    testId: "profile-tab-settings",
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: Trophy,
    testId: "profile-tab-achievements",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, family, logout, isLoading: authLoading } = useAuth();
  const {
    character,
    isLoading: characterLoading,
    error: characterError,
    refreshCharacter,
  } = useCharacter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("settings");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner
            size="lg"
            className="mb-4"
            aria-label="Loading your profile"
          />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (characterError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
        <div className="fantasy-card p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-fantasy text-gold-400 mb-4">
              Error Loading Profile
            </h1>
            <p className="text-gray-300 mb-6">{characterError}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !character) {
    return null;
  }

  return (
    <ProfileErrorBoundary>
      <AuthenticatedPageShell
        character={character}
        family={family}
        profile={profile}
        actions={
          <>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="primary"
              size="sm"
              className="touch-target"
              data-testid="back-to-dashboard-button"
            >
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
              className="touch-target"
            >
              Logout
            </Button>
          </>
        }
      >
        <div className="max-w-4xl mx-auto">
          <TabBar
            tabs={PROFILE_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6 rounded-t-lg"
          />

          {activeTab === "settings" && (
            <ProfileSettings
              character={character}
              onRefreshNeeded={refreshCharacter}
            />
          )}

          {activeTab === "achievements" && (
            <AchievementsSection characterId={character.id} />
          )}
        </div>
      </AuthenticatedPageShell>
    </ProfileErrorBoundary>
  );
}
