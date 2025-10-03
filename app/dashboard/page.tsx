'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import { useRealtime } from '@/lib/realtime-context';
import QuestDashboard from '@/components/quest-dashboard';
import QuestCreateModal from '@/components/quest-create-modal';
import RewardStore from '@/components/reward-store';
import { QuestTemplateManager } from '@/components/quest-template-manager';
import RewardManager from '@/components/reward-manager';
import { FamilyManagement } from '@/components/family-management';
import { QuestTemplate } from '@/lib/types/database';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, family, logout, isLoading } = useAuth();
  const { character, isLoading: characterLoading, error: characterError, hasLoaded: characterHasLoaded, refreshCharacter } = useCharacter();
  const { onQuestTemplateUpdate } = useRealtime();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'quests' | 'rewards' | 'templates' | 'reward-management' | 'family'>('quests');
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  const [questTemplates, setQuestTemplates] = useState<QuestTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const dashboardLoadQuestsRef = useRef<(() => Promise<void>) | null>(null);

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

  // Listen for character stats updates from quest approvals
  useEffect(() => {
    const handleCharacterStatsUpdate = () => {
      // Refresh character data when quest is approved
      refreshCharacter();
    };

    window.addEventListener('characterStatsUpdated', handleCharacterStatsUpdate as EventListener);

    return () => {
      window.removeEventListener('characterStatsUpdated', handleCharacterStatsUpdate as EventListener);
    };
  }, [refreshCharacter]);

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

  if (isLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your realm...</p>
        </div>
      </div>
    );
  }

  if (!user || !character) {
    return null;
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return '👑 Guild Master';
      case 'HERO': return '⚔️ Hero';
      case 'YOUNG_HERO': return '🛡️ Young Hero';
      default: return role;
    }
  };

  const getClassDisplay = (characterClass: string) => {
    switch (characterClass) {
      case 'KNIGHT': return '🛡️ Knight';
      case 'MAGE': return '🔮 Mage';
      case 'RANGER': return '🏹 Ranger';
      case 'ROGUE': return '🗡️ Rogue';
      case 'HEALER': return '💚 Healer';
      default: return characterClass;
    }
  };

  return (
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
                🕐 {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* Character info - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="text-left sm:text-right">
                <p className="text-gray-300 font-medium">{character.name}</p>
                <p className="text-sm text-gray-400" data-testid="character-level">{character.class ? getClassDisplay(character.class) : 'Unknown Class'} • Level {character.level}</p>
                <p className="text-xs text-gray-500">{profile?.role ? getRoleDisplay(profile.role) : ''}</p>
              </div>

              {/* Action buttons - mobile-optimized */}
              <div className="flex gap-2 sm:gap-3">
                {profile?.role === 'GUILD_MASTER' && (
                  <>
                    <button
                      onClick={() => router.push('/app/admin')}
                      className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-target"
                      data-testid="admin-button"
                    >
                      <span className="hidden sm:inline">⚙️ Admin</span>
                      <span className="sm:hidden">⚙️</span>
                    </button>
                    <button
                      onClick={() => setShowCreateQuest(true)}
                      className="bg-gold-600 hover:bg-gold-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-target"
                      data-testid="create-quest-button"
                    >
                      <span className="hidden sm:inline">⚡ Create Quest</span>
                      <span className="sm:hidden">⚡ Quest</span>
                    </button>
                  </>
                )}
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm transition-colors min-h-[44px] touch-target"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
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
            <div className="text-xl sm:text-3xl gold-text mb-1 sm:mb-2" data-testid="character-gold">💰 {character.gold}</div>
            <div className="text-xs sm:text-sm text-gray-400">Gold</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="text-xl sm:text-3xl xp-text mb-1 sm:mb-2" data-testid="character-xp">⚡ {character.xp}</div>
            <div className="text-xs sm:text-sm text-gray-400">Experience</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="text-xl sm:text-3xl gem-text mb-1 sm:mb-2" data-testid="character-gems">💎 {character.gems}</div>
            <div className="text-xs sm:text-sm text-gray-400">Gems</div>
          </div>
          <div className="fantasy-card p-3 sm:p-6 text-center">
            <div className="text-xl sm:text-3xl text-primary-400 mb-1 sm:mb-2" data-testid="character-honor-points">🏅 {character.honor_points}</div>
            <div className="text-xs sm:text-sm text-gray-400">Honor Points</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-dark-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('quests')}
            data-testid="tab-quests"
            className={`flex-1 py-3 px-3 sm:px-6 rounded-lg font-medium transition-colors min-h-[48px] touch-target text-sm sm:text-base ${
              activeTab === 'quests'
                ? 'bg-gold-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
            }`}
          >
            <span className="hidden sm:inline">⚔️ Quests & Adventures</span>
            <span className="sm:hidden">⚔️ Quests</span>
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            data-testid="tab-rewards"
            className={`flex-1 py-3 px-3 sm:px-6 rounded-lg font-medium transition-colors min-h-[48px] touch-target text-sm sm:text-base ${
              activeTab === 'rewards'
                ? 'bg-gold-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
            }`}
          >
            <span className="hidden sm:inline">🏪 Reward Store</span>
            <span className="sm:hidden">🏪 Rewards</span>
          </button>
          {profile?.role === 'GUILD_MASTER' && (
            <>
              <button
                onClick={() => setActiveTab('templates')}
                data-testid="tab-templates"
                className={`flex-1 py-3 px-3 sm:px-6 rounded-lg font-medium transition-colors min-h-[48px] touch-target text-sm sm:text-base ${
                  activeTab === 'templates'
                    ? 'bg-gold-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
                }`}
              >
                <span className="hidden sm:inline">📜 Quest Templates</span>
                <span className="sm:hidden">📜 Templates</span>
              </button>
              <button
                onClick={() => setActiveTab('reward-management')}
                className={`flex-1 py-3 px-3 sm:px-6 rounded-lg font-medium transition-colors min-h-[48px] touch-target text-sm sm:text-base ${
                  activeTab === 'reward-management'
                    ? 'bg-gold-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
                }`}
              >
                <span className="hidden sm:inline">⚙️ Reward Management</span>
                <span className="sm:hidden">⚙️ Manage</span>
              </button>
              <button
                onClick={() => setActiveTab('family')}
                data-testid="tab-family"
                className={`flex-1 py-3 px-3 sm:px-6 rounded-lg font-medium transition-colors min-h-[48px] touch-target text-sm sm:text-base ${
                  activeTab === 'family'
                    ? 'bg-gold-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
                }`}
              >
                <span className="hidden sm:inline">👥 Family Management</span>
                <span className="sm:hidden">👥 Family</span>
              </button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'quests' ? (
          <QuestDashboard
            onError={handleError}
            onLoadQuestsRef={(loadQuests) => {
              dashboardLoadQuestsRef.current = loadQuests;
            }}
          />
        ) : activeTab === 'rewards' ? (
          <RewardStore onError={handleError} />
        ) : activeTab === 'templates' ? (
          <QuestTemplateManager />
        ) : activeTab === 'reward-management' ? (
          <RewardManager />
        ) : activeTab === 'family' ? (
          <FamilyManagement />
        ) : null}

        {/* Quest Create Modal */}
        <QuestCreateModal
          isOpen={showCreateQuest}
          onClose={() => setShowCreateQuest(false)}
          onQuestCreated={handleQuestCreated}
          templates={questTemplates}
        />
      </main>
    </div>
  );
}