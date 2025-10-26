'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import { useRealtime } from '@/lib/realtime-context';
import QuestDashboard from '@/components/quests/quest-dashboard';
import QuestCreateModal from '@/components/quests/quest-create-modal';
import RewardStore from '@/components/rewards/reward-store';
import { QuestTemplate } from '@/lib/types/database';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { ProgressBar, LevelUpModal, QuestCompleteOverlay, type QuestReward } from '@/components/animations';
import { RewardCalculator } from '@/lib/reward-calculator';
import { LoadingSpinner, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Sword, Store, Crown, Settings, AlertCircle, Shield, Wand, Crosshair, Sparkles, Coins, Zap, Gem, Award } from 'lucide-react';

// Component to handle search params (must be wrapped in Suspense)
function AuthErrorHandler({ onAuthError }: { onAuthError: (error: string | null) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      onAuthError('You are not authorized to access the admin dashboard. Only Guild Masters have access.');
      // Clear error after 5 seconds
      setTimeout(() => onAuthError(null), 5000);
      // Clean up URL
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router, onAuthError]);

  return null;
}

function DashboardContent() {
  const router = useRouter();
  const { user, profile, family, logout, isLoading } = useAuth();
  const { character, isLoading: characterLoading, error: characterError, hasLoaded: characterHasLoaded, levelUpEvent, clearLevelUpEvent } = useCharacter();
  const { onQuestTemplateUpdate, onQuestUpdate } = useRealtime();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'quests' | 'rewards'>('quests');
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  const [questTemplates, setQuestTemplates] = useState<QuestTemplate[]>([]);
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
    questTitle: '',
    rewards: {},
  });


  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Only redirect to character creation if:
    // 1. Auth is not loading
    // 2. User exists
    // 3. Character fetch has completed (hasLoaded = true)
    // 4. No character was found (character === null)
    // 5. No error occurred during fetch (successful "no character" response)
    if (!isLoading && user && characterHasLoaded && character === null && !characterError) {
      window.location.href = '/character/create';
    }
  }, [user, character, isLoading, characterHasLoaded, characterError, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadQuestTemplates = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      const { data: templates, error } = await supabase
        .from('quest_templates')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('is_active', true);

      if (error) throw error;
      setQuestTemplates(templates || []);
    } catch (err) {
      console.error('Failed to load quest templates:', err);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    if (user && character) {
      loadQuestTemplates();
    }
  }, [user, character, loadQuestTemplates]);

  // Set up realtime quest template updates
  useEffect(() => {
    if (!user || !profile) return;

    const unsubscribe = onQuestTemplateUpdate((event) => {
      setQuestTemplates(currentTemplates => {
        if (event.action === 'INSERT') {
          // Add new template
          const newTemplate = event.record as QuestTemplate;
          // Only add active templates
          if (newTemplate.is_active) {
            return [...currentTemplates, newTemplate];
          }
          return currentTemplates;
        } else if (event.action === 'UPDATE') {
          // Update existing template
          const updatedTemplate = event.record as QuestTemplate;
          const existsInList = currentTemplates.some(t => t.id === updatedTemplate.id);

          if (updatedTemplate.is_active) {
            // Template is active
            if (existsInList) {
              // Update existing template
              return currentTemplates.map(template =>
                template.id === updatedTemplate.id ? updatedTemplate : template
              );
            } else {
              // Add newly activated template
              return [...currentTemplates, updatedTemplate];
            }
          } else {
            // Template is inactive - remove it from the list
            return currentTemplates.filter(template => template.id !== updatedTemplate.id);
          }
        } else if (event.action === 'DELETE') {
          // Remove template (old_record requires REPLICA IDENTITY FULL on table)
          return currentTemplates.filter(template => template.id !== event.old_record?.id);
        }
        return currentTemplates;
      });
    });

    return unsubscribe;
  }, [user, profile, onQuestTemplateUpdate]);

  // Character stats updates are now handled automatically by CharacterContext's
  // realtime subscription (see lib/character-context.tsx lines 206-229).
  // No need to manually call refreshCharacter on custom events.

  // Set up realtime quest updates to show congratulations modal when quest is approved
  useEffect(() => {
    if (!user || !character) return;

    const unsubscribe = onQuestUpdate(async (event) => {
      // Only process UPDATE events where status changes to APPROVED
      if (event.action === 'UPDATE') {
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

        // Check if this quest was just approved and is assigned to current user
        const wasJustApproved = updatedQuest.status === 'APPROVED';
        const isAssignedToMe = updatedQuest.assigned_to_id === user.id;

        if (wasJustApproved && isAssignedToMe && character) {
          // Calculate rewards with bonuses using the same logic as quest approval
          const baseRewards = {
            xpReward: updatedQuest.xp_reward || 0,
            goldReward: updatedQuest.gold_reward || 0,
            gemsReward: 0,
            honorPointsReward: 0,
          };

          const calculatedRewards = RewardCalculator.calculateQuestRewards(
            baseRewards,
            (updatedQuest.difficulty as 'EASY' | 'MEDIUM' | 'HARD') || 'MEDIUM',
            character.class as 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER'
          );

          // Show congratulations modal with calculated rewards
          setQuestCompleteData({
            show: true,
            questTitle: updatedQuest.title || 'Quest Complete!',
            rewards: {
              xp: calculatedRewards.xp,
              gold: calculatedRewards.gold,
            },
            streakBonus: updatedQuest.streak_bonus,
            volunteerBonus: updatedQuest.volunteer_bonus,
          });
        }
      }
    });

    return unsubscribe;
  }, [user, character, onQuestUpdate]);

  const handleQuestCreated = async () => {
    loadQuestTemplates();
    // Also refresh the quest dashboard
    if (dashboardLoadQuestsRef.current) {
      await dashboardLoadQuestsRef.current();
    }
  };

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleQuestCompleteDismiss = useCallback(() => {
    setQuestCompleteData({ show: false, questTitle: '', rewards: {} });
  }, []);

  if (isLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" aria-label="Loading your realm" />
          <p className="text-gray-400">Loading your realm...</p>
        </div>
      </div>
    );
  }

  if (!user || !character) {
    return null;
  }

  const levelProgress = RewardCalculator.getLevelProgress(
    character.level || 1,
    character.xp || 0
  );

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return 'Guild Master';
      case 'HERO': return 'Hero';
      case 'YOUNG_HERO': return 'Young Hero';
      default: return role;
    }
  };

  const getClassDisplay = (characterClass: string) => {
    switch (characterClass) {
      case 'KNIGHT': return 'Knight';
      case 'MAGE': return 'Mage';
      case 'RANGER': return 'Ranger';
      case 'ROGUE': return 'Rogue';
      case 'HEALER': return 'Healer';
      default: return characterClass;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return <Crown size={16} aria-hidden="true" className="text-gold-400" />;
      case 'HERO': return <Sword size={16} aria-hidden="true" className="text-primary-400" />;
      case 'YOUNG_HERO': return <Shield size={16} aria-hidden="true" className="text-blue-400" />;
      default: return null;
    }
  };

  const getClassIcon = (characterClass: string) => {
    switch (characterClass) {
      case 'KNIGHT': return <Shield size={16} aria-hidden="true" />;
      case 'MAGE': return <Wand size={16} aria-hidden="true" />;
      case 'RANGER': return <Crosshair size={16} aria-hidden="true" />;
      case 'ROGUE': return <Sword size={16} aria-hidden="true" />;
      case 'HEALER': return <Sparkles size={16} aria-hidden="true" />;
      default: return null;
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorHandler onAuthError={setAuthError} />
      </Suspense>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Header */}
        <header className="border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile-first header layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
                ChoreQuest
              </h1>
              {family && (
                <p className="text-sm text-gray-400">
                  Guild: <span className="text-gold-400">{family.name}</span> ({family.code})
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* Character info - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="text-left sm:text-right">
                <p className="text-gray-300 font-medium">{character.name}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1 sm:justify-end" data-testid="character-level">
                  {character.class && getClassIcon(character.class)}
                  {character.class ? getClassDisplay(character.class) : 'Unknown Class'} • Level {character.level}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 sm:justify-end">{profile?.role && getRoleIcon(profile.role)} {profile?.role ? getRoleDisplay(profile.role) : ''}</p>
              </div>

              {/* Action buttons - mobile-optimized */}
              <div className="flex gap-2 sm:gap-3">
                {profile?.role === 'GUILD_MASTER' && (
                  <>
                    <Button
                      onClick={() => router.push('/admin')}
                      variant="primary"
                      size="sm"
                      className="touch-target"
                      data-testid="admin-dashboard-button"
                      startIcon={<Settings size={16} aria-hidden="true" />}
                    >
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                    <Button
                      onClick={() => setShowCreateQuest(true)}
                      variant="gold"
                      size="sm"
                      className="touch-target"
                      data-testid="create-quest-button"
                      startIcon={<Sword size={16} aria-hidden="true" />}
                    >
                      <span className="hidden sm:inline">Create Quest</span>
                      <span className="sm:hidden">Quest</span>
                    </Button>
                  </>
                )}
                <Button
                  onClick={logout}
                  variant="destructive"
                  size="sm"
                  className="touch-target"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Authorization Error Banner */}
        {authError && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200 flex items-center gap-2">
            <AlertCircle size={20} aria-hidden="true" />
            <p className="font-medium">{authError}</p>
          </div>
        )}

        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-fantasy text-gray-100 mb-4" data-testid="welcome-message">
            Welcome back, {character.name}!
          </h2>
          <p className="text-base sm:text-lg text-gray-400">
            Your heroic dashboard awaits. Ready for new quests?
          </p>
        </div>

        {/* Character Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <Coins size={20} aria-hidden="true" className="text-gold-400" />
              <span className="text-xl sm:text-3xl gold-text" data-testid="character-gold">{character.gold}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Gold</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <Zap size={20} aria-hidden="true" className="text-xp-500" />
              <span className="text-xl sm:text-3xl xp-text" data-testid="character-xp">{character.xp}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Experience</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <Gem size={20} aria-hidden="true" className="text-gem-400" />
              <span className="text-xl sm:text-3xl gem-text" data-testid="character-gems">{character.gems}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Gems</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
              <Award size={20} aria-hidden="true" className="text-primary-400" />
              <span className="text-xl sm:text-3xl text-primary-400" data-testid="character-honor-points">{character.honor_points}</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Honor Points</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <ProgressBar
            current={levelProgress.current}
            max={levelProgress.required}
            label="Experience Progress"
            showValues={true}
            showPercentage={true}
            variant="gold"
          />
          <p className="mt-2 text-sm text-gray-400">
            Total XP: <span className="text-gray-200">{(character.xp || 0).toLocaleString()}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-dark-800 p-1 rounded-lg">
          <Button
            onClick={() => setActiveTab('quests')}
            data-testid="tab-quests"
            variant={activeTab === 'quests' ? 'gold' : 'ghost'}
            size="lg"
            startIcon={<Sword aria-hidden="true" className="h-full w-full" />}
            className={cn(
              'flex-1 touch-target',
              activeTab !== 'quests' && 'text-gray-300 hover:text-gray-100'
            )}
          >
            <span className="hidden sm:inline">Quests & Adventures</span>
            <span className="sm:hidden">Quests</span>
          </Button>
          <Button
            onClick={() => setActiveTab('rewards')}
            data-testid="tab-rewards"
            variant={activeTab === 'rewards' ? 'gold' : 'ghost'}
            size="lg"
            startIcon={<Store aria-hidden="true" className="h-full w-full" />}
            className={cn(
              'flex-1 touch-target',
              activeTab !== 'rewards' && 'text-gray-300 hover:text-gray-100'
            )}
          >
            <span className="hidden sm:inline">Reward Store</span>
            <span className="sm:hidden">Rewards</span>
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle size={20} aria-hidden="true" className="text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'quests' ? (
          <QuestDashboard
            onError={handleError}
            onLoadQuestsRef={(loadQuests: () => Promise<void>) => {
              dashboardLoadQuestsRef.current = loadQuests;
            }}
          />
        ) : activeTab === 'rewards' ? (
          <RewardStore onError={handleError} />
        ) : null}

        {/* Quest Create Modal */}
        <QuestCreateModal
          isOpen={showCreateQuest}
          onClose={() => setShowCreateQuest(false)}
          onQuestCreated={handleQuestCreated}
          templates={questTemplates}
        />

        {/* Level Up Modal - only show if quest complete overlay is not visible */}
        {levelUpEvent && !questCompleteData.show && (
          <LevelUpModal
            show={true}
            oldLevel={levelUpEvent.oldLevel}
            newLevel={levelUpEvent.newLevel}
            characterName={levelUpEvent.characterName}
            characterClass={levelUpEvent.characterClass}
            onDismiss={clearLevelUpEvent}
          />
        )}

        {/* Quest Complete Overlay - takes priority over level-up modal */}
        <QuestCompleteOverlay
          show={questCompleteData.show}
          questTitle={questCompleteData.questTitle}
          rewards={questCompleteData.rewards}
          streakBonus={questCompleteData.streakBonus}
          volunteerBonus={questCompleteData.volunteerBonus}
          onDismiss={handleQuestCompleteDismiss}
        />
      </main>
    </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" aria-label="Loading your realm" />
          <p className="text-gray-400">Loading your realm...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
