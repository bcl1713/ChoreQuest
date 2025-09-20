'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import QuestDashboard from '@/components/quest-dashboard';
import QuestCreateModal from '@/components/quest-create-modal';
import { questService } from '@/lib/quest-service';
import { QuestTemplate } from '@/lib/generated/prisma';

export default function Dashboard() {
  const router = useRouter();
  const { user, family, logout, isLoading } = useAuth();
  const { character, isLoading: characterLoading, error: characterError, hasLoaded: characterHasLoaded } = useCharacter();
  const [currentTime, setCurrentTime] = useState(new Date());
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
      router.push('/character/create');
    }
  }, [user, character, isLoading, characterHasLoaded, characterError, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && character) {
      loadQuestTemplates();
    }
  }, [user, character]);

  const loadQuestTemplates = async () => {
    try {
      const result = await questService.getQuestTemplates();
      setQuestTemplates(result.templates);
    } catch (err) {
      console.error('Failed to load quest templates:', err);
    }
  };

  const handleQuestCreated = async () => {
    loadQuestTemplates();
    // Also refresh the quest dashboard
    if (dashboardLoadQuestsRef.current) {
      await dashboardLoadQuestsRef.current();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

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
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
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
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-300 font-medium">{character.name}</p>
              <p className="text-sm text-gray-400">{getClassDisplay(character.class)} • Level {character.level}</p>
              <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
            </div>
            {user.role === 'GUILD_MASTER' && (
              <button
                onClick={() => setShowCreateQuest(true)}
                className="bg-gold-600 hover:bg-gold-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ⚡ Create Quest
              </button>
            )}
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-fantasy text-gray-100 mb-4">
            Welcome back, {character.name}!
          </h2>
          <p className="text-lg text-gray-400">
            Your heroic dashboard awaits. Ready for new quests?
          </p>
        </div>

        {/* Character Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl gold-text mb-2">💰 {character.gold}</div>
            <div className="text-sm text-gray-400">Gold</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl xp-text mb-2">⚡ {character.xp}</div>
            <div className="text-sm text-gray-400">Experience</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl gem-text mb-2">💎 {character.gems}</div>
            <div className="text-sm text-gray-400">Gems</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl text-primary-400 mb-2">🏅 {character.honorPoints}</div>
            <div className="text-sm text-gray-400">Honor Points</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Quest Dashboard */}
        <QuestDashboard
          onError={handleError}
          onLoadQuestsRef={(loadQuests) => {
            dashboardLoadQuestsRef.current = loadQuests;
          }}
        />

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